'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Database, Cpu, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

export const HealthCard = ({ fullMode = false }: { fullMode?: boolean }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await api.get('/admin/system-health');
      setData(res.data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Health check failed:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-ops-primary/20 border-t-ops-primary rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Scanning Systems...</span>
        </div>
      </div>
    );
  }

  const statusColor = data?.status === 'red' ? 'text-rose-500' : data?.status === 'yellow' ? 'text-amber-500' : 'text-ops-primary';
  const statusBg = data?.status === 'red' ? 'bg-rose-500/10' : data?.status === 'yellow' ? 'bg-amber-500/10' : 'bg-ops-primary/10';

  return (
    <div className={`bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl ${fullMode ? 'h-full' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${statusBg} rounded-lg`}>
            <Activity className={`w-5 h-5 ${statusColor}`} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-widest">System Health Monitor</h2>
            <p className="text-[10px] text-slate font-black uppercase tracking-[0.2em] opacity-40">Real-time Status Suite</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
          data?.status === 'red' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
          data?.status === 'yellow' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
          'bg-ops-primary/20 text-ops-primary border-ops-primary/30'
        }`}>
          {data?.status === 'red' ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
          System {data?.status === 'red' ? 'Critical' : data?.status === 'yellow' ? 'Warning' : 'Operational'}
        </div>
      </div>

      <div className={`grid ${fullMode ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'} gap-4`}>
        <MetricItem 
          icon={<Database size={16} />} 
          label="DB Latency" 
          value={`${data?.metrics.db_latency}ms`} 
          status={data?.metrics.db_latency > 100 ? 'warning' : 'success'}
        />
        <MetricItem 
          icon={<Cpu size={16} />} 
          label="AI Latency" 
          value={`${data?.metrics.ai_latency}ms`} 
          status={data?.metrics.ai_latency > 5000 ? 'danger' : data?.metrics.ai_latency > 2000 ? 'warning' : 'success'}
        />
        <MetricItem 
          icon={<Globe size={16} />} 
          label="API Response" 
          value={`${data?.metrics.api_response_time}ms`} 
          status={data?.metrics.api_response_time > 5000 ? 'danger' : 'success'}
        />
        <MetricItem 
          icon={<Activity size={16} />} 
          label="Memory Usage" 
          value={`${data?.metrics.memory_usage} MB`} 
          status={data?.metrics.memory_usage > 512 ? 'warning' : 'success'}
        />
      </div>

       {fullMode && (
        <div className="flex-1 mt-4 p-6 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-4">
          <h3 className="text-xs font-black text-slate uppercase tracking-[0.2em] opacity-40">Live Resource Telemetry</h3>
          <div className="flex-1 border-b border-dashed border-white/5 relative">
             {/* Mocking a waveform/graph visualization */}
             <div className="absolute inset-0 flex items-end gap-1 px-2 pb-2">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-ops-primary/10 rounded-t-sm animate-pulse border-x border-t border-ops-primary/20" 
                    style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.05}s` }}
                  />
                ))}
             </div>
          </div>
          <div className="flex justify-between text-[10px] text-slate font-mono opacity-40">
            <span>T-60s</span>
            <span>Real-time Stream (Fastify Engine)</span>
            <span>Now</span>
          </div>
        </div>
      )}
    </div>
  );
};

function MetricItem({ icon, label, value, status }: { icon: React.ReactNode, label: string, value: string, status: 'success' | 'warning' | 'danger' }) {
  const colorClass = status === 'success' ? 'text-ops-primary' : status === 'warning' ? 'text-amber-400' : 'text-rose-400';
  return (
    <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-2 shadow-lg">
      <div className="flex items-center justify-between text-slate opacity-40">
        {icon}
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'success' ? 'bg-ops-primary shadow-[0_0_8px_rgba(80,200,120,0.4)]' : status === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'}`} />
      </div>
      <p className="text-[10px] font-black text-slate uppercase tracking-widest opacity-40">{label}</p>
      <p className={`text-lg font-black font-mono ${colorClass}`}>{value}</p>
    </div>
  );
}
