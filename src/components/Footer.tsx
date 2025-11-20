import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Link } from 'react-router-dom';

const scrollToTop = () => {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  } catch (e) {
    window.scrollTo(0, 0);
  }
};

const Footer = () => {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.jpg" alt="VASA logo" className="h-9 w-9 object-cover rounded-md" />
              <h3 className="text-2xl font-bold" style={{ color: '#111827' }}>
                VASA
              </h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Luxury perfumes crafted for the exceptional. Discover your signature scent.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Shop</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/products" onClick={scrollToTop} className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link to="/products?section=best-sellers" onClick={scrollToTop} className="hover:text-primary transition-colors">Best Sellers</Link></li>
              <li><Link to="/products?section=new-arrivals" onClick={scrollToTop} className="hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link to="/products?section=special-offers" onClick={scrollToTop} className="hover:text-primary transition-colors">Special Offers</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Customer Care</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/contact-us" onClick={scrollToTop} className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/shipping-returns" onClick={scrollToTop} className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/faq" onClick={scrollToTop} className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/track-order" onClick={scrollToTop} className="hover:text-primary transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Stay Connected</h4>
            <p className="text-muted-foreground mb-4 text-sm">
              Subscribe to receive exclusive offers and fragrance tips
            </p>
            <div className="flex gap-2 mb-4">
              <Input type="email" placeholder="Your email" />
              <Button className="gradient-primary text-primary-foreground">
                Subscribe
              </Button>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>hello@vasa.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>New York, NY</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; 2025 VASA Perfumes. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" onClick={scrollToTop} className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" onClick={scrollToTop} className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" onClick={scrollToTop} className="hover:text-primary transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;