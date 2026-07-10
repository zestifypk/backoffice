export type UserStatus = 'Active' | 'Inactive';

export interface User {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  joined: string;
  deletedAt?: string | null;
  roles?: string[];
  permissions?: string[];
  /** Permissions granted directly to the user, bypassing roles (subset of `permissions`). */
  directPermissions?: string[];
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

export type OrderType   = 'Normal' | 'Reversed' | 'Replacement' | 'Overland';
export type OrderStatus = 'pending' | 'booked' | 'in_transit' | 'delivered' | 'returned' | 'cancelled';

export interface Order {
  id: number;
  reference_number: string;
  order_amount: number;
  order_detail: string | null;
  customer_name: string;
  customer_phone: string;
  order_address: string;
  city: string;
  items: number;
  airway_bill_copies: number;
  notes: string | null;
  address_code: string | null;
  return_address_code: string | null;
  order_type: OrderType;
  booking_weight: number | null;
  tracking_number: string | null;
  status: OrderStatus;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

