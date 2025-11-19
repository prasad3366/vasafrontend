import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FAQ from '@/components/FAQ';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-4">Frequently Asked Questions</h1>
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
