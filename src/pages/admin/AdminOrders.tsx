import React, { useEffect, useState } from 'react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';

const AdminOrders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<any | undefined>(undefined);
  const { toast } = useToast();

  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : undefined);

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const start = dateRange?.from ? formatDate(dateRange.from) : undefined;
      const end = dateRange?.to ? formatDate(dateRange.to) : undefined;
      console.debug('[AdminOrders] loadOrders called with:', {
        page,
        statusFilter,
        start,
        end,
      });
      const res = await ApiClient.adminGetAllOrders(page, limit, statusFilter, start, end, token);
      // Expecting { orders: [...], meta: { page, limit, total, pages } }
      const fetched = res.orders || res.data || [];
      // Sort orders by date descending (most recent first). Try several common date fields.
      const getOrderTime = (o: any) => {
        const d = o.created_at ?? o.createdAt ?? o.placed_at ?? o.placedAt ?? o.date ?? o.order_date ?? '';
        const t = Date.parse(d);
        return isNaN(t) ? 0 : t;
      };
      fetched.sort((a: any, b: any) => getOrderTime(b) - getOrderTime(a));
      setOrders(fetched);
      if (res.meta) {
        setTotalPages(res.meta.pages || 1);
      }
    } catch (err: any) {
      console.error('Failed to load admin orders', err);
      toast({ title: 'Error', description: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Export all orders to CSV (Excel-friendly). Fetches all pages.
  const exportAllOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const all: any[] = [];
      let p = 1;
      const pageLimit = 200; // fetch in reasonably large pages
      while (true) {
        const res = await ApiClient.adminGetAllOrders(p, pageLimit, statusFilter, formatDate(dateRange?.from), formatDate(dateRange?.to), token);
        const pageOrders = res.orders || res.data || [];
        all.push(...pageOrders);
        // stop when no more pages or fewer results returned
        if (!res.meta || (res.meta.pages && p >= res.meta.pages) || pageOrders.length < pageLimit) break;
        p += 1;
      }

      if (all.length === 0) {
        toast({ title: 'No orders', description: 'No orders to export for the selected filters.' });
        return;
      }

      // Build CSV
      const headers = [
        'Order ID','Placed At','Status','Username','Total Amount','Shipping Cost','Tax Amount','Shipping Name','Shipping Address','Shipping City','Shipping State','Shipping Zip','Shipping Phone','Shipping Email','Items'
      ];

      const rows = all.map((o: any) => {
        const items = (o.items || []).map((it: any) => `${it.perfume_name || it.name || it.product_name || it.perfume_id} x${it.quantity || it.qty || 1}`).join(' | ');
        const shippingName = `${o.shipping_first_name || ''} ${o.shipping_last_name || ''}`.trim();
        const address = `${o.shipping_address || ''}`;
        return [
          safeCsv(o.id),
          safeCsv(o.created_at || o.placed_at || ''),
          safeCsv(o.status || ''),
          safeCsv(o.username || o.user_name || `User ${o.user_id}` || ''),
          safeCsv(o.total_amount ?? o.total ?? ''),
          safeCsv(o.shipping_cost ?? ''),
          safeCsv(o.tax_amount ?? ''),
          safeCsv(shippingName),
          safeCsv(address),
          safeCsv(o.shipping_city || ''),
          safeCsv(o.shipping_state || ''),
          safeCsv(o.shipping_zip || ''),
          safeCsv(o.shipping_phone || ''),
          safeCsv(o.shipping_email || ''),
          safeCsv(items),
        ].join(',');
      });

      function safeCsv(v: any) {
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/"/g, '""');
        // wrap in quotes if contains comma or newline
        return (`"${s}"`);
      }

      const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
      a.download = `vasa-orders-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: 'Export started', description: `Exported ${all.length} orders. File download should begin.` });
    } catch (err: any) {
      console.error('Failed to export orders', err);
      toast({ title: 'Error', description: 'Failed to export orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [token, page, dateRange, statusFilter]);

  const prev = () => setPage(p => Math.max(1, p - 1));
  const next = () => setPage(p => Math.min(totalPages || 1, p + 1));

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-8">
        <AdminNavigation />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">All Orders</h1>
          <div className="text-sm text-muted-foreground">Showing page {page}</div>
        </div>

        <div className="mb-6 bg-background border rounded p-4 flex flex-col md:flex-row md:items-center md:gap-4">
          <div className="flex items-center gap-3 mb-3 md:mb-0">
            <label className="text-sm font-medium mr-2">Status</label>
            <select
              className="h-10 rounded-md border px-3"
              value={statusFilter ?? ''}
              onChange={(e) => { setStatusFilter(e.target.value || undefined); setPage(1); }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-3 mb-3 md:mb-0">
            <label className="text-sm font-medium mr-2">Date Range</label>
            <DatePickerWithRange date={dateRange} onDateChange={(d) => { 
              console.debug('[AdminOrders] Date range changed:', d);
              setDateRange(d);
            }} />
          </div>

          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              onClick={() => { 
                console.debug('[AdminOrders] Apply button clicked with filters:', { statusFilter, dateRange });
                setPage(1);
              }}
            >Apply</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { 
                console.debug('[AdminOrders] Clear button clicked');
                // Reset filters and show today's orders
                setStatusFilter(undefined);
                const today = new Date();
                setDateRange({ from: today, to: today });
                setPage(1);
              }}
            >Clear</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                console.debug('[AdminOrders] Export button clicked - exporting orders');
                exportAllOrders();
              }}
            >Export</Button>
          </div>
        </div>

        {loading && <div>Loading...</div>}

        {orders.length === 0 && !loading && (
          <div className="text-muted-foreground">No orders found.</div>
        )}

        {orders.map((o: any) => (
          <section key={o.id} className="mb-8 border rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-semibold">Order #{o.id}</div>
                <div className="text-sm text-muted-foreground">By {o.username || o.user_name || `User ${o.user_id}`}</div>
                <div className="text-sm">Status: {o.status}</div>
                <div className="text-sm">Total: {o.total_amount} | Shipping: {o.shipping_cost} | Tax: {o.tax_amount}</div>
                <div className="text-sm">Placed: {o.created_at}</div>
              </div>
              <div className="text-right">
                <div>{o.shipping_first_name} {o.shipping_last_name}</div>
                <div className="text-sm">{o.shipping_address}, {o.shipping_city} {o.shipping_state} {o.shipping_zip}</div>
                <div className="text-sm">{o.shipping_phone} • {o.shipping_email}</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item ID</TableHead>
                    <TableHead>Perfume</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(o.items || []).map((it: any) => (
                    <TableRow key={it.id || `${o.id}-${it.perfume_id}` }>
                      <TableCell>{it.id || ''}</TableCell>
                      <TableCell>{it.perfume_name || it.name || it.perfume_id}</TableCell>
                      <TableCell>{it.quantity || it.qty || it.q || 1}</TableCell>
                      <TableCell>{it.price || it.unit_price || it.total_price}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ))}

        <div className="flex items-center justify-between mt-6">
          <div>Page {page} of {totalPages || 1}</div>
          <div className="flex gap-2">
            <Button type="button" onClick={prev} disabled={page <= 1}>Previous</Button>
            <Button type="button" onClick={next} disabled={page >= (totalPages || 1)}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
