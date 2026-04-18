export interface JwtPayload {
  user_id: string; // user id
  email?: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  tenant_id?: string;
  student_id?: string;
  teacher_id?: string;
  admin_id?: string;
  full_name?: string;
  profileImageURL?: string;
  profile_image_url?: string;
  exp: number;
  iat: number;
}

export interface User {
  id: string;
  email?: string;
  fullName?: string;
  profileImageURL?: string;
  role: JwtPayload['role'];
  tenantId?: string;
  studentId?: string;
  teacherId?: string;
  adminId?: string;
}
