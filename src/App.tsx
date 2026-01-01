import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CropPredictor from "./pages/CropPredictor";
import SmartIrrigation from "./pages/SmartIrrigation";
import Chatbot from "./pages/Chatbot";
import GroundwaterMonitoring from "./pages/GroundwaterMonitoring";
import PriceTracking from "./pages/PriceTracking";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactSupport from "./pages/ContactSupport";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/crop-predictor"
            element={<ProtectedRoute><CropPredictor /></ProtectedRoute>}
          />
          <Route
            path="/smart-irrigation"
            element={<ProtectedRoute><SmartIrrigation /></ProtectedRoute>}
          />
          <Route
            path="/groundwater-monitoring"
            element={<ProtectedRoute><GroundwaterMonitoring /></ProtectedRoute>}
          />
          <Route
            path="/price-tracking"
            element={<ProtectedRoute><PriceTracking /></ProtectedRoute>}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute><Settings /></ProtectedRoute>}
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<ContactSupport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;