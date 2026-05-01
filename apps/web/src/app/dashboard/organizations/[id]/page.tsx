'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  Building2, Users, ShieldCheck, ArrowLeft, 
  ChevronRight, Loader2, LayoutDashboard, Settings
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  isActive: boolean;
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrg();
  }, [orgId]);

  const fetchOrg = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organizations');
      const found = res.data.find((o: any) => o.id === orgId);
      setOrg(found);
    } catch (err) {
      console.error('Failed to fetch org', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Organization not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 font-bold">Go Back</button>
      </div>
    );
  }

  const menus = [
    {
      title: 'User Directory',
      description: 'Manage users, access status, and profile details for this organization.',
      icon: <Users className="w-6 h-6 text-blue-500" />,
      link: `/dashboard/users?orgId=${org.id}`,
      color: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Roles & Permissions',
      description: 'Define roles and control access levels for specific resources.',
      icon: <ShieldCheck className="w-6 h-6 text-orange-500" />,
      link: `/dashboard/permissions?orgId=${org.id}`,
      color: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'Org Settings',
      description: 'Update organization name and general configuration.',
      icon: <Settings className="w-6 h-6 text-gray-500" />,
      link: '#',
      color: 'bg-gray-50 dark:bg-gray-800',
      disabled: true
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 animate-in fade-in duration-500">
      {/* Breadcrumb / Back */}
      <button 
        onClick={() => router.push('/dashboard/organizations')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-8 group text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Organizations
      </button>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4 border-b dark:border-gray-800 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{org.name}</h1>
              {!org.isActive && (
                <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-md border border-red-100">Disabled</span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center gap-2">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Organization Management Hub
            </p>
          </div>
        </div>
      </div>

      {/* Menus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menus.map((menu, index) => (
          <button
            key={index}
            onClick={() => !menu.disabled && router.push(menu.link)}
            className={`flex items-start text-left p-6 rounded-2xl border transition-all group relative overflow-hidden ${
              menu.disabled 
                ? 'bg-gray-50/50 dark:bg-gray-900/20 border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed' 
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1'
            }`}
          >
            <div className={`w-12 h-12 ${menu.color} rounded-xl flex items-center justify-center mr-5 shrink-0 transition-transform group-hover:scale-110`}>
              {menu.icon}
            </div>
            <div className="flex-1 pr-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{menu.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                {menu.description}
              </p>
            </div>
            {!menu.disabled && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1">
                <ChevronRight className="w-6 h-6" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
