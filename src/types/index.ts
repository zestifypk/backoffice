export interface User {
  id: number;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  joined: string;
  roles?: string[];
  permissions?: string[];
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
}

export interface Permission {
  id: number;
  name: string;
  description: string | null;
}

export interface JwtPayload {
  sub: number;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface ApiError extends Error {
  statusCode?: number;
}

export interface StatsData {
  totalUsers: number;
  revenue: number;
  orders: number;
  activeSessions: number;
  changes: {
    totalUsers: number;
    revenue: number;
    orders: number;
    activeSessions: number;
  };
}

export interface ActivityItem {
  id: number;
  type: 'user' | 'order' | 'alert' | 'payment';
  message: string;
  time: string;
}
