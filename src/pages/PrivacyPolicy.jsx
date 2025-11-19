import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">This Privacy Policy explains how VASA collects, uses, discloses, and safeguards your information when you visit our website.</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>
          <p className="text-muted-foreground">We may collect personal information that you voluntarily provide such as name, email address, shipping address, and payment details when you place an order or create an account.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">How We Use Your Information</h2>
          <p className="text-muted-foreground">We use your information to process orders, provide customer support, send order updates, and improve our services. We do not sell your personal data to third parties.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Cookies and Tracking</h2>
          <p className="text-muted-foreground">We use cookies to provide a better browsing experience and to remember preferences. See our Cookie Policy for details on how cookies are used.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
          <p className="text-muted-foreground">If you have questions about this policy, please contact us at hello@vasa.com.</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
