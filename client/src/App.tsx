import { Toaster } from "@/components/ui/sonner";
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
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import FAQ from "./pages/FAQ";
import ProductPage from "./pages/ProductPage";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { user } = useAuth();

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
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
