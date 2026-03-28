import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CartProvider } from "./contexts/CartContext";
import Home from "./pages/Home";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Vouchers from "./pages/Vouchers";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import AdminProducts from "./pages/AdminProducts";
import AdminReviews from "./pages/AdminReviews";
import AdminOrders from "./pages/AdminOrders";
import AdminVisitors from "./pages/AdminVisitors";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import FAQ from "./pages/FAQ";
import ProductPage from "./pages/ProductPage";
import { useAuth } from "./_core/hooks/useAuth";
import { trackVisit } from "./hooks/useVisitorTracker";


const SUPABASE_URL = "https://eqzcmxtrkgmcjhvbnefq.supabase.co";
const SUPABASE_KEY = "sb_publishable_efQGrrNRPLO7uLmKqsA5Jw_uyGx5Cc7";

async function getMaintenanceMode(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Settings?key=eq.maintenance&select=value&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!res.ok) return false;
    const rows = await res.json();
    return rows?.[0]?.value === "true";
  } catch { return false; }
}

function MaintenancePage() {
  return (
    <div className="fixed inset-0 bg-[#030711] flex items-center justify-center z-[9999] p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔧</div>
        <h1 className="text-4xl font-black text-white mb-4">Site en maintenance</h1>
        <p className="text-slate-400 text-lg leading-relaxed mb-8">
          Nous effectuons des améliorations pour vous offrir une meilleure expérience. Revenez très bientôt !
        </p>
        <div className="flex items-center justify-center gap-2 text-slate-600 text-sm font-mono">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          AXA Shop — Bientôt de retour
        </div>
      </div>
    </div>
  );
}

function Router() {
  const { user } = useAuth();
  const [location] = useLocation();

  // Track visits (skip admin pages)
  useEffect(() => {
    if (!location.startsWith("/admin")) {
      trackVisit(location);
    }
  }, [location]);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/product/:groupId" component={ProductPage} />
      <Route path="/vouchers" component={Vouchers} />
      <Route path="/terms" component={Terms} />
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/reviews" component={AdminReviews} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/visitors" component={AdminVisitors} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [maintenance, setMaintenance] = useState(false);
  const [checking, setChecking] = useState(true);
  const isAdmin = window.location.pathname.startsWith("/admin") ||
    localStorage.getItem("admin_auth") === "true";

  useEffect(() => {
    if (isAdmin) { setChecking(false); return; }
    getMaintenanceMode().then(m => {
      setMaintenance(m);
      setChecking(false);
    });
  }, []);

  if (checking && !isAdmin) return (
    <div className="fixed inset-0 bg-[#030711] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (maintenance && !isAdmin) return <MaintenancePage />;

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <div className="flex flex-col min-h-screen bg-background text-foreground">
                <ConditionalHeader />
                <main className="flex-1">
                  <Router />
                </main>
                <ConditionalFooter />
              </div>
            </TooltipProvider>
          </CartProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function ConditionalHeader() {
  try {
    const [location] = useLocation();
    if (location.startsWith("/admin")) return null;
  } catch (e) {
    if (window.location.pathname.startsWith("/admin")) return null;
  }
  return <Header />;
}

function ConditionalFooter() {
  try {
    const [location] = useLocation();
    if (location.startsWith("/admin") || location === "/cart" || location === "/checkout") return null;
  } catch (e) {
    if (window.location.pathname.startsWith("/admin") || window.location.pathname === "/cart" || window.location.pathname === "/checkout") return null;
  }
  return <Footer />;
}

export default App;
