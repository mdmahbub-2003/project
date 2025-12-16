import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Target } from "lucide-react";
import { useState } from "react";

/* 🔗 BACKEND LINK */
const BACKEND_URL = "https://project-backend-new-amsy.onrender.com";

/* ---------------- Types ---------------- */
type PredictionResult = {
  predictedSales: number;
  confidenceLevel: string;
  growthTrend: number;
  insights: string[];
  recommendation: string;
};

const Prediction = () => {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [region, setRegion] = useState("");
  const [season, setSeason] = useState("");

  const [modelAccuracy] = useState("94.2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handlePredict = async () => {
    setError(null);

    if (!productName || !category || !unitPrice || !region || !season) {
      setError("Please fill all required fields.");
      return;
    }

    const numericUnitPrice = parseFloat(unitPrice);
    const numericDiscount = parseFloat(discount || "0");

    if (isNaN(numericUnitPrice) || isNaN(numericDiscount)) {
      setError("Unit price and discount must be valid numbers.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          category,
          unitPrice: numericUnitPrice,
          discount: numericDiscount,
          region,
          season,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get prediction from server");
      }

      const data: PredictionResult = await response.json();
      setResult(data);

      try {
        const saveResp = await fetch(`${BACKEND_URL}/predictions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName,
            category,
            unitPrice: numericUnitPrice,
            discount: numericDiscount,
            region,
            season,
          }),
        });

        if (saveResp.ok) {
          window.dispatchEvent(new Event("data-updated"));
        }
      } catch (err) {
        console.warn("Failed to save prediction:", err);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong while generating prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold mb-2">Sales Prediction</h1>
        <p className="text-muted-foreground mb-8">
          Enter product details to forecast future sales using Random Forest ML
        </p>

        <Card className="mb-8 p-6">
          <div className="flex items-center gap-4">
            <Target className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Model Accuracy</p>
              <p className="text-3xl font-bold text-primary">
                {modelAccuracy}%
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ---------------- Form ---------------- */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Product Details</h2>

            <div className="space-y-4">
              <div>
                <Label>Product Name</Label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Region</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north">North</SelectItem>
                    <SelectItem value="south">South</SelectItem>
                    <SelectItem value="east">East</SelectItem>
                    <SelectItem value="west">West</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Season</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="autumn">Autumn</SelectItem>
                    <SelectItem value="monsoon">Monsoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                className="w-full"
                onClick={handlePredict}
                disabled={loading}
              >
                <TrendingUp className="mr-2 w-4 h-4" />
                {loading ? "Generating..." : "Generate Prediction"}
              </Button>
            </div>
          </Card>

          {/* ---------------- Result ---------------- */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">
              Prediction Results
            </h2>

            {result ? (
              <div className="space-y-4">
                <p className="text-3xl font-bold text-primary">
                  ₹{result.predictedSales.toLocaleString()}
                </p>
                <p>Confidence: {result.confidenceLevel}</p>
                <p className="text-emerald-500">
                  Growth: +{result.growthTrend}%
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Fill the form to see prediction results.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Prediction;
