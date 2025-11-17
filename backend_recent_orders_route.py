# Add this route to your Flask backend (register blueprint or place inside appropriate module)
# This implementation is the same as you provided; adjust `request.user_id` according to your JWT helper
# (commonly you'd use `get_jwt_identity()` from flask_jwt_extended).

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

cart_bp = Blueprint('cart', __name__)

@cart_bp.route('/recent-orders', methods=['GET'])
@jwt_required()
def recent_orders():
    # If you use get_jwt_identity, swap accordingly
    try:
        user_id = get_jwt_identity()
    except Exception:
        # fallback to your request.user_id if your project sets it differently
        user_id = getattr(request, 'user_id', None)

    if not user_id:
        return jsonify({"recent_orders": [], "count": 0, "message": "Unauthorized"}), 401

    limit = request.args.get('limit', 5, type=int)
    if limit < 1: limit = 1
    if limit > 20: limit = 20

    conn = get_db_connection()  # implement or import your DB helper
    if not conn:
        return jsonify({"recent_orders": [], "count": 0, "message": "Loading..."}), 200

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, total_amount, shipping_cost, tax_amount, status, 
                   payment_method, created_at, shipping_city
            FROM orders 
            WHERE user_id = %s 
            ORDER BY created_at DESC 
            LIMIT %s
        """, (user_id, limit))

        orders = cursor.fetchall()
        if not orders:
            return jsonify({"recent_orders": [], "count": 0, "message": "No orders yet"}), 200

        result = []
        base_url = request.host_url.rstrip('/')

        for order in orders:
            order_id = order['id']
            cursor.execute("""
                SELECT p.name, oi.quantity, oi.unit_price, oi.perfume_id
                FROM order_items oi
                JOIN perfumes p ON oi.perfume_id = p.id
                WHERE oi.order_id = %s
            """, (order_id,))
            items = cursor.fetchall()

            order_data = {
                "order_id": order_id,
                "date": order['created_at'].strftime("%d %b %Y"),
                "time": order['created_at'].strftime("%I:%M %p"),
                "city": order.get('shipping_city'),
                "status": order.get('status'),
                "grand_total": round(float(order['total_amount']) + float(order.get('shipping_cost') or 0) + float(order.get('tax_amount') or 0), 2),
                "items": [
                    {
                        "name": item['name'],
                        "quantity": item['quantity'],
                        "photo": f"{base_url}/perfumes/photo/{item['perfume_id']}"
                    } for item in items
                ],
                "items_count": len(items)
            }
            result.append(order_data)

        return jsonify({
            "recent_orders": result,
            "count": len(result),
            "message": "Your latest orders"
        }), 200

    except Exception as e:
        # make sure you have a logger available in your backend
        print(f"User {user_id} recent orders: {e}")
        return jsonify({"recent_orders": [], "count": 0, "message": "Try again"}), 200
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

# NOTE: Add this blueprint to your Flask app: app.register_blueprint(cart_bp, url_prefix='/api')
# Adjust URL paths and authentication helpers as needed for your project.
