export type AccountType = 
  | 'BANK' 
  | 'STOCK' 
  | 'GOLD' 
  | 'CASHFLOW' 
  | 'INTERNAL' 
  | 'EMERGENCY' 
  | 'GOAL' 
  | 'INVESTMENT' 
  | 'SAVING' 
  | 'FAMILY' 
  | 'LIABILITY';

export interface Bank {
  id: string;
  code: string;
  name: string;
  color?: string;
  organizationId?: string | null;
}

export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roleId?: string | null;
  organizationId?: string | null;
  isActive: boolean;
  role?: { id: string; name: string };
  organization?: { id: string; name: string };
  isSystemAdmin?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
}

export interface FinancialRecord {
  id: string;
  amount: number;
  date: string;
  note?: string | null;
  accountId: string;
  type: 'ASSET' | 'LIABILITY';
  account?: Account;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  accountNumber: string;
  bankId?: string | null;
  userId: string;
  isActive: boolean;
  isPersonal: boolean;
  bank?: Bank | null;
  user?: User;
  balance?: number;
}

export interface TransactionType {
  id: string;
  name: string;
  behavior: string;
  isActive: boolean;
}

export interface TransactionCategory {
  id: string;
  name: string;
  typeId: string;
  isActive: boolean;
  type?: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  description?: string | null;
  date: string;
  note?: string | null;
  accountId: string;
  categoryId: string;
  typeId: string;
  userId: string;
  actualDate?: string | null;
  account?: Account;
  category?: TransactionCategory;
  type?: TransactionType;
  linkedTransactionId?: string | null;
  direction?: string | null;
  asset?: FinancialRecord;
  liability?: FinancialRecord;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  color: string;
  deadline?: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
  allocations?: GoalAllocation[];
}

export interface GoalAllocation {
  id: string;
  goalId: string;
  assetId: string;
  allocatedAmount: number;
  lastUpdated: string;
  asset?: FinancialRecord;
  goal?: Goal;
}
