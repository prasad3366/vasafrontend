import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ShippingReturns() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-4">Shipping & Returns</h1>
        <p className="text-muted-foreground mb-6">Here you'll find our shipping options, delivery times, and return policy.</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Shipping</h2>
          <p className="text-muted-foreground">We offer standard and expedited shipping. Orders typically ship within 1-2 business days. Delivery times vary by region.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Returns</h2>
          <p className="text-muted-foreground">We accept returns within 7 days of delivery for unopened items. To initiate a return, contact our support team with your order number.</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
