"""
Ready-to-apply route-level patch for /cart/checkout with CORS preflight handling.

How to use:
1. Install flask-cors in your backend virtualenv: pip install flask-cors
2. Import `cross_origin` from `flask_cors` and paste the route into the blueprint file where `cart_bp` is defined.
   Ensure the `cross_origin` decorator is placed above the `@jwt_required` decorator so OPTIONS preflight is handled
   before JWT validation.
3. Restart your Flask app and run the curl OPTIONS test (see below) or try the frontend checkout.

Notes:
- This file is a standalone copy — do NOT add it to your frontend repo. Instead copy the route body into your
  existing blueprint (the file that defines `cart_bp`) or ask me to produce a diff if you tell me that file's path.
- The cross_origin origins should be set to your dev origin (for example: http://localhost:5173). In production
  set the proper origin(s).
"""

from flask import request, jsonify
from flask_cors import cross_origin

# Replace this import with your blueprint object and DB/utility imports
# from your app. Example: from . import cart_bp, get_db_connection, logger
# Below we assume `cart_bp` is already defined in your blueprint module.

try:
    # Try to import names commonly present in blueprint modules
    from . import cart_bp, get_db_connection, logger
except Exception:
    # Fallback dummy variables for this patch file. When you paste into your app, remove these.
    cart_bp = None
    def get_db_connection():
        raise RuntimeError('Replace this stub with your get_db_connection implementation')
    import logging
    logger = logging.getLogger(__name__)


