import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import ProductCard from "@/components/ProductCard";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  fragranceType: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  sizes: string[];
  inStock: boolean;
  stockLevel: string;
  isBestSeller: boolean;
  isNew: boolean;
  isSale: boolean;
  discountPercentage: number;
  discountEndDate?: Date;
  totalSold: number;
}

const Index = () => {
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [specialOffers, setSpecialOffers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSections = async () => {
      setLoading(true);
      setError('');
      try {
        // Load all sections in parallel
        const [bestSellersRes, newArrivalsRes, specialOffersRes] = await Promise.all([
          ApiClient.getBestSellers(),
          ApiClient.getNewArrivals(),
          ApiClient.getSpecialOffers()
        ]);

        console.log('Best sellers response:', bestSellersRes);
        // Debug logs to inspect API response shapes for troubleshooting
        console.log('New arrivals response:', newArrivalsRes);
        console.log('Special offers response:', specialOffersRes);
        
        // Ensure we get the perfumes array and all items have isBestSeller flag
        const bestSellerPerfumes = (bestSellersRes.perfumes || []).map(p => ({
          ...p,
          isBestSeller: true
        }));
        
        setBestSellers(bestSellerPerfumes);
        setNewArrivals(newArrivalsRes.perfumes || []);
        setSpecialOffers(specialOffersRes.perfumes || []);
      } catch (err) {
        console.error('Failed to load product sections:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroCarousel />
        {/* Best Sellers Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">Best Sellers</h2>
            {bestSellers.length > 4 && (
              <Link to="/products?section=best-sellers" className="text-sm font-medium hover:text-accent">
                View All →
              </Link>
            )}
          </div>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                // Loading state
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-48 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ))
              ) : bestSellers.length > 0 ? (
                // Products found
                bestSellers.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                // No products found
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No best sellers available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* New Arrivals Section */}
        <section className="container mx-auto px-4 py-16 bg-muted">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">New Arrivals</h2>
            {newArrivals.length > 4 && (
              <Link to="/products?section=new-arrivals" className="text-sm font-medium hover:text-accent">
                View All →
              </Link>
            )}
          </div>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-48 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ))
              ) : newArrivals.length > 0 ? (
                newArrivals.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No new arrivals available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Special Offers Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">Special Offers</h2>
            {specialOffers.length > 4 && (
              <Link to="/products?section=special-offers" className="text-sm font-medium hover:text-accent">
                View All →
              </Link>
            )}
          </div>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-48 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ))
              ) : specialOffers.length > 0 ? (
                specialOffers.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No special offers available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Testimonials Section */}
        <Testimonials />

      </main>
      {/* FAQ above footer on home page */}
      <FAQ />
      <Footer />
    </div>
  );
}

export default Index;
