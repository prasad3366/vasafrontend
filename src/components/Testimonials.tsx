import { Star, Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { products } from "@/data/products";
import { useToast } from "@/hooks/use-toast";

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Fashion Blogger",
    content: "VASA perfumes are absolutely divine! The Emerald Garden has become my signature scent. The quality and longevity are unmatched.",
    rating: 5,
    initials: "SJ"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Business Executive",
    content: "Golden Oud is the perfect sophisticated scent for business meetings. I constantly receive compliments. Worth every penny!",
    rating: 5,
    initials: "MC"
  },
  {
    id: 3,
    name: "Emma Williams",
    role: "Makeup Artist",
    content: "As someone who works with beauty daily, I appreciate the artistry in VASA's fragrances. Each perfume tells a unique story.",
    rating: 5,
    initials: "EW"
  },
  {
    id: 4,
    name: "David Martinez",
    role: "Entrepreneur",
    content: "The packaging is luxurious and the scents are incredible. VASA has become my go-to gift for special occasions.",
    rating: 5,
    initials: "DM"
  },
  {
    id: 5,
    name: "Lisa Anderson",
    role: "Interior Designer",
    content: "Velvet Rose is pure elegance in a bottle. The scent is sophisticated yet playful. I'm obsessed!",
    rating: 5,
    initials: "LA"
  },
  {
    id: 6,
    name: "James Taylor",
    role: "Photographer",
    content: "The attention to detail in every VASA fragrance is remarkable. They capture emotions and memories beautifully.",
    rating: 5,
    initials: "JT"
  }
];

const Testimonials = () => {
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    setLoadingReviews(true);

    const fetchCentral = async () => {
      try {
        let res = await fetch(`${API_BASE}/reviews/recent`);
        if (res.ok) {
          const data = await res.json();
          setRecentReviews(data.reviews || data || []);
          return;
        }

        res = await fetch(`${API_BASE}/perfumes/recent-reviews`);
        if (res.ok) {
          const data = await res.json();
          setRecentReviews(data.reviews || data || []);
          return;
        }
      } catch (e) {
        // continue to per-product fallback
      }

      try {
        const sample = products.slice(0, 8);
        const promises = sample.map(p =>
          fetch(`${API_BASE}/perfumes/${p.id}/reviews`).then(r => (r.ok ? r.json() : null)).catch(() => null)
        );
        const results = await Promise.all(promises);
        const aggregated: any[] = [];
        results.forEach((r, idx) => {
          if (r && Array.isArray(r.reviews)) {
            r.reviews.forEach((rev: any) => aggregated.push({ ...rev, perfume_id: sample[idx].id }));
          }
        });
        aggregated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentReviews(aggregated.slice(0, 6));
      } catch (e) {
        // optional toast: toast({ title: 'Could not load reviews', variant: 'destructive' })
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchCentral();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied customers who have discovered their signature scent
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {(recentReviews.length > 0 ? recentReviews : testimonials).map((item: any, idx: number) => {
              const isReview = !!item.comment || !!item.rating;
              const content = item.content || item.comment || '';
              const name = item.name || item.user_name || item.username || 'Anonymous';
              const roleOrDate = item.role || (item.created_at ? new Date(item.created_at).toLocaleDateString() : '');
              const rating = item.rating || 0;
              const initials = item.initials || (name.split(' ').map((n: string) => n[0]).slice(0,2).join('').toUpperCase());

              return (
                <CarouselItem key={item.id ?? `t-${idx}`} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full shadow-elegant">
                    <CardContent className="p-6">
                      <Quote className="h-8 w-8 text-accent mb-4" />
                      <p className="text-foreground mb-6 leading-relaxed">
                        {content}
                      </p>
                      <div className="flex items-center gap-1 mb-4">
                        {Array.from({ length: Math.max(0, rating) }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="gradient-primary text-primary-foreground">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{name}</p>
                          <p className="text-sm text-muted-foreground">{roleOrDate}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
        
      </div>
    </section>
  );
};

export default Testimonials;
