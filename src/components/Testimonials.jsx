import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import "@/styles/testimonials.css";

const Testimonials = () => {
  const { id } = useParams();
  const { token, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
    setLoading(true);

    try {
      const headers = token ? {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
      } : {};

      let res;
      if (id) {
          res = await fetch(`${API_BASE}/perfumes/${id}/reviews`, { headers });
        } else {
          // Fetch all reviews and take most recent ones
          res = await fetch(`${API_BASE}/reviews`, { headers });
      }

      if (!res.ok) {
        setRecentReviews([]);
        toast({
          title: "Error",
          description: "Could not load reviews. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const data = await res.json();
        // Handle both single product reviews and all reviews response formats
        const reviews = data.reviews || [];
      
      // Filter to only show reviews with content
      const validReviews = reviews.filter(review => {
          const content = (review.comment || "").trim();
        return content.length > 0;
      });

        // For global reviews, limit to most recent 10
        const sortedReviews = validReviews.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 10);
      
        setRecentReviews(sortedReviews);
    } catch (e) {
      console.error("Failed to load testimonials", e);
      toast({
        title: "Error",
        description: "Could not load reviews. Please try again.",
        variant: "destructive"
      });
      setRecentReviews([]);
    } finally {
      setLoading(false);
    }
  }, [id, token, toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return (
    <section className="py-16 md:py-24 bg-[rgba(244,249,246,0.8)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied customers who have discovered their signature style
          </p>
        </div>

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading reviews...
          </div>
        )}

        {!loading && recentReviews.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
        )}

        {/* Auto-scrolling track with smaller cards in a single row */}
        <div className="testimonials-track-wrapper">
          <div className="testimonials-track">
            {!loading && [...recentReviews, ...recentReviews].map((item, idx) => {
            // Get review content
            const content = item.content || item.comment || "";

            // Get the review author's name from the database
            const reviewAuthorName = item.user_name || "Anonymous User";
            
            // Check if this review belongs to the currently logged-in user
            const isOwnReview = currentUser && (
              String(item.user_id) === String(currentUser.id) || 
              item.user_name === currentUser.username
            );
            
            // Format the display name - show "You" prefix for own reviews
            const displayName = isOwnReview ? `You · ${reviewAuthorName}` : reviewAuthorName;

            // Robust date parsing: try several common fields and guard invalid dates
            const rawDate = item.created_at || item.createdAt || item.date || null;
            let dateLabel = "";
            if (rawDate) {
              const parsed = new Date(rawDate);
              if (!isNaN(parsed.getTime())) dateLabel = parsed.toLocaleDateString();
            }

            // Generate initials for avatar from the actual username (not the "You ·" prefix)
            const initials = (reviewAuthorName.split(" ").map((n) => n[0]).slice(0, 2).join("") || "U").toUpperCase();

            // pick an avatar image URL if provided by the review or nested user
            const avatarUrl = (isOwnReview && currentUser && (currentUser.avatar || currentUser.photo_url || currentUser.image)) || item.avatar || item.photo_url || null;

            // deterministic color per username when no avatar image is available
            const colorFromString = (str) => {
              if (!str) return '#16a34a'; // green-600
              let hash = 0;
              for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
              }
              const hue = Math.abs(hash) % 360;
              return `hsl(${hue} 65% 35%)`;
            };
            const avatarBg = colorFromString(reviewAuthorName);

            return (
              <Card key={`${item.id ?? 't'}-${idx}`} className="bg-white rounded-lg shadow p-4 w-[180px] h-[210px] flex-shrink-0">
                <CardContent className="p-3 flex flex-col justify-between h-full">
                  <div>
                    <div className="mb-1">
                      <Quote className="h-4 w-4 text-yellow-400" />
                    </div>
                    <p className="text-foreground mb-2 leading-relaxed text-base line-clamp-3">{content}</p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    <Avatar className="h-6 w-6">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={reviewAuthorName} />
                      ) : (
                        <AvatarFallback className="text-white text-xs" style={{ backgroundColor: avatarBg }}>
                          {initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{dateLabel || '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
