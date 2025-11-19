import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-4">Cookie Policy</h1>
        <p className="text-muted-foreground mb-6">This Cookie Policy explains how VASA uses cookies and similar technologies on our website.</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">What Are Cookies?</h2>
          <p className="text-muted-foreground">Cookies are small text files stored on your device to improve functionality and analytics.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Types of Cookies</h2>
          <p className="text-muted-foreground">We use essential cookies for site operation, analytics cookies to understand usage, and marketing cookies for personalized content.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Managing Cookies</h2>
          <p className="text-muted-foreground">You can manage cookie preferences via your browser settings. Disabling certain cookies may affect site functionality.</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
