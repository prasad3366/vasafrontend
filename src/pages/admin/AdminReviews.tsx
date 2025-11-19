import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { Button } from '@/components/ui/button';
import { ApiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AdminReviews = () => {
  const { token } = useAuth();
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [groupedReviews, setGroupedReviews] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadReviews = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await ApiClient.adminGetAllReviews(token);
      // Expect shape: { total_reviews, reviews_by_perfume: { [perfume_id]: { perfume_name, reviews: [...] } } }
      let grouped: Record<string, any[]> = {};
      if (data && typeof data === 'object' && data.reviews_by_perfume) {
        Object.values(data.reviews_by_perfume).forEach((group: any) => {
          const name = group.perfume_name || 'Unknown Product';
          if (!grouped[name]) grouped[name] = [];
          if (Array.isArray(group.reviews)) {
            grouped[name].push(...group.reviews);
          }
        });
      }
      setGroupedReviews(grouped);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to load reviews', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadReviews();
  }, [token]);

  const handleDelete = async (reviewId: number) => {
    if (!token) return;
    if (!window.confirm('Delete this review?')) return;
    try {
      await ApiClient.adminDeleteReview(reviewId, token);
      toast({ title: 'Deleted', description: 'Review deleted' });
      await loadReviews();
    } catch (err: any) {
      console.error('Failed to delete review', err);
      toast({ title: 'Error', description: err?.message || 'Failed to delete review', variant: 'destructive' });
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-8">
        <AdminNavigation />
        <h1 className="text-3xl font-bold mb-6">All Customer Reviews</h1>

        {loading && <div>Loading...</div>}

        {Object.keys(groupedReviews).length === 0 && !loading && (
          <div className="text-muted-foreground mb-4">No customer reviews found for any products.</div>
        )}

        {Object.entries(groupedReviews).map(([productName, reviews]) => (
          <div key={productName} className="bg-white rounded-lg shadow border mb-8">
            <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b">
              <div className="font-semibold text-lg">{productName}</div>
              <div className="text-sm text-gray-500">{reviews.length} review(s)</div>
            </div>
            {reviews.map((r: any) => (
              <div key={r.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between border-b last:border-b-0">
                <div className="flex-1">
                  <div className="font-bold">{r.user_name || r.user || 'Unknown'}
                    <span className="ml-2 text-xs text-gray-500">{r.user_email || r.email || ''}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">{r.created_at || r.date || ''}</div>
                  <div className="mb-1">Rating: {r.rating} / 5</div>
                  <div className="text-sm">{r.comment || r.content || ''}</div>
                </div>
                <div className="mt-2 md:mt-0 md:ml-4">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(r.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReviews;
