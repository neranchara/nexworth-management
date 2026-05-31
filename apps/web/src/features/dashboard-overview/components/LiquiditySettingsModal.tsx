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
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-4 py-3 bg-navy/60 border border-rose-500/20 rounded-xl focus-within:border-rose-500/50 transition-colors">
              <span className="text-rose-400 font-bold text-sm">฿</span>
              <input
                type="number"
                value={danger || ''}
                onChange={(e) => setDanger(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0"
                className="flex-1 bg-transparent text-white font-bold text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {danger > 0 && (
              <p className="text-[10px] text-rose-400/70 pl-1">= ฿{danger.toLocaleString('th-TH')}</p>
            )}
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
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-4 py-3 bg-navy/60 border border-emerald-500/20 rounded-xl focus-within:border-emerald-500/50 transition-colors">
              <span className="text-emerald-400 font-bold text-sm">฿</span>
              <input
                type="number"
                value={safe || ''}
                onChange={(e) => setSafe(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0"
                className="flex-1 bg-transparent text-white font-bold text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {safe > 0 && (
              <p className="text-[10px] text-emerald-400/70 pl-1">= ฿{safe.toLocaleString('th-TH')}</p>
            )}
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
