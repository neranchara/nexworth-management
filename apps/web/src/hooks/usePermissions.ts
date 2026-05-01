import { useAuthStore } from '@/store/authStore';
import { useCallback } from 'react';

export const usePermissions = () => {
  const { user } = useAuthStore();

  const hasPermission = useCallback((resource: string, action: 'canView' | 'canCreate' | 'canUpdate' | 'canDelete' = 'canView') => {
    if (!user || !user.permissions) return false;
    
    // System Admin has all permissions
    if (user.isSystemAdmin) return true;

    const perm = user.permissions.find(p => p.resource === resource);
    if (!perm) return false;
    
    return perm[action] === true;
  }, [user]);

  return { hasPermission };
};
