import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// NOTE: Humne API_BASE_URL import hata diya hai aur direct link use karenge

const fallbackSalesData = [
  { month: "Jan", sales: 12400, forecast: 11800, orders: 245 },
  { month: "Feb", sales: 15600, forecast: 15200, orders: 312 },
  { month: "Mar", sales: 18900, forecast: 18400, orders: 378 },
  { month: "Apr", sales: 21200, forecast: 21800, orders: 424 },
  { month: "May", sales: 24500, forecast: 24100, orders: 490 },
  { month: "Jun", sales: 27800, forecast: 28200, orders: 556 },
];

const fallbackCategoryData = [
  { name: "Electronics", value: 35, color: "hsl(var(--chart-1))" },
  { name: "Clothing", value: 25, color: "hsl(var(--chart-2))" },
  { name: "Food", value: 20, color: "hsl(var(--chart-3))" },
  { name: "Home", value: 15, color: "hsl(var(--chart-4))" },
  { name: "Sports", value: 5, color: "hsl(var(--chart-5))" },
];

const fallbackRegionData = [
  { region: "North", sales: 45200, growth: 12 },
  { region: "South", sales: 38900, growth: 8 },
  { region: "East", sales: 52100, growth: 15 },
  { region: "West", sales: 41800, growth: 10 },
  { region: "Central", sales: 35600, growth: 6 },
];

const Analytics = () => {
  const [salesData, setSalesData] = useState<any[]>(fallbackSalesData);
  const [categoryData, setCategoryData] = useState<any[]>(fallbackCategoryData);
  const [regionData, setRegionData] = useState<any[]>(fallbackRegionData);
  const [monthlyOrders, setMonthlyOrders] = useState<any[]>([]);

  // 👇 Yahan aapka bataya hua Link laga diya hai
  const BACKEND_URL = "https://project-backend-lfn1.onrender.com";

  const load = async () => {
    try {
      // Direct URL use kar rahe hain
      const res = await fetch(`${BACKEND_URL}/analytics`);
      
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      
      // Convert backend format into charts format
      const monthsFromBackend = json.monthlyOrders || [];
      const monthMap: Record<string, number> = {};
      monthsFromBackend.forEach((m: any) => (monthMap[m.month] = m.orders));

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const newSalesData = months.slice(0, 6).map((m, idx) => ({
        month: m,
        sales: (json.regions && json.regions[0] && json.regions[0].sales / 6) || fallbackSalesData[idx]?.sales || 0,
        forecast: ((json.regions && json.regions[0] && json.regions[0].sales / 6) || 0) * 0.95,
        orders: monthMap[m] ?? fallbackSalesData[idx]?.orders ?? 0,
      }));

      setSalesData(newSalesData);

      if (json.categories && json.categories.length) {
        const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
        setCategoryData(json.categories.map((c: any, i: number) => ({ ...c, color: colors[i % colors.length] })));
      } else {
        setCategoryData(fallbackCategoryData);
      }

      if (json.regions && json.regions.length) {
        setRegionData(json.regions.map((r: any) => ({ region: r.name ?? r.region, sales: r.sales, growth: r.growth })));
      } else {
        setRegionData(fallbackRegionData);
      }

      if (json.monthlyOrders) {
        setMonthlyOrders(json.monthlyOrders);
      } else {
        setMonthlyOrders(monthlyOrders);
      }
    } catch (e) {
      console.warn("Analytics load failed:", e);
    }
  };

  useEffect(() => {
    load();
    const handler = () => {
      load();
    };
    window.addEventListener("data-updated", handler);
    return () => window.removeEventListener("data-updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights into your sales performance and trends</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="regions">Regions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Sales vs Forecast</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} name="Actual Sales" />
                    <Line type="monotone" dataKey="forecast" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Order Trends</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyOrders.length ? monthlyOrders : salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Area type="monotone" dataKey="orders" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Orders" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" name="Sales Share %" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="regions" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Regional Sales Performance</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="region" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" name="Sales ($)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="growth" fill="hsl(var(--accent))" name="Growth (%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;