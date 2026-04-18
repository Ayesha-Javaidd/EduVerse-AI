import { environment } from '../../../environments/environment';

export const APP_BRANDING = {
  NAME: environment.appName,
  SUPPORT_EMAIL: environment.supportEmail,
} as const;

export const APP_LIMITS = {
  MAX_SUBSCRIPTION_PLANS: environment.maxSubscriptionPlans,
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'eduverse_access_token',
  TENANT_ID: 'tenantId',
  USER_ID: 'eduverse_user_id',
  STUDENT_ID: 'eduverse_student_id',
  USER_INFO: 'eduverse_user_info',
  tenantBranding: (tenantId: string) =>
    tenantId ? `tenant_branding_${tenantId}` : 'tenant_branding',
  COURSE_PLAYER_PREFERENCES: 'student_course_player_prefs',
  coursePlayerLessonNotes: (courseId: string, lessonId: string) =>
    courseId && lessonId ? `notes_${courseId}_${lessonId}` : '',
} as const;
