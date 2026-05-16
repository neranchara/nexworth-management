import {
  LayoutDashboard,
  Wallet,
  Receipt,
  CreditCard,
  HandCoins,
  Target,
  Building2,
  Layers,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type NavLinkItem = {
  href: string;
  label: string;
  title: string;
  icon: LucideIcon;
  resource?: string;
  adminOnly?: boolean;
};

export const MAIN_NAV_LINKS: NavLinkItem[] = [
  { href: '/dashboard', label: 'ภาพรวม (Dashboard)', title: 'ภาพรวม', icon: LayoutDashboard, resource: 'dashboard' },
  { href: '/dashboard/assets', label: 'สินทรัพย์ (Assets)', title: 'สินทรัพย์', icon: Wallet, resource: 'assets' },
  { href: '/dashboard/transactions', label: 'ธุรกรรม (Trans)', title: 'ธุรกรรม', icon: Receipt, resource: 'transactions' },
  { href: '/dashboard/liabilities', label: 'หนี้สิน (Loans)', title: 'หนี้สิน', icon: CreditCard, resource: 'liabilities' },
  { href: '/dashboard/loan-tracker', label: 'เงินกู้ (Tracking)', title: 'เงินกู้', icon: HandCoins, resource: 'loan-tracker' },
  { href: '/dashboard/goals', label: 'เป้าหมาย (Goals)', title: 'เป้าหมาย', icon: Target, resource: 'goals' },
];

export const MGMT_NAV_LINKS: NavLinkItem[] = [
  { href: '/dashboard/accounts', label: 'จัดการบัญชี (Accounts)', title: 'จัดการบัญชี', icon: Building2, resource: 'accounts' },
  { href: '/dashboard/types', label: 'ประเภท (Types)', title: 'ประเภท', icon: Layers, resource: 'types', adminOnly: true },
];

export const SETUP_LINK = {
  href: '/dashboard/setup',
  label: 'ตั้งค่า',
  title: 'Setup',
  icon: Settings,
};

export const HREF_ICONS: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/dashboard/assets': Wallet,
  '/dashboard/transactions': Receipt,
  '/dashboard/liabilities': CreditCard,
  '/dashboard/loan-tracker': HandCoins,
  '/dashboard/goals': Target,
  '/dashboard/accounts': Building2,
  '/dashboard/types': Layers,
};
