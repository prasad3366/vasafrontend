import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-6">Welcome to VASA. By using our website you agree to these Terms of Service. Please read them carefully.</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Use of the Site</h2>
          <p className="text-muted-foreground">You agree to use the site only for lawful purposes and in a way that does not infringe the rights of others.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Orders and Payment</h2>
          <p className="text-muted-foreground">All orders are subject to acceptance and availability. Payment processing is handled securely; please review our payment terms.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Limitation of Liability</h2>
          <p className="text-muted-foreground">We are not liable for indirect damages except as required by law. Please contact us for any concerns.</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
