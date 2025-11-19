import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { DateRange } from "react-day-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useToast } from '@/hooks/use-toast';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
} from 'chart.js';

// Register required Chart.js components (prevents "not a registered scale" errors)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  Filler,
);
import { useAuth } from '@/contexts/AuthContext';

interface SalesData {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: {
    id: number;
    name: string;
    sales: number;
    revenue: number;
  }[];
  salesByDate: {
    date: string;
    sales: number;
    revenue: number;
  }[];
}

const SalesAnalytics = () => {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [preset, setPreset] = useState<string>('last7');
  const { toast } = useToast();

  const { token } = useAuth();

  useEffect(() => {
    loadSalesData();
  }, [dateRange, token]);

  // Sync preset -> dateRange whenever preset changes (except 'custom')
  useEffect(() => {
    if (!preset || preset === 'custom') return;
    const now = new Date();
    let from: Date | undefined;
    switch (preset) {
      case '1':
        from = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        break;
      case 'last7':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'last180':
        from = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'last365':
        from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = undefined;
    }

    if (from) {
      setDateRange({ from, to: now });
    }
  }, [preset]);

  const loadSalesData = async () => {
    try {
      const startDate = dateRange?.from?.toISOString().split('T')[0];
      const endDate = dateRange?.to?.toISOString().split('T')[0];
      
      // Pass admin token for authenticated endpoints
      const apiRes = await ApiClient.adminGetSalesReport(startDate, endDate, token);

      // Normalize backend response into SalesData shape expected by the UI
      // Backend returns: { success, summary: { total_orders, total_sales, avg_order_value, ... }, top_perfumes: [...], daily_sales: [...] }
      const summary = apiRes?.summary || {};
      // Normalize top products from various backend shapes
      const rawTop = apiRes?.top_perfumes || apiRes?.topPerfumes || apiRes?.topProducts || apiRes?.top_products || [];
      const top = (Array.isArray(rawTop) ? rawTop : []).map((p: any) => {
        const nested = p?.perfume || p?.product || {};
        const id = Number(p.id ?? p.perfume_id ?? p.product_id ?? nested.id ?? 0) || 0;
        const name = String(p.name ?? p.title ?? p.product_name ?? nested.name ?? nested.title ?? 'Unknown');

        const salesVal = p.total_quantity ?? p.total_quantity_sold ?? p.total_sold ?? p.sales ?? p.orders ?? p.num_orders ?? p.count ?? nested.total_sold ?? nested.total_quantity ?? 0;
        const sales = Number(salesVal) || 0;

        const revenueVal = p.total_revenue ?? p.revenue ?? p.total_sales ?? nested.total_revenue ?? nested.revenue ?? 0;
        const revenue = Number(revenueVal) || 0;

        return { id, name, sales, revenue };
      });

      const salesByDate = (apiRes?.daily_sales || apiRes?.dailySales || []).map((d: any) => ({
        date: d.date || d.date_string || d.day || '',
        sales: Number(d.orders ?? d.sales ?? 0),
        revenue: Number(d.revenue ?? 0),
      }));

      const transformed = {
        totalSales: Number(summary.total_orders || 0),
        totalRevenue: Number(summary.total_sales || 0),
        averageOrderValue: Number(summary.avg_order_value || summary.avgOrderValue || 0),
        topProducts: top,
        salesByDate: salesByDate,
      };

      setSalesData(transformed);
    } catch (err) {
      console.error('Failed to load sales data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load sales analytics.',
        variant: 'destructive',
      });
    }
  };

  if (!salesData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Range</label>
          <Select value={preset} onValueChange={(v) => setPreset(v)}>
            <SelectTrigger className="w-48 rounded-lg h-11 px-3">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 day</SelectItem>
              <SelectItem value="last7">Last 7 days</SelectItem>
              <SelectItem value="last30">Last month</SelectItem>
              <SelectItem value="last90">Last 3 months</SelectItem>
              <SelectItem value="last180">Last 6 months</SelectItem>
              <SelectItem value="last365">Last 1 year</SelectItem>
              <SelectItem value="custom">Pick a date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Show the date picker when custom selected or always allow override */}
        <div>
          {preset === 'custom' ? (
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          ) : (
            <DatePickerWithRange date={dateRange} onDateChange={(d) => { setDateRange(d); setPreset('custom'); }} />
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-40">
          <CardHeader>
            <CardTitle className="text-2xl">Total Sales</CardTitle>
            <CardDescription>Number of items sold</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold text-emerald-600">{salesData.totalSales}</p>
          </CardContent>
        </Card>
        <Card className="h-40">
          <CardHeader>
            <CardTitle className="text-2xl">Total Revenue</CardTitle>
            <CardDescription>Gross revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold text-emerald-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(salesData.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="h-40">
          <CardHeader>
            <CardTitle className="text-2xl">Average Order Value</CardTitle>
            <CardDescription>Revenue per order</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold text-emerald-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(salesData.averageOrderValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts: place Sales Trends and Top Products side-by-side for consistent alignment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Sales Trends</CardTitle>
            <CardDescription>Sales and revenue over time</CardDescription>
          </CardHeader>
          <CardContent className="h-44">
            <Line
              height={160}
              data={{
                labels: salesData.salesByDate.map(d => d.date),
                datasets: [
                  {
                    label: 'Sales',
                    data: salesData.salesByDate.map(d => d.sales),
                    borderColor: 'rgb(59, 130, 246)',
                    tension: 0.1,
                  },
                  {
                    label: 'Revenue',
                    data: salesData.salesByDate.map(d => d.revenue),
                    borderColor: 'rgb(16, 185, 129)',
                    tension: 0.1,
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products by sales</CardDescription>
          </CardHeader>
          <CardContent className="h-44">
            <Bar
              height={160}
              data={{
                labels: salesData.topProducts.map(p => p.name),
                datasets: [{
                  label: 'Sales',
                  data: salesData.topProducts.map(p => p.sales),
                  backgroundColor: 'rgba(59, 130, 246, 0.5)',
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Top Products Details table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products Details</CardTitle>
          <CardDescription>Detailed view of best performing products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Units Sold</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Avg Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData.topProducts.map((p) => {
                  const units = Number(p.sales || 0) || 0;
                  const revenue = Number(p.revenue || 0) || 0;
                  const avg = units > 0 ? revenue / units : revenue;
                  const formatINR = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{units}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{formatINR(revenue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{formatINR(avg)}</td>
                    </tr>
                  );
                })}
                {salesData.topProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No top products available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesAnalytics;