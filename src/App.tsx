import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Dashboard1stLine from "./pages/Dashboard1stLine";
import Dashboard2ndLine from "./pages/Dashboard2ndLine";
import DashboardRiskOwner from "./pages/DashboardRiskOwner";
import RiskAssessmentForm from "./pages/RiskAssessmentForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const HashPathRedirector = () => {
  useEffect(() => {
    const { pathname, search, hash } = window.location;

    // If someone loads a deep link like "/dashboard/..." (no hash), redirect to hash route.
    if (!hash && pathname !== "/" && !pathname.startsWith("/assets/")) {
      window.location.replace(`/#${pathname}${search}`);
    }
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false} storageKey="rcsa-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <HashPathRedirector />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard/1st-line-analyst" element={<Dashboard1stLine />} />
            <Route path="/dashboard/1st-line-analyst/*" element={<Dashboard1stLine />} />
            <Route path="/dashboard/2nd-line-analyst" element={<Dashboard2ndLine />} />
            <Route path="/dashboard/2nd-line-analyst/*" element={<Dashboard2ndLine />} />
            <Route path="/dashboard/risk-owner" element={<DashboardRiskOwner />} />
            <Route path="/dashboard/risk-owner/*" element={<DashboardRiskOwner />} />
            <Route path="/risk-assessment" element={<RiskAssessmentForm />} />
            <Route path="/risk-assessment/*" element={<RiskAssessmentForm />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
