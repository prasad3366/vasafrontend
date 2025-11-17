"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Review {
  id: number;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewsProps {
  productId: string;
}

export function Reviews({ productId }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>("");
  const [ratingTouched, setRatingTouched] = useState<boolean>(false);
  const [submittedRating, setSubmittedRating] = useState<number | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const { token, user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

  useEffect(() => {
    if (!productId) return;

    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const res = await fetch(`${API_BASE}/perfumes/${productId}/reviews`);
        const data = await res.json();
        console.log('[Reviews] Raw backend response:', data);

        if (data.reviews) {
          console.log('[Reviews] Raw reviews array:', data.reviews);
          console.log('[Reviews] Backend provided average:', data.perfume?.average_rating);
          const reviews = Array.isArray(data.reviews) ? data.reviews : [];
          setReviews(reviews);

          // Calculate average rating from reviews if not provided by backend
          let avgRating = data.perfume?.average_rating;
          if (avgRating == null && reviews.length > 0) {
            const sum = reviews.reduce((acc: number, rev: any) => acc + (Number(rev.rating) || 0), 0);
            avgRating = Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal
          }
          setAvgRating(avgRating ?? null);

          // Use total from perfume object or calculate from reviews array
          const total = data.perfume?.total_reviews ?? reviews.length ?? 0;
          setTotalReviews(total);

          // If the current user already has a review, lock the rating to that value
          try {
            const myReview = reviews.find((rv: any) => rv.user_id === user?.id);
            if (myReview) {
              setSubmittedRating(myReview.rating ?? null);
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        // Fallback mock data
        setReviews([
          {
            id: 1,
            user_id: 1,
            user_name: "Sarah Johnson",
            rating: 5,
            comment: "Amazing fragrance! Long-lasting and beautiful.",
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            user_id: 2,
            user_name: "Michael Chen",
            rating: 4,
            comment: "Great scent, though a bit pricey.",
            created_at: new Date().toISOString(),
          },
        ]);
        setAvgRating(4.5);
        setTotalReviews(2);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [productId, API_BASE, user?.id]);

  const refreshReviews = async () => {
    try {
      const res = await fetch(`${API_BASE}/perfumes/${productId}/reviews`);
      const data = await res.json();
      if (data.reviews) {
        const reviews = Array.isArray(data.reviews) ? data.reviews : [];
        setReviews(reviews);

        // Recalculate average on refresh
        let avgRating = data.perfume?.average_rating;
        if (avgRating == null && reviews.length > 0) {
          const sum = reviews.reduce((acc: number, rev: any) => acc + (Number(rev.rating) || 0), 0);
          avgRating = Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal
        }
        setAvgRating(avgRating ?? null);

        const total = data.perfume?.total_reviews ?? reviews.length ?? 0;
        setTotalReviews(total);
      }
    } catch (err) {
      // Silently fail
    }
  };

  const handleSubmitReview = async () => {
    if (submittedRating !== null) {
      toast({ title: "Info", description: "You have already submitted a review for this product." });
      return;
    }
    if (!isAuthenticated || !token) {
      toast({
        title: "Login required",
        description: "You must be logged in to add a review.",
      });
      navigate("/login");
      return;
    }

    const comment = newComment.trim();
    if (!comment) {
      toast({ title: "Error", description: "Comment is required." });
      return;
    }

    const form = new FormData();
    form.append("rating", String(newRating));
    form.append("comment", comment);
    
    // Always include user information from the authenticated session
    if (!user?.username || !user?.id) {
      toast({
        title: "Error",
        description: "User information is missing. Please try logging in again.",
      });
      return;
    }

    // Required: Include user info for the review
    form.append("user_name", user.username);
    form.append("user_id", String(user.id));

    try {
      const res = await fetch(`${API_BASE}/perfumes/${productId}/reviews`, {
        method: "POST",
        headers: {
          Authorization: token || "",
        },
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      toast({
        title: "Success!",
        description: "Your review has been added.",
      });

      setNewComment("");
      // lock the submitted rating and prevent further rating changes/submissions
      setSubmittedRating(newRating);
      refreshReviews();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not submit review.",
      });
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    if (!token) {
      toast({ title: "Error", description: "Authentication required." });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/perfumes/${productId}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: token || "",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete review");
      }

      toast({ title: "Deleted", description: "Review removed successfully." });
      refreshReviews();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not delete review.",
      });
    }
  };

  return (
    <div className="mt-12 container mx-auto px-4">
      <h2 className="text-2xl font-semibold mb-4">Reviews</h2>

      <div className="mb-6">
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  avgRating && avgRating > 0 && star <= Math.round(avgRating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-200 fill-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-600">
            ({totalReviews === 0 ? "0 reviews" : `${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'}`})
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loadingReviews && <div className="text-sm">Loading reviews...</div>}

        {!loadingReviews && reviews.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No reviews yet. Be the first to review!
          </div>
        )}

        {reviews.map((r) => (
          <div key={r.id} className="border p-6 rounded-lg bg-card text-base">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.user_name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <div className="font-semibold text-yellow-500">{r.rating} stars</div>
            </div>
            <p className="mt-2 text-sm">{r.comment}</p>

            {(user?.id === r.user_id || user?.role_id === 1) && (
              <div className="mt-3">
                <button
                  onClick={() => handleDeleteReview(r.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 border-t pt-8">
        <h3 className="text-lg font-medium mb-4">Write a Review</h3>
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    if (submittedRating !== null) return; // lock after submit
                    setNewRating(n);
                    setRatingTouched(true);
                  }}
                  aria-label={`${n} Star${n > 1 ? 's' : ''}`}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 cursor-pointer transition-colors ${n <= (submittedRating !== null ? submittedRating : (ratingTouched ? newRating : 0)) ? 'text-yellow-400' : 'text-muted-foreground'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Your Review</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full border rounded-md p-3 text-sm"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {newComment.length}/500 characters
            </p>
          </div>

          <Button onClick={handleSubmitReview} className="gradient-primary" disabled={submittedRating !== null}>
            {submittedRating !== null ? 'Submitted' : 'Submit Review'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Reviews;