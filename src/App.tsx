import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LikedProvider } from "@/contexts/LikedContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import Index from "./pages/Index";
import Products from "./pages/Products";
import AdminProducts from "./pages/AdminProducts";
import SalesAnalytics from "@/components/admin/SalesAnalytics";
import ManageSections from "@/components/admin/ManageSections";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminOrders from "./pages/admin/AdminOrders";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import LikedProducts from "./pages/LikedProducts";
import ContactUs from "./pages/ContactUs";
import Orders from "./pages/Orders";
import ShippingReturns from './pages/ShippingReturns';
import TrackOrder from './pages/TrackOrder';
import FAQPage from './pages/FAQPage';
import { useEffect } from "react";
import { setNavigate } from "@/lib/navigation";

const queryClient = new QueryClient();

const RoleRedirect = ({ children }) => {
  const { user } = useAuth();
  // if logged in as admin (role_id === 1) send to admin console
  if (user && (user.role_id === 1 || String(user.role_id) === '1')) {
    return <Navigate to="/admin/products" replace />;
  }
  return children;
};

const App = () => (
  <BrowserRouter>
    {/* RouterBridge: registers react-router's navigate with our navigation helper */}
    <RouterBridge />
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <LikedProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Redirect admins away from customer pages to admin console */}
              <Route
                path="/"
                element={
                  <RoleRedirect>
                    <Index />
                  </RoleRedirect>
                }
              />
              <Route
                path="/products"
                element={
                  <RoleRedirect>
                    <Products />
                  </RoleRedirect>
                }
              />
              <Route
                path="/collections"
                element={
                  <RoleRedirect>
                    <Products />
                  </RoleRedirect>
                }
              />
              <Route path="/about" element={<About />} />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/shipping-returns" element={<ShippingReturns />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/liked" element={
                <ProtectedRoute>
                  <LikedProducts />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/admin/products" element={
                <AdminProtectedRoute>
                  <AdminProducts />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <AdminProtectedRoute>
                  <SalesAnalytics />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/sections" element={
                <AdminProtectedRoute>
                  <ManageSections />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/reviews" element={
                <AdminProtectedRoute>
                  <AdminReviews />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <AdminProtectedRoute>
                  <AdminOrders />
                </AdminProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
          </LikedProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;

// RouterBridge component placed outside the main tree so it registers early.
function RouterBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    // register navigate function used by non-react modules
    setNavigate((to: string, opts?: { replace?: boolean }) => {
      if (opts && opts.replace) return navigate(to, { replace: true });
      return navigate(to);
    });
  }, [navigate]);
  return null;
}
