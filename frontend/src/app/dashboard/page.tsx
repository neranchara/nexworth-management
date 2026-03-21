'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome back, {user?.firstName} {user?.lastName}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {/* Features Card Based on Role */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Your Role Overview</h3>
          <p className="mt-2 text-blue-600 dark:text-blue-400">
            You are currently logged in as an <strong>{user?.role}</strong>. 
          </p>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            {user?.role === 'Admin' && (
              <Link 
                href="/dashboard/users"
                className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                Manage Users
              </Link>
            )}
            {user?.role === 'Guest' && (
              <span className="text-sm text-gray-500">You have read-only access to this dashboard.</span>
            )}
            {user?.role === 'Production User' && (
              <span className="text-sm text-gray-500">You can manage production and inventory operations.</span>
            )}
            {user?.role === 'Officer' && (
              <span className="text-sm text-gray-500">You can manage financial records and invoices.</span>
            )}
          </div>
        </div>

        {/* Dummy Statistics Card */}
        <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
           <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Assets</h3>
           <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">$124,500</p>
           <span className="inline-flex items-center text-sm font-medium text-green-600 mt-2">
              +4.75% from last month
           </span>
        </div>

        {/* Dummy Statistics Card */}
        <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
           <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recent Expenses</h3>
           <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">$3,240</p>
           <span className="inline-flex items-center text-sm font-medium text-red-600 mt-2">
              -1.2% from last month
           </span>
        </div>
      </div>
    </div>
  );
}