# ==================== ADD TO YOUR EXISTING FILE (bottom) ====================
@cart_bp.route('/checkout', methods=['POST', 'OPTIONS'])
@cross_origin(origin='http://localhost:5173', supports_credentials=True, allow_headers=['Content-Type', 'Authorization'])
@jwt_required
def checkout():
    user_id = request.user_id
    data = request.get_json(silent=True) or {}

    # === STRICT VALIDATION ===
    required = ['shipping', 'payment_method', 'items', 'totalPrice', 'tax', 'shippingCost']
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    shipping = data['shipping']
    payment_method = data['payment_method'].lower()
    items = data['items']
    card_details = data.get('card_details', {})

    if payment_method not in ['card', 'cod']:
        return jsonify({"error": "payment_method must be 'card' or 'cod'"}), 400

    if not items or not isinstance(items, list):
        return jsonify({"error": "Items must be a non-empty list"}), 400

    # Validate shipping
    ship_keys = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip']
    for key in ship_keys:
        if not shipping.get(key) or not str(shipping[key]).strip():
            return jsonify({"error": f"Shipping {key} is required and cannot be empty"}), 400

    # Validate card if needed
    if payment_method == 'card':
        card_keys = ['cardName', 'cardNumber', 'expiry', 'cvv']
        for key in card_keys:
            value = card_details.get(key)
            if not value or not str(value).strip():
                return jsonify({"error": f"Card {key} is required"}), 400
            if key == 'cardNumber' and (len(value.replace(' ', '')) < 13 or len(value.replace(' ', '')) > 19):
                return jsonify({"error": "Invalid card number"}), 400
            if key == 'cvv' and not (value.isdigit() and len(value) in [3, 4]):
                return jsonify({"error": "CVV must be 3 or 4 digits"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 500

    cursor = conn.cursor()

    try:
        # === 1. Create Order ===
        cursor.execute("""
            INSERT INTO orders (
                user_id, total_amount, shipping_cost, tax_amount,
                shipping_first_name, shipping_last_name, shipping_email,
                shipping_phone, shipping_address, shipping_city,
                shipping_state, shipping_zip, payment_method, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            float(data['totalPrice']),
            float(data['shippingCost']),
            float(data['tax']),
            shipping['firstName'].strip(),
            shipping['lastName'].strip(),
            shipping['email'].strip().lower(),
            shipping['phone'].strip(),
            shipping['address'].strip(),
            shipping['city'].strip(),
            shipping['state'].strip(),
            shipping['zip'].strip(),
            payment_method,
            'pending'
        ))
        order_id = cursor.lastrowid

        # === 2. Process Items & Deduct Stock ===
        for item in items:
            try:
                perfume_id = int(item['perfume_id'])
                quantity = int(item['quantity'])
                size = item.get('selectedSize') or None
                unit_price = float(item['price'])
            except (KeyError, ValueError, TypeError):
                conn.rollback()
                return jsonify({"error": "Invalid item data format"}), 400

            if quantity <= 0:
                return jsonify({"error": "Quantity must be positive"}), 400

            # Check availability
            cursor.execute("SELECT quantity, name FROM perfumes WHERE id = %s AND available = 1", (perfume_id,))
            perfume = cursor.fetchone()
            if not perfume:
                conn.rollback()
                return jsonify({"error": f"Perfume ID {perfume_id} not found or unavailable"}), 404

            if perfume['quantity'] < quantity:
                conn.rollback()
                return jsonify({
                    "error": f"Only {perfume['quantity']} left of {perfume['name']}"
                }), 400

            # Add to order
            cursor.execute("""
                INSERT INTO order_items (order_id, perfume_id, quantity, size, unit_price)
                VALUES (%s, %s, %s, %s, %s)
            """, (order_id, perfume_id, quantity, size, unit_price))

            # Deduct stock
            cursor.execute("UPDATE perfumes SET quantity = quantity - %s WHERE id = %s", (quantity, perfume_id))

        # === 3. Save Card (masked) ===
        if payment_method == 'card':
            last4 = str(card_details['cardNumber']).replace(' ', '')[-4:]
            cursor.execute("""
                INSERT INTO payment_details 
                (order_id, payment_method, card_last4, card_holder_name, expiry)
                VALUES (%s, %s, %s, %s, %s)
            """, (order_id, 'card', last4, card_details['cardName'], card_details['expiry']))

        # === 4. Clear Cart ===
        cursor.execute("DELETE FROM carts WHERE user_id = %s", (user_id,))

        # === 5. Final Status ===
        final_status = 'paid' if payment_method == 'card' else 'cod_pending'
        cursor.execute("UPDATE orders SET status = %s WHERE id = %s", (final_status, order_id))

        conn.commit()

        return jsonify({
            "message": "Order placed successfully!",
            "order_id": order_id,
            "status": final_status,
            "payment_method": payment_method,
            "total": float(data['totalPrice']) + float(data['shippingCost']) + float(data['tax'])
        }), 201

    except Exception as e:
        conn.rollback()
        logger.error(f"Checkout failed (user {user_id}): {str(e)}")
        return jsonify({"error": "Order failed. Please try again later."}), 500
    finally:
        cursor.close()
        conn.close()


# === GET USER ORDERS (with items) ===
@cart_bp.route('/orders', methods=['GET'])
@jwt_required
def get_orders():
    user_id = request.user_id
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Server error"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                id, total_amount, status, payment_method, created_at,
                shipping_first_name, shipping_last_name, shipping_city,
                shipping_address, shipping_zip
            FROM orders 
            WHERE user_id = %s 
            ORDER BY created_at DESC
        """, (user_id,))
        orders = cursor.fetchall()

        for order in orders:
            cursor.execute("""
                SELECT 
                    oi.perfume_id, p.name, oi.quantity, oi.size, 
                    oi.unit_price, (oi.quantity * oi.unit_price) as subtotal
                FROM order_items oi
                JOIN perfumes p ON oi.perfume_id = p.id
                WHERE oi.order_id = %s
            """, (order['id'],))
            order['items'] = cursor.fetchall()

        return jsonify({"orders": orders}), 200

    except Exception as e:
        logger.error(f"Get orders failed (user {user_id}): {e}")
        return jsonify({"error": "Failed to load orders"}), 500
    finally:
        conn.close()

        # route level change
