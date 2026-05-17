'use client';

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import MobileNavDrawer from './MobileNavDrawer';
import { useDashboardNav } from './useDashboardNav';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { mainLinks, mgmtLinks, setupLabel } = useDashboardNav();
  const router = useRouter();

  // Initialize sidebar state
  useEffect(() => {
    let lastWidth = window.innerWidth;
    const isDesktop = lastWidth >= 1280;
    const saved = localStorage.getItem('nexworth-sidebar-collapsed');
    
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    } else {
      // Default: Expanded on Desktop, Collapsed on Mobile/Tablet
      setIsCollapsed(!isDesktop);
    }
    
    setIsLoaded(true);
    checkAuth();

    const handleAutoCollapse = () => {
      const currentWidth = window.innerWidth;
      
      // Force collapse when shrinking into mobile/tablet view
      if (lastWidth >= 1280 && currentWidth < 1280) {
        setIsCollapsed(true);
      } 
      // Auto-expand when expanding into desktop view (per QA feedback)
      else if (lastWidth < 1280 && currentWidth >= 1280) {
        setIsCollapsed(false);
      }
      
      lastWidth = currentWidth;
    };
    
    window.addEventListener('resize', handleAutoCollapse);
    return () => window.removeEventListener('resize', handleAutoCollapse);
  }, [checkAuth]);

  // Persist sidebar state
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('nexworth-sidebar-collapsed', String(isCollapsed));
      // Trigger resize event for charts
      window.dispatchEvent(new Event('resize'));
    }
  }, [isCollapsed, isLoaded]);

  // Auth Redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated && isLoaded) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, isLoaded, router]);

  if (isLoading || !isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-midnight">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-emerald/20 rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-[10px] text-slate tracking-widest uppercase font-bold">Initializing Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-midnight text-slate-100 selection:bg-emerald/30">
      <MobileNavDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        mainLinks={mainLinks}
        mgmtLinks={mgmtLinks}
        setupLabel={setupLabel}
      />
      {/* Sidebar (Desktop) */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-gradient-to-tr from-midnight via-midnight to-navy/30">
        
        {/* Top Header (Optional/Minimal) */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0 z-40">
           <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl bg-white/5 text-slate hover:text-white"
                aria-label="เปิดเมนู"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="font-bold text-lg tracking-tight">NEXWORTH</span>
           </div>
                      <div className="flex items-center gap-4 ml-auto">
               <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-xs font-bold text-white leading-none">
                     {user.firstName 
                       ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` 
                       : user.email}
                  </span>
                  <span className="text-[9px] text-slate uppercase tracking-tighter mt-1">{user.role || 'User'}</span>
               </div>
               <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-emerald/20 border border-emerald/40" />
               </div>
            </div>
        </header>

        {/* View Content (Scrollable only here) */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-20 lg:pb-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>

        {/* Mobile Nav (Fixed at bottom) */}
        <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
      </div>
    </div>
  );
}
