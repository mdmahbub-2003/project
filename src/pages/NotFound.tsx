// src/pages/NotFound.tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"; // UI consistency ke liye button import kiya

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-12 text-center">
        <h1 className="text-6xl font-extrabold text-slate-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-700 mb-2">Page not found</h2>
        <p className="text-slate-500 mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Home
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;