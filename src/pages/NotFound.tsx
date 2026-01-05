import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    console.log("Route Debug Info:", {
      "location.pathname": location.pathname,
      "location.search": location.search,
      "location.hash": location.hash,
      "window.location.href": window.location.href,
      "window.location.pathname": window.location.pathname,
      "window.location.hash": window.location.hash,
    });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <p className="mb-2 text-sm text-muted-foreground">
          Attempted path: <code className="bg-muted-foreground/20 px-1 rounded">{location.pathname}</code>
        </p>
        <div className="flex flex-col gap-2 items-center">
          <Link to="/" className="text-primary underline hover:text-primary/90">
            Return to Home
          </Link>
          <Link to="/dashboard/2nd-line-analyst" className="text-primary underline hover:text-primary/90">
            Go to 2nd Line Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
