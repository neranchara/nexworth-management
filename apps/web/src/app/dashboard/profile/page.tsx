'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Link2, Copy, CheckCircle, AlertCircle, User, Loader2, Eye, EyeOff, QrCode, Sparkles, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { clsx } from 'clsx';
import GlassCard from '@/components/ui/GlassCard';
import { APP_CONFIG } from '@/config/app.config';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sync state when user data is loaded
  useEffect(() => {
    if (user) {
      if (!firstName) setFirstName(user.firstName || '');
      if (!lastName) setLastName(user.lastName || '');
      if (!email) setEmail(user.email || '');
    }
  }, [user]);
  
  // LINE Integration State
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alert, setAlert] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const generateCode = async () => {
    try {
      setIsLoading(true);
      const res = await api.post('/auth/line-pairing-code');
      setPairingCode(res.data.code);
    } catch {
      setAlert({ message: 'Failed to generate pairing code', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload: any = { firstName, lastName, email };
      if (password) payload.password = password;
      
      await api.put(`/users/${user?.id}`, payload);
      
      // Update global store
      updateUser({ firstName, lastName, email });
      
      setAlert({ message: 'Profile updated successfully', type: 'success' });
      setPassword('');
    } catch (err: any) {
      setAlert({ message: err.response?.data?.error || 'Update failed', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-emerald animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <div className="relative overflow-hidden p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] group backdrop-blur-md">
        <div className="absolute -right-24 -top-24 w-80 h-80 bg-emerald/10 rounded-full blur-[100px] group-hover:bg-emerald/20 transition-colors duration-1000" />
        <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center text-emerald shadow-2xl relative z-10 group-hover:rotate-3 transition-transform duration-500">
                <User size={48} className="group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
                {firstName || 'User'} {lastName}
                <Sparkles className="w-6 h-6 text-emerald animate-pulse" />
              </h1>
              <p className="text-emerald font-black uppercase tracking-[0.4em] text-[10px] mt-2 opacity-80">Nexworth Cloud Identity</p>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald/20 border border-emerald/30 text-emerald text-[9px] font-black rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(80,200,120,0.2)]">
                  <ShieldCheck size={12} />
                  {user.role}
                </div>
                <div className="px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 text-[9px] font-black rounded-full uppercase tracking-widest backdrop-blur-sm">
                  {user.orgName || 'Nexworth Personal'}
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 py-4 bg-emerald text-navy rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_40px_rgba(80,200,120,0.5)] hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 overflow-hidden relative group/btn"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle size={16} className="relative z-10" />}
            <span className="relative z-10">{isSaving ? 'Processing...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
      
      {/* Alert Pop-up */}
      {alert && (
        <div className={clsx(
          "p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 border",
          alert.type === 'success' 
            ? "bg-emerald/10 text-emerald border-emerald/20" 
            : "bg-rose/10 text-rose border-rose/20"
        )}>
          {alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-xs font-black uppercase tracking-widest">{alert.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="space-y-8">
          <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald border border-emerald/20">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Identity Profile</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Primary Account Details</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">First Name</label>
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-700 shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-700 shadow-inner"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Connection</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-700 shadow-inner"
                />
              </div>
              
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Security Key Override</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ENTER NEW PASSWORD"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-600 shadow-inner pr-14 tracking-widest"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500 hover:text-emerald transition-colors focus:outline-none z-10 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="flex items-center gap-2 px-1">
                   <AlertCircle size={10} className="text-slate-600" />
                   <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Leave empty to keep current password</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: LINE Integration */}
        <div className="space-y-8">
          <div className="p-8 rounded-[2rem] bg-[#06C755]/[0.03] border border-[#06C755]/20 shadow-xl relative overflow-hidden group backdrop-blur-sm">
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#06C755]/10 rounded-full blur-[60px] group-hover:bg-[#06C755]/20 transition-colors duration-500" />
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#06C755]/20 flex items-center justify-center text-[#06C755] border border-[#06C755]/30 shadow-[0_0_20px_rgba(6,199,85,0.1)]">
                  <Link2 size={24} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">LINE Integration</h2>
                  <p className="text-[9px] text-[#06C755] font-black uppercase tracking-widest mt-1">Smart Automation Hub</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#06C755] flex items-center justify-center text-navy font-black text-xl shadow-[0_10px_20px_rgba(6,199,85,0.3)]">L</div>
            </div>
            
            <p className="text-xs font-bold text-slate-300 leading-relaxed mb-10 relative z-10">
              ยกระดับการจัดการเงินของคุณด้วยระบบ LINE Sync ที่รองรับการบันทึกรายการผ่านแชทและสแกนสลิปอัตโนมัติ
            </p>

            {!pairingCode ? (
              <button 
                onClick={generateCode}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-4 bg-[#06C755] text-navy px-8 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_30px_rgba(6,199,85,0.4)] hover:-translate-y-1 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode size={20} />}
                {isLoading ? 'Activating Hub...' : 'Generate New Pairing Link'}
              </button>
            ) : (
              <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500 relative z-10">
                <div className="flex flex-col items-center bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-inner backdrop-blur-md">
                  {/* QR Code Section */}
                  <div className="relative group/qr mb-8">
                    <div className="absolute inset-0 bg-white blur-2xl opacity-10 group-hover/qr:opacity-20 transition-opacity" />
                    <div className="bg-white p-5 rounded-[2rem] shadow-2xl relative z-10">
                      <QRCodeSVG 
                        value={`https://line.me/R/oaMessage/${process.env.NEXT_PUBLIC_LINE_BOT_ID || '@072ywdwj'}/?${pairingCode}`}
                        size={160}
                        level="H"
                        includeMargin={false}
                        imageSettings={{
                          src: "https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg",
                          x: undefined,
                          y: undefined,
                          height: 32,
                          width: 32,
                          excavate: true,
                        }}
                      />
                    </div>
                  </div>

                  <div className="w-full space-y-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">One-Time Security Token</p>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 text-3xl font-black text-emerald bg-navy/60 px-8 py-5 rounded-2xl border border-white/10 shadow-inner tracking-[0.2em] text-center font-mono">
                        {pairingCode}
                      </code>
                      <button 
                        onClick={copyToClipboard}
                        className="p-5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-95 shadow-xl"
                      >
                        {copied ? <CheckCircle size={24} className="text-emerald" /> : <Copy size={24} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { step: 1, text: `เพิ่มเพื่อน LINE ID: @072ywdwj` },
                    { step: 2, text: `ส่งรหัส Pairing ด้านบนเข้าห้องแชท` },
                    { step: 3, text: `เริ่มส่งสลิปเพื่อบันทึกรายการได้ทันที` }
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-5 p-4 bg-white/[0.03] border border-white/5 rounded-2xl group/step hover:bg-white/[0.05] transition-colors">
                      <div className="w-8 h-8 rounded-full bg-emerald/10 text-emerald flex items-center justify-center text-[11px] font-black shrink-0 border border-emerald/20 group-hover/step:scale-110 transition-transform">0{item.step}</div>
                      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-tight">{item.text}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center pt-6 border-t border-white/10">
                  <button onClick={() => setPairingCode(null)} className="text-[10px] font-black text-emerald uppercase tracking-[0.2em] hover:text-white transition-colors">
                    Reset Pairing
                  </button>
                  <div className="flex items-center gap-2 text-[10px] font-black text-rose uppercase tracking-widest bg-rose/10 px-4 py-2 rounded-full border border-rose/20 animate-pulse">
                    <AlertCircle size={14} />
                    Active Access
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Version */}
      <div className="flex flex-col items-center gap-4 pt-10">
        <div className="px-6 py-2 bg-navy/80 backdrop-blur-md rounded-full border border-white/5 shadow-2xl">
           <span className="text-[10px] font-black text-slate uppercase tracking-[0.4em] opacity-40">
             {APP_CONFIG.FULL_VERSION_STRING}
           </span>
        </div>
      </div>
    </div>
  );
}

