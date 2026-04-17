import { useAuthStore } from '@/store/authStore';
import { useCallback } from 'react';

export const usePermissions = () => {
  const { user } = useAuthStore();

  const hasPermission = useCallback((resource: string, action: 'canView' | 'canCreate' | 'canUpdate' | 'canDelete') => {
    if (!user || !user.permissions) return false;
    
    const perm = user.permissions.find(p => p.resource === resource);
    if (!perm) return false;
    
    return perm[action as keyof typeof perm] === true;
  }, [user]);

  return { hasPermission };
};
