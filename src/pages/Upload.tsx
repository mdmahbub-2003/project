import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, FileSpreadsheet, FileText, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Note: API_BASE_URL import hata diya hai

const Upload = () => {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  // 👇 Direct Backend Link
  const BACKEND_URL = "https://project-backend-lfn1.onrender.com";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      // Direct URL use kiya hai
      const res = await fetch(`${BACKEND_URL}/upload`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      setUploadedFile(file.name);
      toast({
        title: "File uploaded successfully",
        description: `${file.name} is saved on server`,
      });
      // notify other pages to refresh analytics/history
      window.dispatchEvent(new Event("data-updated"));
    } catch (e) {
      console.error("Upload error:", e);
      toast({
        title: "Upload failed",
        description: "Something went wrong while uploading file.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Upload Data</h1>
          <p className="text-muted-foreground">Import your sales data from CSV or Excel files for analysis</p>
        </div>

        <div className="space-y-6">
          <Card className="p-8">
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors">
              <input type="file" id="fileInput" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
              <label htmlFor="fileInput" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <UploadIcon className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold mb-1">Drop your files here or click to browse</p>
                    <p className="text-sm text-muted-foreground">Supported formats: CSV, XLSX, XLS</p>
                  </div>
                  <Button type="button" disabled={uploading}>{uploading ? "Uploading..." : "Select File"}</Button>
                </div>
              </label>
            </div>

            {uploadedFile && (
              <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success" />
                <div className="flex-1">
                  <p className="font-medium">File uploaded</p>
                  <p className="text-sm text-muted-foreground">{uploadedFile}</p>
                </div>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileSpreadsheet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Excel Files</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload .xlsx or .xls files with your sales data
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Multiple sheets supported</li>
                    <li>• Automatic column detection</li>
                    <li>• Data validation included</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">CSV Files</h3>
                  <p className="text-sm text-muted-foreground mb-3">Upload comma-separated value files</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• UTF-8 encoding preferred</li>
                    <li>• Header row required</li>
                    <li>• Fast processing</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Required Columns</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-secondary rounded-lg">
                <p className="font-medium">Date</p>
                <p className="text-muted-foreground">YYYY-MM-DD</p>
              </div>
              <div className="p-3 bg-secondary rounded-lg">
                <p className="font-medium">Product</p>
                <p className="text-muted-foreground">Product name</p>
              </div>
              <div className="p-3 bg-secondary rounded-lg">
                <p className="font-medium">Sales</p>
                <p className="text-muted-foreground">Numeric value</p>
              </div>
              <div className="p-3 bg-secondary rounded-lg">
                <p className="font-medium">Region</p>
                <p className="text-muted-foreground">Location</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Upload;