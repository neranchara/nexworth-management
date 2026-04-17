export interface Permission {
  resource: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  permissions: Permission[];
  orgName?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface MeResponse {
  user: {
    sub: string;
    email: string;
    role: string;
    permissions: Permission[];
    orgName?: string;
  };
}
