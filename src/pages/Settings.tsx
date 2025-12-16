// src/pages/Settings.tsx
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

const Settings = () => {
  const { toast } = useToast();
  const [payload, setPayload] = useState<any>({
    profile: { firstName: "", lastName: "", email: "", company: "" },
    model: { predictionModel: "advanced", defaultPeriod: 30, confidenceThreshold: 85 },
    notifications: { email: true, weekly: true, lowAccuracy: true },
    data: { autoUpdate: true, retentionYears: 2 },
  });
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      const json = await res.json();
      const p = json.payload ?? json;
      // Merge with defaults so UI fields always exist
      setPayload((prev: any) => ({
        profile: { ...prev.profile, ...(p.profile ?? {}) },
        model: { ...prev.model, ...(p.model ?? {}) },
        notifications: { ...prev.notifications, ...(p.notifications ?? {}) },
        data: { ...prev.data, ...(p.data ?? {}) },
      }));
    } catch (e) {
      console.warn("Settings fetch failed:", e);
      toast({
        title: "Could not load settings",
        description: "Using defaults — settings will save normally.",
      });
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Save failed");
      }

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully",
      });

      // Reload saved settings from backend into the form (ensures UI reflects server state)
      await fetchSettings();

      // Notify other pages to refresh analytics/history
      window.dispatchEvent(new Event("data-updated"));
    } catch (e: any) {
      console.error("Settings save error:", e);
      toast({
        title: "Save failed",
        description: e?.message ?? "Could not save settings. See console.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and application configuration</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={payload.profile?.firstName || ""}
                    onChange={(e) => setPayload({ ...payload, profile: { ...payload.profile, firstName: e.target.value } })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={payload.profile?.lastName || ""}
                    onChange={(e) => setPayload({ ...payload, profile: { ...payload.profile, lastName: e.target.value } })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={payload.profile?.email || ""}
                  onChange={(e) => setPayload({ ...payload, profile: { ...payload.profile, email: e.target.value } })}
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Your company name"
                  value={payload.profile?.company || ""}
                  onChange={(e) => setPayload({ ...payload, profile: { ...payload.profile, company: e.target.value } })}
                />
              </div>
            </div>
          </Card>

          {/* Model Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Model Configuration</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="modelType">Prediction Model</Label>
                <Select
                  value={payload.model?.predictionModel || "advanced"}
                  onValueChange={(v) => setPayload({ ...payload, model: { ...payload.model, predictionModel: v } })}
                >
                  <SelectTrigger id="modelType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Model</SelectItem>
                    <SelectItem value="advanced">Advanced Model (Recommended)</SelectItem>
                    <SelectItem value="enterprise">Enterprise Model</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeframe">Default Forecast Period</Label>
                <Select
                  value={`${payload.model?.defaultPeriod ?? 30}`}
                  onValueChange={(v) => setPayload({ ...payload, model: { ...payload.model, defaultPeriod: Number(v) } })}
                >
                  <SelectTrigger id="timeframe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="365">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="confidence">Confidence Threshold (%)</Label>
                <Input
                  id="confidence"
                  type="number"
                  value={payload.model?.confidenceThreshold ?? 85}
                  min={0}
                  max={100}
                  onChange={(e) => setPayload({ ...payload, model: { ...payload.model, confidenceThreshold: Number(e.target.value) } })}
                />
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive prediction alerts via email</p>
                </div>
                <Switch
                  checked={payload.notifications?.email ?? true}
                  onCheckedChange={(v) => setPayload({ ...payload, notifications: { ...payload.notifications, email: v } })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground">Get weekly performance summaries</p>
                </div>
                <Switch
                  checked={payload.notifications?.weekly ?? true}
                  onCheckedChange={(v) => setPayload({ ...payload, notifications: { ...payload.notifications, weekly: v } })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Accuracy Alerts</p>
                  <p className="text-sm text-muted-foreground">Alert when predictions fall below threshold</p>
                </div>
                <Switch
                  checked={payload.notifications?.lowAccuracy ?? true}
                  onCheckedChange={(v) => setPayload({ ...payload, notifications: { ...payload.notifications, lowAccuracy: v } })}
                />
              </div>
            </div>
          </Card>

          {/* Data Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Data Management</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-update Data</p>
                  <p className="text-sm text-muted-foreground">Automatically refresh data daily</p>
                </div>
                <Switch
                  checked={payload.data?.autoUpdate ?? true}
                  onCheckedChange={(v) => setPayload({ ...payload, data: { ...payload.data, autoUpdate: v } })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Retention</p>
                  <p className="text-sm text-muted-foreground">Keep historical data for 2 years</p>
                </div>
                <Select
                  value={`${payload.data?.retentionYears ?? 2}`}
                  onValueChange={(v) => setPayload({ ...payload, data: { ...payload.data, retentionYears: v } })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Year</SelectItem>
                    <SelectItem value="2">2 Years</SelectItem>
                    <SelectItem value="5">5 Years</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={fetchSettings} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
