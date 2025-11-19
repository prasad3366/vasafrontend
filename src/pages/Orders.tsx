import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function Orders() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper: format order date/time into `Nov 19, 2025 • 15:23` style
  const formatOrderDate = (o: any) => {
    if (!o) return '';
    const candidates = [o.created_at, o.createdAt, o.order_date, o.date, o.datetime, o.timestamp];
    let ts: number | undefined;
    for (const c of candidates) {
      if (!c) continue;
      const t = Date.parse(String(c));
      if (!isNaN(t)) {
        ts = t;
        break;
      }
    }
    if (!ts && o.date && o.time) {
      const t2 = Date.parse(`${o.date} ${o.time}`);
      if (!isNaN(t2)) ts = t2;
    }
    if (!ts) return (o.date ? `${o.date}${o.time ? ' • ' + o.time : ''}` : '');

    const d = new Date(ts);
    const datePart = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
    const timePart = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
    return `${datePart} • ${timePart}`;
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        // Request full order history for the user. Try /orders first, then fall back to recent-orders.
        let res = await fetch(`${API_BASE}/orders`, { headers: { Authorization: token } });
        if (!res.ok) {
          // Fallback to older endpoint if /orders not available
          res = await fetch(`${API_BASE}/recent-orders`, { headers: { Authorization: token } });
        }

        const data = await res.json();

        // Try multiple shapes returned by different backends
        let list = data.orders || data.data || data.user_orders || data.recent_orders || data.recentOrders || [];
        if (!Array.isArray(list)) {
          if (Array.isArray(data)) list = data;
          else list = [];
        }

        // Normalize: ensure newest orders first. Try common timestamp fields.
        const toTs = (o: any) => {
          if (!o) return 0;
          const candidates = [o.created_at, o.createdAt, o.order_date, o.date, o.datetime, o.timestamp];
          for (const c of candidates) {
            if (!c) continue;
            const t = Date.parse(String(c));
            if (!isNaN(t)) return t;
          }
          // try combine date+time
          if (o.date && o.time) {
            const t = Date.parse(`${o.date} ${o.time}`);
            if (!isNaN(t)) return t;
          }
          // fallback to order id numeric
          return Number(o.order_id || o.id || 0) || 0;
        };

        list.sort((a: any, b: any) => toTs(b) - toTs(a));

        setOrders(list);
      } catch (e) {
        console.error('Failed to load orders', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, token, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
  <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Orders</h1>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Loading your orders...</div>}

        {!loading && orders.length === 0 && (
          <div className="text-sm text-muted-foreground">You have not placed any orders yet.</div>
        )}

        <div className="space-y-6">
          {orders.map((o) => (
            <div key={o.order_id} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-muted-foreground">{o.date} • {o.time} • {o.city}</div>
                  {/* Additional order details shown below the date so customers can see order metadata */}
                  <div className="mt-2 text-sm">
                    <div><strong>Order ID:</strong> {o.order_id ?? o.id ?? '—'}</div>
                    <div><strong>Status:</strong> {o.status ?? o.order_status ?? o.order_state ?? 'Pending'}</div>
                    <div><strong>Payment:</strong> {o.payment_method ?? o.payment ?? '—'}</div>
                    { (o.shipping_address || o.address || o.city || o.phone) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {o.shipping_address || o.address || (o.city ? `${o.city}${o.state ? ', ' + o.state : ''}` : '')}
                        {o.phone ? ` • ${o.phone}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{formatOrderDate(o)}</div>
                  <div className="font-semibold text-lg">₹{o.grand_total}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {o.items.map((it) => {
                  // Determine best image source: support multiple possible fields and fallbacks
                  const candidate = it.photo || it.image || it.photo_url || (it.images && it.images[0]) || (it.perfume_id ? `${API_BASE}/perfumes/photo/${it.perfume_id}` : null);
                  const imgSrc = candidate
                    ? (/^https?:\/\//i.test(candidate) || candidate.startsWith('/')
                        ? candidate
                        : `${API_BASE.replace(/\/$/, '')}/${String(candidate).replace(/^\//, '')}`)
                    : '/images/placeholder.png';

                  return (
                    <div key={`${o.order_id}-${it.perfume_id ?? it.id ?? it.name}`} className="flex items-center gap-3">
                      <img
                        src={imgSrc}
                        alt={it.name}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (img.src !== '/images/placeholder.png') img.src = '/images/placeholder.png'; }}
                      />
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-sm text-muted-foreground">Qty: {it.quantity}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        
      </main>
      <Footer />
    </div>
  );
}
