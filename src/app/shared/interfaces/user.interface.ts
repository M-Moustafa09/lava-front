import { UserRole, StaffRole } from '../../domain/enums/user-role.enum';

/**
 * User & Staff Account Models / الواجهات الخاصة بالمستخدمين وفريق العمل
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  roleLabel: string;
  avatar?: string;
  phone?: string;
  lastLoginAt?: string;
}
