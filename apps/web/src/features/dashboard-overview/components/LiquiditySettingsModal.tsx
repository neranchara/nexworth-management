'use client';

import { useState } from 'react';
import GlassModal from '@/components/ui/GlassModal';
import { Save, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface LiquiditySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDanger: number;
  initialSafe: number;
  onSaveSuccess: () => void;
}

export default function LiquiditySettingsModal({
  isOpen,
  onClose,
  initialDanger,
  initialSafe,
  onSaveSuccess
}: LiquiditySettingsModalProps) {
  const [danger, setDanger] = useState(initialDanger);
  const [safe, setSafe] = useState(initialSafe);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuthStore();

  const handleSave = async () => {
    if (!user?.id) return;
    
    try {
      setIsSaving(true);
      await api.patch(`/users/${user.id}`, {
        liquidityDangerZone: danger,
        liquiditySafeZone: safe
      });
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save liquidity settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="ตั้งค่าเกณฑ์สุขภาพการเงิน (Cashflow)">
      <div className="flex flex-col gap-8 p-1">
        
        {/* Danger Zone Setting */}
        <div className="flex flex-col gap-4 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Danger Zone (Min)</h4>
              <p className="text-[10px] text-slate">หากกระแสเงินสดต่ำกว่าเกณฑ์นี้ ระบบจะแจ้งเตือนระดับอันตราย</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <input 
              type="range" 
              min="0" 
              max="200000" 
              step="5000"
              value={danger}
              onChange={(e) => setDanger(Number(e.target.value))}
              className="flex-1 accent-rose-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <div className="w-24 px-3 py-2 bg-navy/40 border border-white/10 rounded-xl text-center">
              <span className="text-xs font-black text-rose-400">฿{danger.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Safe Zone Setting */}
        <div className="flex flex-col gap-4 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Safe Zone (Max)</h4>
              <p className="text-[10px] text-slate">หากกระแสเงินสดสูงกว่าเกณฑ์นี้ ระบบจะแสดงสถานะปลอดภัยมาก</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <input 
              type="range" 
              min="0" 
              max="500000" 
              step="10000"
              value={safe}
              onChange={(e) => setSafe(Number(e.target.value))}
              className="flex-1 accent-emerald-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <div className="w-24 px-3 py-2 bg-navy/40 border border-white/10 rounded-xl text-center">
              <span className="text-xs font-black text-emerald-400">฿{safe.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate hover:text-white transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2.5 rounded-xl bg-emerald text-navy font-black text-xs flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
