import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

/* 🔗 NEW BACKEND LINK */
const BACKEND_URL = "https://project-backend-new-amsy.onrender.com";

const Settings = () => {
  const { toast } = useToast();

  const [payload, setPayload] = useState<any>({
    profile: { firstName: "", lastName: "", email: "", company: "" },
    model: {
      predictionModel: "Random Forest",
      defaultPeriod: 30,
      confidenceThreshold: 85,
    },
    notifications: { email: true, weekly: true, lowAccuracy: true },
    data: { autoUpdate: true, retentionYears: 2 },
  });

  const [loading, setLoading] = useState(false);

  /* ---------------- Fetch Settings ---------------- */
  const fetchSettings = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/settings`);
      if (!res.ok) throw new Error("Failed to fetch settings");

      const json = await res.json();
      const p = json.payload ?? json;

      // Merge with defaults (safe UI)
      setPayload((prev: any) => ({
        profile: { ...prev.profile, ...(p.profile ?? {}) },
        model: { ...prev.model, ...(p.model ?? {}) },
        notifications: {
          ...prev.notifications,
          ...(p.notifications ?? {}),
        },
        data: { ...prev.data, ...(p.data ?? {}) },
      }));
    } catch (err) {
      console.warn("Settings fetch failed:", err);
      toast({
        title: "Settings not loaded",
        description: "Using default values. You can still save changes.",
      });
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- Save Settings ---------------- */
  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Save failed");
      }

      toast({
        title: "Settings Saved",
        description: "Your preferences were updated successfully.",
      });

      await fetchSettings();

      // Notify other pages (analytics / history)
      window.dispatchEvent(new Event("data-updated"));
    } catch (err: any) {
      console.error("Save error:", err);
      toast({
        title: "Save Failed",
        description: err?.message ?? "Could not save settings.",
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
          <p className="text-muted-foreground">
            Manage application preferences and configuration
          </p>
        </div>

        <div className="space-y-6">
          {/* ---------------- Profile ---------------- */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={payload.profile.firstName}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        profile: {
                          ...payload.profile,
                          firstName: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={payload.profile.lastName}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        profile: {
                          ...payload.profile,
                          lastName: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={payload.profile.email}
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      profile: {
                        ...payload.profile,
                        email: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label>Company</Label>
                <Input
                  value={payload.profile.company}
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      profile: {
                        ...payload.profile,
                        company: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </Card>

          {/* ---------------- Model ---------------- */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Model Configuration</h2>
            <div className="space-y-4">
              <div>
                <Label>Prediction Model</Label>
                <Select
                  value={payload.model.predictionModel}
                  onValueChange={(v) =>
                    setPayload({
                      ...payload,
                      model: { ...payload.model, predictionModel: v },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Random Forest">
                      Random Forest (Recommended)
                    </SelectItem>
                    <SelectItem value="Baseline">Baseline Model</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Default Forecast Period</Label>
                <Select
                  value={`${payload.model.defaultPeriod}`}
                  onValueChange={(v) =>
                    setPayload({
                      ...payload,
                      model: {
                        ...payload.model,
                        defaultPeriod: Number(v),
                      },
                    })
                  }
                >
                  <SelectTrigger>
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
                <Label>Confidence Threshold (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={payload.model.confidenceThreshold}
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      model: {
                        ...payload.model,
                        confidenceThreshold: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          </Card>

          {/* ---------------- Notifications ---------------- */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Notifications</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts via email
                  </p>
                </div>
                <Switch
                  checked={payload.notifications.email}
                  onCheckedChange={(v) =>
                    setPayload({
                      ...payload,
                      notifications: {
                        ...payload.notifications,
                        email: v,
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground">
                    Weekly performance summary
                  </p>
                </div>
                <Switch
                  checked={payload.notifications.weekly}
                  onCheckedChange={(v) =>
                    setPayload({
                      ...payload,
                      notifications: {
                        ...payload.notifications,
                        weekly: v,
                      },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Low Accuracy Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Alert when accuracy drops
                  </p>
                </div>
                <Switch
                  checked={payload.notifications.lowAccuracy}
                  onCheckedChange={(v) =>
                    setPayload({
                      ...payload,
                      notifications: {
                        ...payload.notifications,
                        lowAccuracy: v,
                      },
                    })
                  }
                />
              </div>
            </div>
          </Card>

          {/* ---------------- Data ---------------- */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Data Management</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Auto Update</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically refresh data
                  </p>
                </div>
                <Switch
                  checked={payload.data.autoUpdate}
                  onCheckedChange={(v) =>
                    setPayload({
                      ...payload,
                      data: { ...payload.data, autoUpdate: v },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Data Retention</p>
                  <p className="text-sm text-muted-foreground">
                    Retain historical data
                  </p>
                </div>
                <Select
                  value={`${payload.data.retentionYears}`}
                  onValueChange={(v) =>
                    setPayload({
                      ...payload,
                      data: {
                        ...payload.data,
                        retentionYears: v,
                      },
                    })
                  }
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

          {/* ---------------- Actions ---------------- */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={fetchSettings} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
