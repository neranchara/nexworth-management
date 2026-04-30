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
    <div className="min-h-screen bg-slate-950 transition-colors text-slate-300 font-sans">
      <nav className="bg-slate-900/50 backdrop-blur-xl sticky top-0 z-[100] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center flex-1">
              <div className="flex-shrink-0 flex items-center mr-10 gap-3">
                <span className="text-xl font-black text-blue-500 tracking-tight">Nexworth</span>
                {user?.orgName && (
                  <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg border border-blue-500/20 uppercase tracking-widest">
                    {user.orgName}
                  </span>
                )}
              </div>
              <div className="hidden sm:-my-px sm:flex sm:space-x-1">
                 {!isMasterOrg && hasPermission('dashboard') && (
                  <Link href="/dashboard" data-testid="layout-nav-link-dashboard" className="text-slate-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all">
                    Dashboard
                  </Link>
                )}
                 {!isMasterOrg && hasPermission('monthly') && (
                  <Link href="/dashboard/monthly" data-testid="layout-nav-link-summary" className="text-slate-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all">
                    Summary
                  </Link>
                )}
                 {!isMasterOrg && hasPermission('transactions') && (
                  <Link href="/dashboard/transactions" data-testid="layout-nav-link-transactions" className="text-slate-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all">
                    Transactions
                  </Link>
                )}
                 {!isMasterOrg && hasPermission('assets') && (
                  <Link href="/dashboard/assets" data-testid="layout-nav-link-assets" className="text-slate-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all">
                    Assets
                  </Link>
                )}
                 {!isMasterOrg && hasPermission('liabilities') && (
                  <Link href="/dashboard/liabilities" data-testid="layout-nav-link-liabilities" className="text-slate-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all">
                    Liabilities
                  </Link>
                )}
                 {!isMasterOrg && hasPermission('loan-tracker') && (
                  <Link href="/dashboard/loan-tracker" data-testid="layout-nav-link-loan-tracker" className="text-slate-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all">
                    Loan Tracker
                  </Link>
                )}

                 {user.isSystemAdmin && (
                  <Link href="/dashboard/organizations" data-testid="layout-nav-link-organizations" className="text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 px-4 py-2 rounded-xl text-[13px] font-black transition-all">
                    Organizations
                  </Link>
                )}
                
                {(hasPermission('accounts') || hasPermission('users') || hasPermission('banks') || hasPermission('types') || hasPermission('categories') || hasPermission('permissions')) && (
                  <div className="relative group flex items-center h-full ml-2">
                    <button data-testid="layout-nav-btn-setup" className="text-slate-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-xl text-[13px] font-bold gap-1 focus:outline-none flex items-center transition-all">
                      Setup <ChevronDown className="w-3.5 h-3.5 ml-1"/>
                    </button>
                    <div className="absolute top-full left-0 w-56 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-slate-800/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/10 overflow-hidden py-2">
                        {!isMasterOrg && hasPermission('accounts') && <Link href="/dashboard/accounts" data-testid="layout-nav-link-setup-accounts" className="block px-5 py-2.5 text-[13px] font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Accounts</Link>}
                        {(user.isSystemAdmin || hasPermission('users')) && <Link href="/dashboard/users" data-testid="layout-nav-link-setup-users" className="block px-5 py-2.5 text-[13px] font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Users Management</Link>}
                        {!isMasterOrg && hasPermission('banks') && <Link href="/dashboard/banks" data-testid="layout-nav-link-setup-banks" className="block px-5 py-2.5 text-[13px] font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Banks Management</Link>}
                        {!isMasterOrg && hasPermission('types') && <Link href="/dashboard/types" data-testid="layout-nav-link-setup-types" className="block px-5 py-2.5 text-[13px] font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Transaction Types</Link>}
                        {!isMasterOrg && hasPermission('categories') && <Link href="/dashboard/categories" data-testid="layout-nav-link-setup-categories" className="block px-5 py-2.5 text-[13px] font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Categories</Link>}
                        {(user.isSystemAdmin || hasPermission('permissions')) && <Link href="/dashboard/permissions" data-testid="layout-nav-link-setup-permissions" className="block px-5 py-2.5 text-[13px] font-black text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 border-t border-white/5 mt-1 pt-3 transition-colors">Role Permissions</Link>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-5">
                {/* Sleek Admin Pill */}
                <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-[11px] font-black text-slate-300 capitalize tracking-wide">
                    {user.role.toLowerCase() === 'admin' ? 'Admin' : user.role}
                  </span>
                </div>
                
                 <Link 
                  href="/dashboard/profile" 
                  data-testid="layout-nav-link-profile"
                  className="flex items-center space-x-2.5 text-sm text-slate-400 hover:text-white transition-colors group"
                >
                  <div className="p-1.5 rounded-full bg-slate-800 group-hover:bg-blue-600 transition-colors border border-white/5">
                    <UserIcon className="w-4 h-4 group-hover:text-white transition-colors" />
                  </div>
                  <span className="max-w-[150px] truncate font-medium text-[13px]">
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                  </span>
                </Link>
              </div>
              
               <button
                onClick={handleLogout}
                data-testid="layout-nav-btn-logout"
                className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all focus:outline-none border border-transparent"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
