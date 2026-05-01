'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Link2, Copy, CheckCircle, AlertCircle, User, Loader2, Eye, EyeOff } from 'lucide-react';

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

  if (!user) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6 pb-20 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
        <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        My Profile
      </h1>
      
      {/* Alert Pop-up */}
      {alert && (
        <div className={`p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
          {alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{alert.message}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5 border border-gray-100 dark:border-gray-700/50">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b dark:border-gray-700 pb-2">Account Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">First Name</label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                  data-testid="profile-form-input-firstname"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[12px] font-bold focus:outline-none focus:border-blue-500 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Name</label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)}
                  data-testid="profile-form-input-lastname"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[12px] font-bold focus:outline-none focus:border-blue-500 bg-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                data-testid="profile-form-input-email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[12px] font-bold focus:outline-none focus:border-blue-500 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">New Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  data-testid="profile-form-input-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[12px] font-bold focus:outline-none focus:border-blue-500 bg-transparent pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="profile-password-toggle"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Role</label>
              <div className="text-[12px] font-bold text-gray-900 dark:text-white">{user.role}</div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Organization</label>
              <div className="text-[12px] font-bold text-gray-900 dark:text-white">{user.orgName || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end pt-5 border-t dark:border-gray-700/50">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            data-testid="profile-form-btn-save"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg text-[12px] font-bold transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold border-b pb-3 mb-6 dark:border-gray-700 flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#06C755] flex items-center justify-center text-white font-bold text-xl">L</div>
          LINE Integration
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Connect your LINE account to automatically record transactions by sending short messages or transfer slips directly to the Nexworth Bot.
        </p>

        {!pairingCode ? (
          <button 
            onClick={generateCode}
            disabled={isLoading}
            data-testid="profile-line-btn-generate-code"
            className="flex items-center gap-2 bg-[#06C755] hover:bg-[#05b34c] text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Link2 className="w-4 h-4" />
            {isLoading ? 'Generating...' : 'Generate LINE Pairing Code'}
          </button>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <p className="text-sm font-semibold mb-2">Your Pairing Code:</p>
            <div className="flex items-center gap-3 mb-4">
              <code 
                data-testid="profile-line-text-pairing-code"
                className="text-2xl font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-4 py-2 rounded border border-gray-200 dark:border-gray-700"
              >
                {pairingCode}
              </code>
              <button 
                onClick={copyToClipboard}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-white dark:bg-gray-800 border rounded transition-colors flex items-center gap-1"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p><strong>Step 1:</strong> Add the Nexworth Bot on LINE (Line ID: @nexworth_bot).</p>
              <p><strong>Step 2:</strong> Send the code above to the bot in the chat.</p>
              <p><strong>Step 3:</strong> Once connected, you can start sending slips or messages like &quot;ข้าว 50 บาท&quot; to record expenses.</p>
            </div>
            
            <button onClick={() => setPairingCode(null)} className="mt-4 text-xs text-blue-500 hover:underline">
              Generate a new code
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center pt-10">
        <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Version: 2.1.0-build-V4.0-FINAL</span>
        </div>
      </div>
    </div>
  );
}
