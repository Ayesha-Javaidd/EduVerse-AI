
export interface AdminProfile {
  id: string;                 // Admin MongoDB _id
  fullName: string;
  email: string;
  country?: string;
  contactNo?: string;
  profileImageURL?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}


export interface AdminUpdateProfilePayload {
  fullName?: string;
  country?: string;
  contactNo?: string;
  profileImageURL?: string;
}


export interface AdminChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}
