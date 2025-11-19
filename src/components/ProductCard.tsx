import React, { useEffect, useState } from "react";
import { Star, Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/data/products";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLiked } from "@/contexts/LikedContext";
import formatPriceINR from '@/lib/formatting';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [imageError, setImageError] = useState(false);
  // Fetch reviews and calculate average rating
  useEffect(() => {
    async function fetchReviews() {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
        const res = await fetch(`${API_BASE}/perfumes/${product.id}/reviews`);
        const data = await res.json();
        if (data.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviewCount(data.reviews.length);
          const sum = data.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
          setAvgRating(sum / data.reviews.length);
        } else {
          setAvgRating(null);
          setReviewCount(0);
        }
      } catch {
        setAvgRating(null);
        setReviewCount(0);
      }
    }
    fetchReviews();
  }, [product.id]);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { addToLiked, removeFromLiked, isLiked } = useLiked();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({ title: "Please login", description: "You must be logged in to add items to the cart." });
      navigate('/login');
      return;
    }
    
    // size removed: add product without size
    addItem(product);
    toast({ title: "Added to cart", description: `${product.name} has been added to your cart.` });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Store the product and go directly to checkout (size removed)
    const singleItemCart = {
      items: [{
        ...product,
        quantity: 1,
        price: product.price
      }],
      totalPrice: product.price
    };
    sessionStorage.setItem('checkout-item', JSON.stringify(singleItemCart));
    // Immediately redirect to checkout
    navigate('/checkout');
  };

  return (
    <Card 
      className="group overflow-hidden hover:shadow-elegant transition-smooth cursor-pointer"
      onClick={(e: React.MouseEvent) => {
        // If the click originated from an interactive element (button/link), do not navigate to product page.
        const target = e.target as HTMLElement | null;
        if (target && (target.closest('button') || target.closest('a') || target.getAttribute('role') === 'button')) {
          return;
        }
        navigate(`/product/${product.id}`);
      }}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <div className="text-center">
              <div className="text-4xl text-muted-foreground/40 mb-2">🧴</div>
              <p className="text-xs text-muted-foreground">Image unavailable</p>
            </div>
          </div>
        ) : (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-smooth"
            onError={() => setImageError(true)}
          />
        )}
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-smooth"
          onClick={(e) => {
            e.stopPropagation();
            console.debug('[ProductCard] like clicked', { productId: product.id, isAuthenticated });
            if (!isAuthenticated) {
              toast({ title: "Please login", description: "You must be logged in to like products." });
              navigate('/login');
              return;
            }
            try {
              const idStr = String(product.id);
              if (isLiked(idStr)) {
                removeFromLiked(idStr);
                toast({ title: "Removed from liked", description: `${product.name} has been removed from your liked products.` });
              } else {
                addToLiked(idStr);
                toast({ title: "Added to liked", description: `${product.name} has been added to your liked products.` });
              }
            } catch (err) {
              console.error('[ProductCard] like handler error', err);
              toast({ title: 'Error', description: 'Could not update liked products.' });
            }
          }}
        >
          <Heart className={`h-4 w-4 ${isLiked(String(product.id)) ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
        
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.isBestSeller && (
            <Badge className="gradient-primary text-primary-foreground">Best Seller</Badge>
          )}
          {product.isNew && (
            <Badge className="gradient-gold text-foreground">New</Badge>
          )}
          {product.isSale && (
            <Badge variant="destructive">Sale</Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-serif text-lg font-semibold line-clamp-1 mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground">{product.category} • {product.fragranceType}</p>
        </div>

        <div className="flex items-center gap-1 mb-3">
          {avgRating !== null
            ? Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.round(avgRating)
                      ? "fill-accent text-accent"
                      : "text-muted"
                  }`}
                />
              ))
            : Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 text-muted" />
              ))}
          <span className="text-xs text-muted-foreground ml-1">
            {avgRating !== null ? `${avgRating.toFixed(1)} (${reviewCount})` : "No reviews"}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            {(() => {
              const regularPrice = product.originalPrice;
              const specialPrice = Number(product.price ?? 0);
              const isSpecialOffer = product.isSale && regularPrice && specialPrice < regularPrice;

              if (isSpecialOffer) {
                return (
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="text-sm text-muted-foreground line-through">{formatPriceINR(regularPrice)}</div>
                      <div className="font-bold text-lg text-red-500">{formatPriceINR(specialPrice)}</div>
                    </div>
                  </div>
                );
              }
              
              // Regular price display
              return (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{formatPriceINR(specialPrice)}</span>
                </div>
              );
            })()}
          </div>
          <Button
            size="icon"
            variant="secondary"
            onClick={handleAddToCart}
            className="h-8 w-8"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          className="w-full bg-[#22C55E] hover:bg-[#1ea750] text-white font-semibold py-2.5"
          onClick={handleBuyNow}
        >
          Buy Now
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;