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
  labelKey: string;
  title: string;
  icon: LucideIcon;
  resource?: string;
  adminOnly?: boolean;
  testId?: string;
};

export const MAIN_NAV_LINKS: NavLinkItem[] = [
  { href: '/dashboard', label: 'ภาพรวม (Dashboard)', labelKey: 'dashboard', title: 'ภาพรวม', icon: LayoutDashboard, resource: 'dashboard', testId: 'layout-nav-link-dashboard' },
  { href: '/dashboard/assets', label: 'สินทรัพย์ (Assets)', labelKey: 'assets', title: 'สินทรัพย์', icon: Wallet, resource: 'assets', testId: 'layout-nav-link-assets' },
  { href: '/dashboard/transactions', label: 'ธุรกรรม (Trans)', labelKey: 'transactions', title: 'ธุรกรรม', icon: Receipt, resource: 'transactions', testId: 'layout-nav-link-transactions' },
  { href: '/dashboard/liabilities', label: 'หนี้สิน (Loans)', labelKey: 'liabilities', title: 'หนี้สิน', icon: CreditCard, resource: 'liabilities', testId: 'layout-nav-link-liabilities' },
  { href: '/dashboard/loan-tracker', label: 'เงินกู้ (Tracking)', labelKey: 'loanTracker', title: 'เงินกู้', icon: HandCoins, resource: 'loan-tracker', testId: 'layout-nav-link-loan-tracker' },
  { href: '/dashboard/goals', label: 'เป้าหมาย (Goals)', labelKey: 'goals', title: 'เป้าหมาย', icon: Target, resource: 'goals', testId: 'layout-nav-link-goals' },
];

export const MGMT_NAV_LINKS: NavLinkItem[] = [
  { href: '/dashboard/accounts', label: 'จัดการบัญชี (Accounts)', labelKey: 'accounts', title: 'จัดการบัญชี', icon: Building2, resource: 'accounts', testId: 'layout-nav-link-setup-accounts' },
  { href: '/dashboard/types', label: 'ประเภท (Types)', labelKey: 'types', title: 'ประเภท', icon: Layers, resource: 'types', adminOnly: true, testId: 'layout-nav-link-setup-types' },
  { href: '/dashboard/banks', label: 'ธนาคาร (Banks)', labelKey: 'banks', title: 'ธนาคาร', icon: Building2, resource: 'banks', adminOnly: true, testId: 'layout-nav-link-setup-banks' },
  { href: '/dashboard/categories', label: 'หมวดหมู่ (Categories)', labelKey: 'categories', title: 'หมวดหมู่', icon: Layers, resource: 'categories', adminOnly: true, testId: 'layout-nav-link-setup-categories' },
  { href: '/dashboard/users', label: 'ผู้ใช้งาน (Users)', labelKey: 'users', title: 'ผู้ใช้งาน', icon: Settings, resource: 'users', adminOnly: true, testId: 'layout-nav-link-setup-users' },
  { href: '/dashboard/permissions', label: 'สิทธิ์การใช้งาน (Permissions)', labelKey: 'permissions', title: 'สิทธิ์การใช้งาน', icon: Settings, resource: 'permissions', adminOnly: true, testId: 'layout-nav-link-setup-permissions' },
];

export const SETUP_LINK = {
  href: '/dashboard/setup',
  label: 'ตั้งค่า',
  labelKey: 'setup',
  title: 'Setup',
  icon: Settings,
  testId: 'layout-nav-link-setup',
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
  '/dashboard/banks': Building2,
  '/dashboard/categories': Layers,
  '/dashboard/users': Settings,
  '/dashboard/permissions': Settings,
};
