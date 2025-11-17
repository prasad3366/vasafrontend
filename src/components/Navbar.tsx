import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLiked } from "@/contexts/LikedContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Cart from "@/components/Cart";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { likedProducts } = useLiked();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const { user, isAuthenticated, logout } = useAuth ? useAuth() : { user: null, isAuthenticated: false, logout: () => {} };

  // Close dropdown on outside click
  useEffect(() => {
    if (!showAccountMenu) return;
    function handle(e) {
      setShowAccountMenu(false);
    }
    window.addEventListener("click", handle);
    return () => window.removeEventListener("click", handle);
  }, [showAccountMenu]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
            <h1 className="text-3xl md:text-4xl font-brand font-black tracking-wider bg-gradient-to-r from-accent to-yellow-600 bg-clip-text text-transparent">
              VASA
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/products" className="text-sm font-medium hover:text-primary transition-colors">
              Products
            </Link>
            <Link to="/collections" className="text-sm font-medium hover:text-primary transition-colors">
              Collections
            </Link>
            <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Orders button (replaces Search) - hidden on admin pages */}
            {!isAdminRoute && (
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                    return;
                  }
                  navigate('/orders');
                }}
              >
                Orders
              </Button>
            )}

            {/* Liked Products (hidden on admin pages) */}
            {!isAdminRoute && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                    return;
                  }
                  navigate('/liked');
                }}
              >
                <Heart className="h-5 w-5" />
                {likedProducts.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-medium">
                    {likedProducts.length}
                  </span>
                )}
              </Button>
            )}

            {/* Cart (hidden on admin pages) */}
            {!isAdminRoute && <Cart />}

            {/* User Account Dropdown (Desktop) */}
            <div className="relative hidden md:flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAccountMenu((v) => !v)}
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </Button>
              {showAccountMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                  {isAuthenticated ? (
                    <div className="px-4 py-2 text-sm">
                      <div className="font-medium">{user?.username}</div>
                      <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => { setShowAccountMenu(false); logout(); }}>
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Link to="/login" className="block px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => setShowAccountMenu(false)}>
                        Login
                      </Link>
                      <Link to="/signup" className="block px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => setShowAccountMenu(false)}>
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80">
                <div className="flex flex-col space-y-6 mt-8">
                  <Link
                    to="/"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="/products"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    Products
                  </Link>
                  <Link
                    to="/collections"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    Collections
                  </Link>
                  <Link
                    to="/about"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    About
                  </Link>
                  <Link
                    to="/contact"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    Contact
                  </Link>
                  {!isAdminRoute && (
                    <Link
                      to="/orders"
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      Orders
                    </Link>
                  )}
                  <div className="pt-4 border-t flex flex-col gap-2">
                    {isAuthenticated ? (
                      <>
                        <div className="px-2 py-1 text-sm font-medium">{user?.username}</div>
                        <Button variant="outline" className="w-full justify-start mt-2" size="lg" onClick={logout}>
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link to="/login">
                          <Button variant="outline" className="w-full justify-start" size="lg">
                            <User className="mr-2 h-5 w-5" />
                            Login
                          </Button>
                        </Link>
                        <Link to="/signup">
                          <Button variant="secondary" className="w-full justify-start" size="lg">
                            Sign Up
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
