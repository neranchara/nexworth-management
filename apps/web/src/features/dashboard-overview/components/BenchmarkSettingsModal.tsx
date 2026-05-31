'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Target, Loader2 } from 'lucide-react';
import api from '@/lib/api';

const GlassModal = dynamic(() => import('@/components/ui/GlassModal'), { ssr: false });

interface Benchmarks {
  savingRateTarget: number;
  investmentRateTarget: number;
  debtRatioTarget: number;
  emergencyMonthsTarget: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialBenchmarks: Benchmarks;
  onSaveSuccess: () => void;
}

export default function BenchmarkSettingsModal({ isOpen, onClose, initialBenchmarks, onSaveSuccess }: Props) {
  const [values, setValues] = useState<Benchmarks>({
    savingRateTarget:     initialBenchmarks.savingRateTarget * 100,
    investmentRateTarget: initialBenchmarks.investmentRateTarget * 100,
    debtRatioTarget:      initialBenchmarks.debtRatioTarget * 100,
    emergencyMonthsTarget: initialBenchmarks.emergencyMonthsTarget,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/settings/benchmarks', {
        savingRateTarget:     values.savingRateTarget / 100,
        investmentRateTarget: values.investmentRateTarget / 100,
        debtRatioTarget:      values.debtRatioTarget / 100,
        emergencyMonthsTarget: values.emergencyMonthsTarget,
      });
      onSaveSuccess();
      onClose();
    } catch {
      alert('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsSaving(false);
    }
  };

  const Field = ({ label, desc, field, unit, min, max, step }: {
    label: string; desc: string; field: keyof Benchmarks;
    unit: string; min: number; max: number; step: number;
  }) => (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black text-white uppercase tracking-widest">{label}</p>
          <p className="text-[9px] text-slate font-medium">{desc}</p>
        </div>
        <span className="text-lg font-black text-emerald">{values[field]}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={values[field]}
        onChange={e => setValues(v => ({ ...v, [field]: parseFloat(e.target.value) }))}
        className="w-full accent-emerald"
      />
      <div className="flex justify-between text-[8px] text-slate font-bold">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="ตั้งค่า KPI Targets">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 bg-emerald/10 border border-emerald/20 rounded-xl px-4 py-3">
          <Target size={14} className="text-emerald shrink-0" />
          <p className="text-[10px] text-emerald font-bold">ปรับเป้าหมายให้เหมาะกับสถานะการเงินของคุณ</p>
        </div>

        <Field label="Saving Rate" desc="เป้าหมายอัตราการออม" field="savingRateTarget" unit="%" min={5} max={50} step={1} />
        <Field label="Investment Rate" desc="เป้าหมายอัตราการลงทุน" field="investmentRateTarget" unit="%" min={5} max={50} step={1} />
        <Field label="Debt Ratio" desc="สัดส่วนหนี้สินสูงสุด" field="debtRatioTarget" unit="%" min={10} max={70} step={5} />
        <Field label="Emergency Fund" desc="จำนวนเดือนสำรองฉุกเฉิน" field="emergencyMonthsTarget" unit=" เดือน" min={1} max={24} step={1} />

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-emerald text-navy font-black text-xs uppercase tracking-widest py-4 rounded-xl hover:shadow-lg hover:shadow-emerald/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'บันทึกเป้าหมาย'}
        </button>
      </div>
    </GlassModal>
  );
}
