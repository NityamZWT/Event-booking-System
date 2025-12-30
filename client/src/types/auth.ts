export enum UserRole {
  ADMIN = "ADMIN",
  EVENT_MANAGER = "EVENT_MANAGER",
  CUSTOMER = "CUSTOMER",
}

// export interface ApiErrorResponse {
//   success: false;
//   type: string;
//   message: string;
//   errors?: Record<string, string>;
// }

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole | string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: UserRole | string;
}

import type { User } from './users';
