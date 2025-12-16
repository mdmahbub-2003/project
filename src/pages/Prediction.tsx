import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Target } from "lucide-react";
import { useState } from "react";

// NOTE: Humne API_BASE_URL hata diya hai aur direct link use kiya hai

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
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [discount, setDiscount] = useState<string>("0");
  const [region, setRegion] = useState("");
  const [season, setSeason] = useState("");

  const [modelAccuracy] = useState("94.2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  // 👇 Yahan apna Render URL confirm kar lena (slash / end me nahi hona chahiye)
  const BACKEND_URL = "https://project-backend-lfn1.onrender.com";

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
      // FIX: Direct URL use kiya hai
      const response = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      // Persist the prediction (Save to Database)
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
        if (!saveResp.ok) {
          console.warn("Failed to persist prediction.");
        } else {
          // notify other pages
          window.dispatchEvent(new Event("data-updated"));
        }
      } catch (err) {
        console.error("Persist error:", err);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while generating prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sales Prediction</h1>
          <p className="text-muted-foreground">
            Enter product details to forecast future sales performance
          </p>
        </div>

        <Card className="mb-8 p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium text-primary mb-1 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Model Accuracy
              </p>
              <p className="text-4xl font-bold text-primary">
                {modelAccuracy}
                <span className="text-2xl align-top">%</span>
              </p>
            </div>
            <div className="max-w-md text-sm text-muted-foreground">
              This accuracy is based on historical sales data and indicates how closely the model&apos;s
              predictions match actual performance.
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Product Details</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input id="productName" placeholder="Enter product name" value={productName} onChange={(e) => setProductName(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="category">Product Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unitPrice">Unit Price ($)</Label>
                  <Input id="unitPrice" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input id="discount" type="number" min="0" max="90" step="1" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
              </div>

              <div>
                <Label htmlFor="region">Region</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north">North</SelectItem>
                    <SelectItem value="south">South</SelectItem>
                    <SelectItem value="east">East</SelectItem>
                    <SelectItem value="west">West</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="season">Season</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger id="season">
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
                <p className="text-sm text-red-500 border border-red-200 bg-red-50 rounded-md px-3 py-2">{error}</p>
              )}

              <Button className="w-full" size="lg" onClick={handlePredict} disabled={loading}>
                <TrendingUp className="mr-2 w-5 h-5" />
                {loading ? "Generating..." : "Generate Prediction"}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Prediction Results</h2>

            {result ? (
              <div className="space-y-6">
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Predicted Sales (Next Month)</p>
                  <p className="text-3xl font-bold text-primary">${result.predictedSales.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Confidence Level</p>
                    <p className="text-xl font-semibold">{result.confidenceLevel}</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Growth Trend</p>
                    <p className="text-xl font-semibold text-emerald-500">+{result.growthTrend}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Insights</p>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                    {result.insights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                  <p className="text-sm font-medium text-accent">💡 Recommendation: {result.recommendation}</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Fill in the product details on the left and click{" "}
                <span className="font-medium">Generate Prediction</span> to see the forecast here.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Prediction;