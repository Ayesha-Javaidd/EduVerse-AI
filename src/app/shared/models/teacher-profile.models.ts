/**
 * Matches FastAPI TeacherResponse
 */
export interface TeacherResponse {
  id: string;
  fullName: string;
  email: string;

  profileImageURL: string;
  assignedCourses: string[];

  contactNo?: string;
  country?: string;
  status: string;
  role: string;

  qualifications: string[];
  subjects: string[];

  tenantId: string;

  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

/**
 * Matches FastAPI TeacherUpdate
 * Used in PATCH /teachers/me
 */
export interface TeacherUpdatePayload {
  fullName?: string;
  email?: string;
  profileImageURL?: string | null;
  assignedCourses?: string[];
  contactNo?: string;
  country?: string;
  status?: string;
  qualifications?: string[];
  subjects?: string[];
}

/**
 * Matches FastAPI ChangePassword
 * Used in PUT /teachers/me/password
 */
export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}
