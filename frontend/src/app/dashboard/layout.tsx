'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { LogOut, User as UserIcon, ShieldAlert, ChevronDown } from 'lucide-react';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const hasPermission = (resource: string, action: 'canView' | 'canCreate' | 'canUpdate' | 'canDelete' = 'canView') => {
    if (!user || !user.permissions) return false;
    // Admins have full access if no specific permission is defined? 
    // Actually, let's keep it strict: respect the permissions table.
    const perm = user.permissions.find(p => p.resource === resource);
    return perm ? perm[action] : false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  const isMasterOrg = user?.organizationId === 'master-org-id';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center mr-8 gap-2">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Nexworth</span>
                {user?.orgName && (
                  <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                    {user.orgName}
                  </span>
                )}
              </div>
              <div className="hidden sm:-my-px sm:flex sm:space-x-8">
                {!isMasterOrg && hasPermission('dashboard') && (
                  <Link href="/dashboard" className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:border-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Dashboard
                  </Link>
                )}
                {!isMasterOrg && hasPermission('monthly') && (
                  <Link href="/dashboard/monthly" className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:border-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Monthly Summary
                  </Link>
                )}
                {!isMasterOrg && hasPermission('transactions') && (
                  <Link href="/dashboard/transactions" className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:border-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Transactions
                  </Link>
                )}
                {!isMasterOrg && hasPermission('assets') && (
                  <Link href="/dashboard/assets" className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:border-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Assets
                  </Link>
                )}
                {!isMasterOrg && hasPermission('liabilities') && (
                  <Link href="/dashboard/liabilities" className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:border-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Liabilities
                  </Link>
                )}
                {!isMasterOrg && hasPermission('loan-tracker') && (
                  <Link href="/dashboard/loan-tracker" className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:border-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Loan Tracker
                  </Link>
                )}

                {user.isSystemAdmin && (
                  <Link href="/dashboard/organizations" className="border-transparent text-orange-600 dark:text-orange-400 font-bold hover:text-orange-700 hover:border-orange-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm">
                    Organizations
                  </Link>
                )}
                
                {(hasPermission('accounts') || hasPermission('users') || hasPermission('banks') || hasPermission('types') || hasPermission('categories') || hasPermission('permissions')) && (
                  <div className="relative group flex items-center h-full">
                    <button className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:border-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-1 focus:outline-none h-full">
                      Setup <ChevronDown className="w-4 h-4"/>
                    </button>
                    <div className="absolute top-10 left-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                      <div className="py-1 flex flex-col">
                        {!isMasterOrg && hasPermission('accounts') && <Link href="/dashboard/accounts" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Accounts</Link>}
                        {hasPermission('users') && <Link href="/dashboard/users" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Users Management</Link>}
                        {!isMasterOrg && hasPermission('banks') && <Link href="/dashboard/banks" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Banks Management</Link>}
                        {!isMasterOrg && hasPermission('types') && <Link href="/dashboard/types" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Transaction Types</Link>}
                        {!isMasterOrg && hasPermission('categories') && <Link href="/dashboard/categories" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Categories</Link>}
                        {hasPermission('permissions') && <Link href="/dashboard/permissions" className="block px-4 py-2 text-sm text-orange-600 dark:text-orange-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700">Role Permissions</Link>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                <ShieldAlert className="w-4 h-4 text-orange-500" />
                <span className="font-medium">{user.role}</span>
              </div>
              
              <Link href="/dashboard/profile" className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <UserIcon className="w-5 h-5" />
                <span>{user.email}</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
