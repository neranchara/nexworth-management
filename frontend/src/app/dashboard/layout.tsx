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
    const perm = user.permissions.find(p => p.resource === resource);
    const result = perm ? perm[action] : false;
    if (user.role === 'Guest' && resource === 'users') {
       console.log(`DEBUG: Guest permission for ${resource}:`, result);
    }
    return result;
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

  const isMasterOrg = user?.organizationId === 'ee81df9d-bb14-419b-bd49-d4c77b4d4214' || user?.orgName === 'System Management';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-[100] border-b border-gray-100 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-14">
            <div className="flex items-center flex-1">
              <div className="flex-shrink-0 flex items-center mr-12 gap-3">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">Nexworth</span>
                {user?.orgName && (
                  <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800/50 uppercase tracking-tight">
                    {user.orgName}
                  </span>
                )}
              </div>
                <div className="hidden sm:-my-px sm:flex sm:space-x-5">
                 {!isMasterOrg && hasPermission('dashboard') && (
                  <Link href="/dashboard" data-testid="layout-nav-link-dashboard" className="border-transparent text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center px-1 pt-1 border-b-2 text-[13px] font-medium transition-colors">
                    Dashboard
                  </Link>
                )}
                 {!isMasterOrg && hasPermission('monthly') && (
                  <Link href="/dashboard/monthly" data-testid="layout-nav-link-summary" className="border-transparent text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center px-1 pt-1 border-b-2 text-[13px] font-medium transition-colors">
                    Summary
                  </Link>
                )}
                 {!isMasterOrg && hasPermission('transactions') && (
                  <Link href="/dashboard/transactions" data-testid="layout-nav-link-transactions" className="border-transparent text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center px-1 pt-1 border-b-2 text-[13px] font-medium transition-colors">
                    Transactions
                  </Link>
                )}
                 {!isMasterOrg && hasPermission('assets') && (
                  <Link href="/dashboard/assets" data-testid="layout-nav-link-assets" className="border-transparent text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center px-1 pt-1 border-b-2 text-[13px] font-medium transition-colors">
                    Assets
                  </Link>
                )}
                 {!isMasterOrg && hasPermission('liabilities') && (
                  <Link href="/dashboard/liabilities" data-testid="layout-nav-link-liabilities" className="border-transparent text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center px-1 pt-1 border-b-2 text-[13px] font-medium transition-colors">
                    Liabilities
                  </Link>
                )}
                 {!isMasterOrg && hasPermission('loan-tracker') && (
                  <Link href="/dashboard/loan-tracker" data-testid="layout-nav-link-loan-tracker" className="border-transparent text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center px-1 pt-1 border-b-2 text-[13px] font-medium transition-colors">
                    Loan Tracker
                  </Link>
                )}

                 {user.isSystemAdmin && (
                  <Link href="/dashboard/organizations" data-testid="layout-nav-link-organizations" className="border-transparent text-orange-600 dark:text-orange-400 font-bold hover:text-orange-700 hover:border-orange-300 inline-flex items-center px-1 pt-1 border-b-2 text-[13px]">
                    Organizations
                  </Link>
                )}
                
                {(hasPermission('accounts') || hasPermission('users') || hasPermission('banks') || hasPermission('types') || hasPermission('categories') || hasPermission('permissions')) && (
                  <div className="relative group flex items-center h-full">
                    <button data-testid="layout-nav-btn-setup" className="border-transparent text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center px-1 pt-1 border-b-2 text-[13px] font-medium gap-1 focus:outline-none h-full transition-colors">
                      Setup <ChevronDown className="w-3.5 h-3.5"/>
                    </button>
                    <div className="absolute top-full left-0 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-b-lg border-x border-b border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 overflow-hidden">
                       <div className="py-1 flex flex-col">
                        {!isMasterOrg && hasPermission('accounts') && <Link href="/dashboard/accounts" data-testid="layout-nav-link-setup-accounts" className="block px-4 py-2.5 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">Accounts</Link>}
                        {(user.isSystemAdmin || hasPermission('users')) && <Link href="/dashboard/users" data-testid="layout-nav-link-setup-users" className="block px-4 py-2.5 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">Users Management</Link>}
                        {!isMasterOrg && hasPermission('banks') && <Link href="/dashboard/banks" data-testid="layout-nav-link-setup-banks" className="block px-4 py-2.5 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">Banks Management</Link>}
                        {!isMasterOrg && hasPermission('types') && <Link href="/dashboard/types" data-testid="layout-nav-link-setup-types" className="block px-4 py-2.5 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">Transaction Types</Link>}
                        {!isMasterOrg && hasPermission('categories') && <Link href="/dashboard/categories" data-testid="layout-nav-link-setup-categories" className="block px-4 py-2.5 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">Categories</Link>}
                        {(user.isSystemAdmin || hasPermission('permissions')) && <Link href="/dashboard/permissions" data-testid="layout-nav-link-setup-permissions" className="block px-4 py-2.5 text-[13px] text-orange-600 dark:text-orange-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 transition-colors">Role Permissions</Link>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-4">
                <div className="flex items-center space-x-1.5 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1 rounded-md border border-gray-100 dark:border-gray-700">
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
                  <span className="font-semibold uppercase tracking-wider">{user.role}</span>
                </div>
                
                 <Link 
                  href="/dashboard/profile" 
                  data-testid="layout-nav-link-profile"
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                >
                  <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <span className="max-w-[150px] truncate">
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                  </span>
                </Link>
              </div>
              
               <button
                onClick={handleLogout}
                data-testid="layout-nav-btn-logout"
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all focus:outline-none border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
