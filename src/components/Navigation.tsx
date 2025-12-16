import { NavLink } from "@/components/NavLink";
import { Home, TrendingUp, BarChart3, Upload, Clock, Settings } from "lucide-react";

const Navigation = () => {
  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/prediction", label: "Prediction", icon: TrendingUp },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/upload", label: "Upload Data", icon: Upload },
    { to: "/history", label: "History", icon: Clock },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed top-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-primary">
            Sales Forecaster
          </div>
          
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                activeClassName="text-primary bg-primary/10"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
