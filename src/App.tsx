import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Project from "./pages/Project.tsx";
import AboutPage from "./pages/About.tsx";
import ContactPage from "./pages/Contact.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import NotFound from "./pages/NotFound.tsx";

// Admin is behind a login and never touched by public visitors, so it is split
// into its own chunk rather than shipped in the bundle every viewer downloads.
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin.tsx"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout.tsx"));
const AdminProjectsList = lazy(() => import("./pages/admin/AdminProjectsList.tsx"));
const AdminProjectEdit = lazy(() => import("./pages/admin/AdminProjectEdit.tsx"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings.tsx"));
import Preloader from "./components/Preloader.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Preloader />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projects/:slug" element={<Project />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route
            path="/admin/login"
            element={<Suspense fallback={null}><AdminLogin /></Suspense>}
          />
          <Route path="/admin" element={<Suspense fallback={null}><AdminLayout /></Suspense>}>
            <Route index element={<Suspense fallback={null}><AdminProjectsList /></Suspense>} />
            <Route path="projects/:id" element={<Suspense fallback={null}><AdminProjectEdit /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={null}><AdminSettings /></Suspense>} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
