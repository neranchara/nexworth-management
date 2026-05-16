'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { mergeSidebarLinks, pickLabel } from '@/utils/uiLabels';
import { MAIN_NAV_LINKS, MGMT_NAV_LINKS, SETUP_LINK, type NavLinkItem } from './navConfig';

export function useDashboardNav() {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const [mainLinks, setMainLinks] = useState<NavLinkItem[]>(MAIN_NAV_LINKS);
  const [mgmtLinks, setMgmtLinks] = useState<NavLinkItem[]>(MGMT_NAV_LINKS);
  const [setupLabel, setSetupLabel] = useState(SETUP_LINK.label);

  useEffect(() => {
    const fetchSidebarConfig = async () => {
      try {
        const res = await api.get('/configs', { params: { key: 'UI_LABELS_SIDEBAR' } });
        const config = res.data.data?.[0]?.value;
        if (config && Array.isArray(config) && config.length > 0) {
          setMainLinks(mergeSidebarLinks(MAIN_NAV_LINKS, config));
          setMgmtLinks(
            mergeSidebarLinks(MGMT_NAV_LINKS, config).filter(
              (l) => !l.adminOnly || user?.role === 'Admin'
            )
          );
          const setup = config.find((c: { href?: string }) => c?.href === SETUP_LINK.href);
          if (setup?.label) {
            setSetupLabel(pickLabel(setup.label, SETUP_LINK.label));
          }
        }
      } catch {
        // keep built-in Thai defaults
      }
    };
    fetchSidebarConfig();
  }, [user]);

  const visibleMain = useMemo(
    () =>
      mainLinks.filter((link) => {
        if (!link.resource) return true;
        if (user?.isSystemAdmin) return true;
        return hasPermission(link.resource);
      }),
    [mainLinks, hasPermission, user?.isSystemAdmin]
  );

  const visibleMgmt = useMemo(
    () =>
      mgmtLinks.filter((link) => {
        if (link.adminOnly && user?.role !== 'Admin' && !user?.isSystemAdmin) return false;
        if (!link.resource) return true;
        if (user?.isSystemAdmin) return true;
        return hasPermission(link.resource);
      }),
    [mgmtLinks, hasPermission, user?.isSystemAdmin, user?.role]
  );

  return { mainLinks: visibleMain, mgmtLinks: visibleMgmt, setupLabel };
}
