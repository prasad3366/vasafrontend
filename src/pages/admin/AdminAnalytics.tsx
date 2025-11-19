import React from 'react';
import Navbar from '@/components/Navbar';
import AdminNavigation from '@/components/admin/AdminNavigation';
import SalesAnalytics from '@/components/admin/SalesAnalytics';

const AdminAnalytics = () => {
  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto p-8">
        <header className="mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2 mb-6">Sales Analytics & Reports</p>
        </header>

        <AdminNavigation />

        <div className="mb-4">
          {/* SalesAnalytics contains filters, charts and the top-products table */}
          <SalesAnalytics />
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
