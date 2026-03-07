/**
 * Student Profile Response (StudentResponse)
 */
export interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  profileImageURL?: string | null;
  contactNo?: string | null;
  country?: string | null;
  status?: string;
  role: string;
  tenantId: string;
  enrolledCourses: string[];
  completedCourses: string[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string | null;
}

/**
 * Payload for PATCH /students/me
 */
export interface StudentUpdatePayload {
  fullName?: string;
  email?: string;
  profileImageURL?: string | null;
  contactNo?: string | null;
  country?: string | null;
  status?: string;
}

/**
 * Payload for PUT /students/me/password
 */
export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}
