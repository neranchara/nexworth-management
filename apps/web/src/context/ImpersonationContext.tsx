import React, { createContext, useContext, useState, useEffect } from 'react';

interface ImpersonationData {
  id: string;
  name: string;
  email: string;
}

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonationData: ImpersonationData | null;
  startViewAs: (userData: ImpersonationData, token: string) => void;
  stopViewAs: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const useImpersonation = () => {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
};

export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationData, setImpersonationData] = useState<ImpersonationData | null>(null);

  useEffect(() => {
    // Check session storage on mount (consistent with short-lived tokens)
    const storedStatus = sessionStorage.getItem('is_impersonated');
    const storedUser = sessionStorage.getItem('impersonated_user');
    
    if (storedStatus === 'true' && storedUser) {
      setIsImpersonating(true);
      setImpersonationData(JSON.parse(storedUser));
    }
  }, []);

  const startViewAs = (userData: ImpersonationData, token: string) => {
    sessionStorage.setItem('is_impersonated', 'true');
    sessionStorage.setItem('impersonated_user', JSON.stringify(userData));
    sessionStorage.setItem('token', token); // Temporary override token
    
    setIsImpersonating(true);
    setImpersonationData(userData);
    
    // Force reload to ensure axios interceptor catches the new state
    window.location.reload();
  };

  const stopViewAs = () => {
    // Clear temporary session data
    sessionStorage.removeItem('is_impersonated');
    sessionStorage.removeItem('impersonated_user');
    sessionStorage.removeItem('token');
    
    setIsImpersonating(false);
    setImpersonationData(null);
    
    // Redirect back to Admin Dashboard
    window.location.href = '/admin/dashboard';
  };

  return (
    <ImpersonationContext.Provider value={{ isImpersonating, impersonationData, startViewAs, stopViewAs }}>
      {children}
    </ImpersonationContext.Provider>
  );
};
