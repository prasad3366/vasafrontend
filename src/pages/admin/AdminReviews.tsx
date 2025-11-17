import React, { useEffect, useState } from 'react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AdminReviews = () => {
  const { token } = useAuth();
  const [reviewsByPerfume, setReviewsByPerfume] = useState({} as Record<string, any>);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadReviews = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await ApiClient.adminGetAllReviews(token);
      // Expecting { total_reviews, reviews_by_perfume }
      const grouped = res.reviews_by_perfume || {};
      setReviewsByPerfume(grouped);
    } catch (err: any) {
      console.error('Failed to load admin reviews', err);
      toast({ title: 'Error', description: 'Failed to load reviews', variant: 'destructive' });
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
      // reload
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
        <h1 className="text-3xl font-bold mb-6">Customer Reviews</h1>

        {loading && <div>Loading...</div>}

        {Object.keys(reviewsByPerfume).length === 0 && !loading && (
          <div className="text-muted-foreground">No reviews found.</div>
        )}

        {Object.entries(reviewsByPerfume).map(([perfumeId, data]) => (
          <section key={perfumeId} className="mb-8">
            <h2 className="text-xl font-semibold mb-2">{data.perfume_name}</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Review ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.reviews.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.user_name} ({r.user_id})</TableCell>
                    <TableCell>{r.rating}</TableCell>
                    <TableCell className="max-w-xl truncate">{r.comment}</TableCell>
                    <TableCell>{r.created_at}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(r.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        ))}
      </div>
    </div>
  );
};

export default AdminReviews;
