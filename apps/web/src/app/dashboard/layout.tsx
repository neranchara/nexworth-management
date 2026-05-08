'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { 
  LogOut, 
  User as UserIcon, 
  ShieldAlert, 
  ChevronDown, 
  Menu, 
  X, 
  LayoutDashboard, 
  BarChart3, 
  Receipt, 
  Wallet, 
  CreditCard, 
  HandCoins, 
  Settings,
  Building2,
  Lock
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';
import Logo from '@/components/common/Logo';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-brand-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  const isMasterOrg = user?.organizationId === 'ee81df9d-bb14-419b-bd49-d4c77b4d4214' || user?.orgName === 'System Management';

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, resource: 'dashboard' },
    { href: '/dashboard/monthly', label: 'Summary', icon: BarChart3, resource: 'monthly' },
    { href: '/dashboard/transactions', label: 'Transactions', icon: Receipt, resource: 'transactions' },
    { href: '/dashboard/assets', label: 'Assets', icon: Wallet, resource: 'assets' },
    { href: '/dashboard/liabilities', label: 'Liabilities', icon: CreditCard, resource: 'liabilities' },
    { href: '/dashboard/loan-tracker', label: 'Loans', icon: HandCoins, resource: 'loan-tracker' },
  ];

  const setupLinks = [
    { href: '/dashboard/accounts', label: 'Accounts', icon: Wallet, resource: 'accounts' },
    { href: '/dashboard/users', label: 'Users', icon: UserIcon, resource: 'users', systemAdmin: true },
    { href: '/dashboard/banks', label: 'Banks', icon: Building2, resource: 'banks' },
    { href: '/dashboard/types', label: 'Types', icon: Settings, resource: 'types' },
    { href: '/dashboard/categories', label: 'Categories', icon: Settings, resource: 'categories' },
    { href: '/dashboard/permissions', label: 'Permissions', icon: Lock, resource: 'permissions', systemAdmin: true },
  ];

  return (
    <div className="min-h-screen bg-brand-primary transition-colors text-slate-300 font-sans selection:bg-brand-accent/30">
      {/* --- MOBILE DRAWER OVERLAY --- */}
      <div 
        className={clsx(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] transition-opacity lg:hidden",
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* --- MOBILE SIDE DRAWER --- */}
      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 w-72 bg-brand-primary border-r border-white/5 z-[200] transform transition-transform duration-300 ease-out lg:hidden shadow-2xl",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <Logo showText={true} textColor="text-white" />
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg bg-white/5 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Menu</div>
            {navLinks.map((link) => (
              !isMasterOrg && hasPermission(link.resource) && (
                <Link 
                  key={link.href}
                  href={link.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <link.icon className="w-4 h-4 text-brand-accent/70" />
                  {link.label}
                </Link>
              )
            ))}

            <div className="px-3 py-2 pt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-t border-white/5 mt-4">System Setup</div>
            {setupLinks.map((link) => (
              (link.systemAdmin ? (user.isSystemAdmin || hasPermission(link.resource)) : (!isMasterOrg && hasPermission(link.resource))) && (
                <Link 
                  key={link.href}
                  href={link.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <link.icon className="w-4 h-4 text-brand-secondary" />
                  {link.label}
                </Link>
              )
            ))}
          </div>

          <div className="p-4 border-t border-white/5">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-400/10 transition-all">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* --- DESKTOP & MOBILE TOP BAR --- */}
      <nav className="bg-brand-primary/50 backdrop-blur-xl sticky top-0 z-[100] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Hamburger Icon */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 mr-4 rounded-xl bg-white/5 text-slate-400 lg:hidden hover:text-white transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex-shrink-0 flex items-center mr-10 gap-3">
                <Logo showText={true} textColor="text-white" />
                {user?.orgName && (
                  <span className="hidden xs:inline-block text-[10px] pillar-text-bold bg-brand-accent/10 text-brand-accent px-2.5 py-1 rounded-lg border border-brand-accent/20 tracking-widest uppercase">
                    {user.orgName}
                  </span>
                )}
              </div>

              {/* Desktop Nav Links */}
              <div className="hidden lg:flex items-center space-x-1">
                {navLinks.map((link) => (
                  !isMasterOrg && hasPermission(link.resource) && (
                    <Link 
                      key={link.href}
                      href={link.href} 
                      className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all group tracking-wide"
                    >
                      <link.icon className="w-4 h-4 text-brand-accent/40 group-hover:text-brand-accent transition-colors" />
                      {link.label.toUpperCase()}
                    </Link>
                  )
                ))}

                {/* Setup Dropdown Desktop */}
                <div className="relative group flex items-center h-full ml-2">
                  <button className="text-slate-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-xl text-[13px] font-bold gap-1 focus:outline-none flex items-center transition-all group">
                    <Settings className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors mr-1" />
                    Setup <ChevronDown className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />
                  </button>
                  <div className="absolute top-full left-0 w-64 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-slate-900/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/10 overflow-hidden py-3">
                      {setupLinks.map((link) => (
                        (link.systemAdmin ? (user.isSystemAdmin || hasPermission(link.resource)) : (!isMasterOrg && hasPermission(link.resource))) && (
                          <Link 
                            key={link.href}
                            href={link.href} 
                            className="flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <link.icon className="w-4 h-4 opacity-50" />
                            {link.label}
                          </Link>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard/profile" 
                className="flex items-center space-x-2.5 text-sm text-slate-400 hover:text-white transition-colors group"
              >
                <div className="p-2 rounded-xl bg-white/5 group-hover:bg-blue-600 transition-colors border border-white/5 shadow-inner">
                  <UserIcon className="w-4 h-4 group-hover:text-white transition-colors" />
                </div>
                <span className="hidden md:block max-w-[120px] truncate font-bold text-[12px] tracking-wide">
                  {user.firstName || user.email}
                </span>
              </Link>
              
              <button
                onClick={handleLogout}
                data-testid="layout-nav-btn-logout"
                className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all border border-transparent"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 mb-24 lg:mb-8">
        {children}
      </main>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-2xl border-t border-white/5 z-[100] lg:hidden">
        <div className="flex justify-around items-center h-20 px-2 max-w-md mx-auto">
          {[
            { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
            { href: '/dashboard/transactions', icon: Receipt, label: 'List' },
            { href: '/dashboard/monthly', icon: BarChart3, label: 'Stats' },
            { href: '/dashboard/loan-tracker', icon: HandCoins, label: 'Loans' },
          ].map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1.5 w-full h-full text-slate-500 hover:text-blue-500 transition-all group"
            >
              <div className="p-1 rounded-lg group-active:scale-90 transition-transform">
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            </Link>
          ))}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1.5 w-full h-full text-slate-500 hover:text-blue-500"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
