import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: '#111827' }}>
              VASA
            </h3>
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
              <li><a href="/products" className="hover:text-primary transition-colors">All Products</a></li>
              <li><a href="/products?section=best-sellers" className="hover:text-primary transition-colors">Best Sellers</a></li>
              <li><a href="/products?section=new-arrivals" className="hover:text-primary transition-colors">New Arrivals</a></li>
              <li><a href="/products?section=special-offers" className="hover:text-primary transition-colors">Special Offers</a></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Customer Care</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/contact-us" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/shipping-returns" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/track-order" className="hover:text-primary transition-colors">Track Order</Link></li>
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
            <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" className="hover:text-primary transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;