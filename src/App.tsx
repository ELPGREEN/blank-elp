import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CookieConsent } from "@/components/CookieConsent";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { I18nDebugProvider } from "@/components/I18nDebugProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAntiCopy } from "@/hooks/useAntiCopy";
import Index from "./pages/Index";
import About from "./pages/About";
import Solutions from "./pages/Solutions";
import SaaS from "./pages/SaaS";
import Investors from "./pages/Investors";
import ESG from "./pages/ESG";
import Media from "./pages/Media";
import BlogArticle from "./pages/BlogArticle";
import PressRelease from "./pages/PressRelease";
import Contact from "./pages/Contact";
import Marketplace from "./pages/Marketplace";
import LOIViewer from "./pages/LOIViewer";
import RequestQuote from "./pages/RequestQuote";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Admin from "./pages/Admin";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import NotFound from "./pages/NotFound";
import TireRecyclingPlant from "./pages/plants/TireRecyclingPlant";
import PyrolysisPlant from "./pages/plants/PyrolysisPlant";
import OTRPlant from "./pages/plants/OTRPlant";
import OTRPartnership from "./pages/OTRPartnership";
import OTRSources from "./pages/OTRSources";
import BrazilLatam from "./pages/BrazilLatam";
import GlobalExpansion from "./pages/GlobalExpansion";
import Certificates from "./pages/Certificates";
import FAQ from "./pages/FAQ";
import BusinessIndex from "./pages/BusinessIndex";
import TemplateViewer from "./pages/TemplateViewer";
import PublicSignature from "./pages/PublicSignature";
import { WhatsAppButton } from "./components/WhatsAppButton";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

// Inner component to use hooks
const AppContent = () => {
  // Enable anti-copy protection
  useAntiCopy();
  
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/saas" element={<SaaS />} />
        <Route path="/investors" element={<Investors />} />
        <Route path="/esg" element={<ESG />} />
        <Route path="/media" element={<Media />} />
        <Route path="/blog/:slug" element={<BlogArticle />} />
        <Route path="/press/:slug" element={<PressRelease />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/loi/:token" element={<LOIViewer />} />
        <Route path="/quote" element={<RequestQuote />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/plants/tire-recycling" element={<TireRecyclingPlant />} />
        <Route path="/plants/pyrolysis" element={<PyrolysisPlant />} />
        <Route path="/plants/otr" element={<OTRPlant />} />
        <Route path="/partnership/otr" element={<OTRPartnership />} />
        <Route path="/otr-sources" element={<OTRSources />} />
        <Route path="/brazil-latam" element={<BrazilLatam />} />
        <Route path="/global-expansion" element={<GlobalExpansion />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/business" element={<BusinessIndex />} />
        <Route path="/documents/template/:id" element={<TemplateViewer />} />
        <Route path="/sign" element={<PublicSignature />} />
        <Route path="/sign/:docId" element={<PublicSignature />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <WhatsAppButton />
      <ScrollToTopButton />
      <CookieConsent />
    </BrowserRouter>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nDebugProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Toaster />
            <Sonner />
            <AppContent />
          </Suspense>
        </I18nDebugProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
