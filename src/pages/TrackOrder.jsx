import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const { toast } = useToast();

  const handleTrack = (e) => {
    e.preventDefault();
    if (!orderId.trim()) {
      toast({ title: 'Enter order number', variant: 'destructive' });
      return;
    }

    // In a full implementation we'd call an API here. For now show a placeholder.
    toast({ title: 'Tracking', description: `Looking up order ${orderId}` });
    // Optionally navigate to Orders page or show order status UI
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-4">Track Order</h1>
        <p className="text-muted-foreground mb-6">Enter your order number to view status and delivery updates.</p>

        <form onSubmit={handleTrack} className="flex gap-2">
          <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order number" />
          <Button type="submit">Track</Button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
