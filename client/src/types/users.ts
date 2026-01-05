import { UserRole } from "./auth";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface UpdateRoleData {
  userId: number;
  role: UserRole;
}