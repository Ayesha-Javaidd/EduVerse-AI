export type UserRole = 'student' | 'teacher' | 'admin' | 'super_admin';

export interface BaseSignupRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  contactNo?: string;
  country?: string;
  profileImageURL?: string;
}

/**
 * Used for Student / Teacher / Super Admin
 */
export interface UserSignupRequest extends BaseSignupRequest {}

/**
 * Used ONLY for Admin signup (tenant creation)
 */
export interface AdminSignupRequest extends BaseSignupRequest {
  tenantName: string;
  tenantLogoUrl?: string;
}
