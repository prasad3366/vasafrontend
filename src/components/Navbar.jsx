import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLiked } from "@/contexts/LikedContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Cart from "@/components/Cart";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProfileModal } from './ProfileModal';

const Navbar = ({ hideActions: hideActionsProp }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth ? useAuth() : { user: null, isAuthenticated: false, logout: () => {} };
  const { likedProducts } = useLiked();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const cameFromAdminState = (location && location.state && location.state.fromAdmin) === true;

  // Synchronously detect admin from token in localStorage to avoid flicker
  const isAdminFromToken = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      const payload = token.split('.')[1];
      if (!payload) return false;
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const data = JSON.parse(decodeURIComponent(escape(json)));
      return Number(data.role_id) === 1;
    } catch (e) {
      return false;
    }
  })();

  const hideActions = Boolean(hideActionsProp) || isAdminRoute || isAdminFromToken || cameFromAdminState;
  const [showProfile, setShowProfile] = React.useState(false);

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
          <img src="/logo1.jpg" alt=""  style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            marginRight: '8px',
          }}/>
            <h1 className="text-3xl md:text-4xl font-brand font-black tracking-wider bg-gradient-to-r from-accent to-yellow-600 bg-clip-text text-transparent">
              VASA
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-12">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/products" className="text-sm font-medium hover:text-primary transition-colors">
              Products
            </Link>
            <Link to="/contact-us" state={isAdminRoute ? { fromAdmin: true } : undefined} className="text-sm font-medium hover:text-primary transition-colors">
              Contact Us
            </Link>
            <Link to="/about" state={isAdminRoute ? { fromAdmin: true } : undefined} className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Orders button (replaces Search) - hidden on admin pages */}
              {!hideActions && (
                <Button
                  variant="ghost"
                  size="sm"
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
            {!hideActions && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                    return;
                  }
                  navigate('/liked');
                }}
                className="relative"
              >
                <Heart className="h-5 w-5" />
                {likedProducts.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                    {likedProducts.length}
                  </span>
                )}
              </Button>
            )}

            {/* Cart (hidden on admin pages) */}
            {!hideActions && <Cart />}


            {/* Account */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  {user?.username}
                  <span title="Profile" style={{cursor: 'pointer'}} onClick={() => setShowProfile(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 1115 0v.75a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-.75z" />
                    </svg>
                  </span>
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <Link to="/login">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4">
                  <Link
                    to="/"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="/products"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Products
                  </Link>
                  <Link
                    to="/contact-us"
                    state={isAdminRoute ? { fromAdmin: true } : undefined}
                    className="text-sm font-medium hover:text-primary transition-colors"
                    style={{ marginLeft: '8px' }}
                  >
                    Contact Us
                  </Link>
                  <Link
                    to="/about"
                    state={isAdminRoute ? { fromAdmin: true } : undefined}
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    About
                  </Link>
                  {!hideActions && (
                    <Link
                      to="/orders"
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      Orders
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
    </header>
    </>
  );
};

export default Navbar;