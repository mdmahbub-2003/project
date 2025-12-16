import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Users, ShoppingCart, Target, BarChart3, Lock, RefreshCw, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Note: API_BASE_URL import hata diya hai

const Home = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    growthRate: "+0.0%",
    activeCustomers: "0",
    totalOrders: "0",
  });

  const features = [
    {
      icon: Target,
      title: "Accurate Predictions",
      description: "Machine learning models trained on historical data for precise sales forecasting.",
    },
    {
      icon: BarChart3,
      title: "Visual Analytics",
      description: "Interactive charts and graphs to understand trends and patterns at a glance.",
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set targets and monitor progress with real-time updates and notifications.",
    },
    {
      icon: RefreshCw,
      title: "Real-time Updates",
      description: "Get instant insights as new data flows in, keeping you always informed.",
    },
    {
      icon: Lock,
      title: "Secure & Reliable",
      description: "Enterprise-grade security ensuring your data is protected and always available.",
    },
    {
      icon: Database,
      title: "Data Integration",
      description: "Seamlessly import data from CSV, Excel, and other sources.",
    },
  ];

  // 👇 Direct Backend Link
  const BACKEND_URL = "https://project-backend-lfn1.onrender.com";

  const load = async () => {
    try {
      // Direct URL use kar rahe hain
      const res = await fetch(`${BACKEND_URL}/analytics`);
      
      if (!res.ok) throw new Error("No analytics");
      const json = await res.json();
      
      setMetrics({
        growthRate: `${json.growthRate ?? 0}%`,
        activeCustomers: (json.activeCustomers ?? 0).toLocaleString(),
        totalOrders: (json.totalOrders ?? 0).toLocaleString(),
      });
    } catch (e) {
      // keep defaults if backend missing
      console.warn("Home analytics failed:", e);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("data-updated", handler);
    return () => window.removeEventListener("data-updated", handler);
  }, []);

  const metricList = [
    { label: "Growth Rate", value: metrics.growthRate, icon: TrendingUp, color: "text-green-500" },
    { label: "Active Customers", value: metrics.activeCustomers, icon: Users, color: "text-blue-500" },
    { label: "Total Orders", value: metrics.totalOrders, icon: ShoppingCart, color: "text-purple-500" },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Predictive Model for Sales
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Harness the power of AI to forecast future sales, optimize inventory, and drive business growth with data-driven insights.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/prediction")} className="shadow-lg">
              Start Predicting
              <TrendingUp className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/analytics")}>
              View Analytics
            </Button>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metricList.map((metric) => (
            <Card key={metric.label} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-secondary ${metric.color}`}>
                  <metric.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
          <p className="text-muted-foreground">Everything you need to make informed decisions about your sales strategy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;