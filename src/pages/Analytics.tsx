import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

/* 🔗 BACKEND LINK */
const BACKEND_URL = "https://project-backend-new-amsy.onrender.com";

/* ---------------- Fallback Data ---------------- */
const fallbackSalesData = [
  { month: "Jan", sales: 12000, forecast: 11500, orders: 200 },
  { month: "Feb", sales: 15000, forecast: 14500, orders: 260 },
  { month: "Mar", sales: 18000, forecast: 17500, orders: 320 },
  { month: "Apr", sales: 21000, forecast: 20500, orders: 380 },
  { month: "May", sales: 24000, forecast: 23500, orders: 450 },
  { month: "Jun", sales: 27000, forecast: 26500, orders: 520 },
];

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const Analytics = () => {
  const [salesData, setSalesData] = useState<any[]>(fallbackSalesData);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any[]>([]);
  const [monthlyOrders, setMonthlyOrders] = useState<any[]>([]);

  /* ✅ Pie percent label helper */
  const renderPercentLabel = (entry: any, total: number) => {
    if (!total) return entry.name;
    const percent = ((entry.value / total) * 100).toFixed(1);
    return `${percent}%`;
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/analytics`);
      if (!res.ok) throw new Error("Failed to load analytics");

      const json = await res.json();

      if (json.monthlyOrders?.length) {
        setMonthlyOrders(json.monthlyOrders);
      }

      if (json.regions?.length) {
        const totalSales = json.regions.reduce(
          (sum: number, r: any) => sum + r.sales,
          0
        );

        const derived = fallbackSalesData.map((m) => ({
          month: m.month,
          sales: Math.round(totalSales / 6),
          forecast: Math.round((totalSales / 6) * 0.95),
          orders:
            json.monthlyOrders?.find((o: any) => o.month === m.month)
              ?.orders ?? m.orders,
        }));

        setSalesData(derived);
      }

      if (json.categories?.length) {
        setCategoryData(
          json.categories.map((c: any, i: number) => ({
            name: c.name,
            value: c.value,
            color: COLORS[i % COLORS.length],
          }))
        );
      }

      if (json.regions?.length) {
        setRegionData(
          json.regions.map((r: any) => ({
            region: r.name,
            sales: r.sales,
            growth: r.growth,
          }))
        );
      }
    } catch (err) {
      console.warn("Using fallback analytics data", err);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const totalCategoryValue = categoryData.reduce(
    (s, c) => s + c.value,
    0
  );

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Sales insights powered by Random Forest ML model
        </p>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="regions">Regions</TabsTrigger>
          </TabsList>

          {/* ---------------- Overview ---------------- */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Sales vs Forecast</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="sales" stroke="hsl(var(--primary))" />
                    <Line
                      dataKey="forecast"
                      stroke="hsl(var(--accent))"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">
                  Sales by Category (%)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      outerRadius={110}
                      label={(entry) =>
                        renderPercentLabel(entry, totalCategoryValue)
                      }
                    >
                      {categoryData.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        `${((value / totalCategoryValue) * 100).toFixed(
                          1
                        )}%`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* ---------------- Trends ---------------- */}
          <TabsContent value="trends">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Monthly Orders</h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart
                  data={monthlyOrders.length ? monthlyOrders : salesData}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    dataKey="orders"
                    fill="hsl(var(--primary) / 0.3)"
                    stroke="hsl(var(--primary))"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* ---------------- Categories (BAR – NORMAL VALUES) ---------------- */}
          <TabsContent value="categories">
            <Card className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* ---------------- Regions ---------------- */}
          <TabsContent value="regions">
            <Card className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={regionData}>
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" />
                  <Bar dataKey="growth" fill="hsl(var(--accent))" />
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
