'use client';

import { useState } from 'react';
import { User, Shield, Bell, CreditCard, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import ProfilePage from '../profile/page';
import UserSecurityPage from '../security/page';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'billing';

export default function AccountSetupPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs = [
    { id: 'profile', label: 'โปรไฟล์ & LINE', icon: User },
    { id: 'security', label: 'ความปลอดภัย', icon: Shield },
    // { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
    // { id: 'billing', label: 'การสมัครสมาชิก', icon: CreditCard },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">ตั้งค่าบัญชี</h1>
        <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Account Settings & Global Preferences</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        {/* Navigation Sidebar (Local) */}
        <aside className="w-full lg:w-64 shrink-0 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={clsx(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                  isActive 
                    ? "bg-emerald text-navy shadow-lg shadow-emerald/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </div>
                {isActive && <ChevronRight size={14} />}
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 overflow-y-auto custom-scrollbar shadow-2xl">
          {activeTab === 'profile' && <ProfilePage />}
          {activeTab === 'security' && <UserSecurityPage />}
          {(activeTab === 'notifications' || activeTab === 'billing') && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50 grayscale">
              <div className="w-20 h-20 bg-white/5 rounded-full mb-4 flex items-center justify-center">
                {activeTab === 'notifications' ? <Bell size={32} className="text-slate-500" /> : <CreditCard size={32} className="text-slate-500" />}
              </div>
              <h3 className="text-xl font-bold text-white">Coming Soon</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-xs">ส่วนนี้กำลังอยู่ในระหว่างการพัฒนาและจะพร้อมใช้งานในเวอร์ชันถัดไป</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
