import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-4 w-full max-w-lg rounded-3xl bg-white/80 px-6 py-8 text-center shadow-lg backdrop-blur-sm">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-red-100" />
            <AlertCircle className="relative h-16 w-16 text-red-500" />
          </div>
        </div>

        <h1 className="mb-2 text-4xl font-bold text-slate-900">404</h1>

        <h2 className="mb-4 text-xl font-semibold text-slate-700">Page Not Found</h2>

        <p className="mb-8 leading-relaxed text-slate-600">
          Sorry, the page you are looking for doesn&apos;t exist.
          <br />
          It may have been moved or deleted.
        </p>

        <div
          id="not-found-button-group"
          className="flex flex-col justify-center gap-3 sm:flex-row"
        >
          <button
            type="button"
            onClick={handleGoHome}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
