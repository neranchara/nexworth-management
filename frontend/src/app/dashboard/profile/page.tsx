'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Link2, Copy, CheckCircle, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();
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

  if (!user) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
      
      {/* Alert Pop-up */}
      {alert && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${alert.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{alert.message}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold border-b pb-3 mb-4 dark:border-gray-700">Account Details</h2>
        <div className="space-y-3">
          <p><span className="text-gray-500 w-24 inline-block">Email:</span> {user.email}</p>
          <p><span className="text-gray-500 w-24 inline-block">Role:</span> {user.role}</p>
          <p><span className="text-gray-500 w-24 inline-block">Organization:</span> {user.orgName || 'N/A'}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold border-b pb-3 mb-4 dark:border-gray-700 flex items-center gap-2">
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
            className="flex items-center gap-2 bg-[#06C755] hover:bg-[#05b34c] text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Link2 className="w-4 h-4" />
            {isLoading ? 'Generating...' : 'Generate LINE Pairing Code'}
          </button>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <p className="text-sm font-semibold mb-2">Your Pairing Code:</p>
            <div className="flex items-center gap-3 mb-4">
              <code className="text-2xl font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-4 py-2 rounded border border-gray-200 dark:border-gray-700">
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
    </div>
  );
}
