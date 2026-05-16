'use client';

import React, { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Zap, Clock, AlertTriangle, Cpu, Globe, Server } from 'lucide-react';

interface PerformanceData {
  apiLatency: Array<{ path: string, avgLatency: number, count: number }>;
  aiLatency: Array<{ model: string, avgLatency: number, count: number }>;
  errorRates: number;
  totalRequests: number;
}

export const PerformanceAnalytics = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/performance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
          setData(null);
          return;
        }

        const json = await res.json();
        setData(json.data);
      } catch (error: any) {
        if (error.response?.status !== 401) {
          console.error('Failed to fetch performance data:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // Auto refresh every 15s
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-ops-primary/20 border-t-ops-primary rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aggregating System Logs...</span>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-10">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
        <StatCard 
          icon={<Zap className="text-ops-primary" />} 
          label="Total Requests (1h)" 
          value={data?.totalRequests || 0} 
          sub="Recent Activity"
        />
        <StatCard 
          icon={<Clock className="text-emerald-500" />} 
          label="Avg AI Latency" 
          value={`${data?.aiLatency[0]?.avgLatency || 0}ms`} 
          sub={data?.aiLatency[0]?.model || 'Gemini'}
        />
        <StatCard 
          icon={<AlertTriangle className={data?.errorRates && data.errorRates > 5 ? "text-rose-500" : "text-amber-500"} />} 
          label="Error Rate" 
          value={`${data?.errorRates || 0}%`} 
          sub="HTTP 4xx/5xx"
        />
        <StatCard 
          icon={<Cpu className="text-indigo-400" />} 
          label="Top API Endpoint" 
          value={data?.apiLatency[0]?.path || 'N/A'} 
          sub={`${data?.apiLatency[0]?.avgLatency || 0}ms avg`}
          smallValue
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        {/* API Latency Chart */}
        <GlassCard className="p-6 flex flex-col bg-ops-sidebar/30">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-ops-primary/10 rounded-lg text-ops-primary">
                   <Globe size={18} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">API Endpoint Latency</h3>
             </div>
             <span className="text-[10px] font-bold text-slate-500">MILLISECONDS</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.apiLatency} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="path" 
                  type="category" 
                  width={150} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="avgLatency" radius={[0, 4, 4, 0]} barSize={20}>
                  {data?.apiLatency.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgLatency > 500 ? '#ef4444' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* AI Performance Chart */}
        <GlassCard className="p-6 flex flex-col bg-ops-sidebar/30">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                   <Server size={18} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Model Performance</h3>
             </div>
             <span className="text-[10px] font-bold text-slate-500">LATENCY TREND</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.aiLatency}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="model" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="avgLatency" radius={[4, 4, 0, 0]} barSize={40} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, smallValue = false }: any) => (
  <GlassCard className="p-5 bg-ops-sidebar/50 border-white/5 hover:border-white/10 transition-colors">
    <div className="flex items-center justify-between mb-4">
       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          {icon}
       </div>
       <div className="h-1.5 w-1.5 rounded-full bg-ops-primary animate-pulse" />
    </div>
    <div>
       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
       <h4 className={`${smallValue ? 'text-xs' : 'text-2xl'} font-black text-white truncate`}>{value}</h4>
       <p className="text-[9px] font-bold text-ops-primary uppercase tracking-tighter mt-1">{sub}</p>
    </div>
  </GlassCard>
);
