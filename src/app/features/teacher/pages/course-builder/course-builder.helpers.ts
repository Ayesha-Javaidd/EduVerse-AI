import {
  calculateTotalDuration,
  calculateTotalLessons,
  CourseBuilderData,
  EnrolledStudent,
  Lesson,
  Module,
  generateCourseCode,
  generateId,
} from '../../../../shared/models/course-builder.model';
import { CourseMetadata } from '../../../../shared/models/course-metadata.model';
import { TeacherResponse } from '../../../../shared/models/teacher-profile.models';

type TeacherProfilePayload = TeacherResponse & { user?: { fullName?: string } };

export interface CourseBuilderTeacherIdentity {
  tenantId: string;
  teacherId: string;
  teacherName: string;
  teacherInitial: string;
}

export function upsertModule(
  modules: Module[],
  moduleData: Partial<Module>,
  editingModule: Module | null,
): Module[] {
  if (editingModule) {
    return modules.map((module) =>
      module.id === editingModule.id ? { ...module, ...moduleData } : module,
    );
  }

  return [
    ...modules,
    {
      id: generateId(),
      title: moduleData.title || 'New Module',
      description: moduleData.description || '',
      order: modules.length,
      lessons: [],
      isExpanded: true,
    },
  ];
}

export function removeModule(modules: Module[], moduleId: string): Module[] {
  return modules
    .filter((module) => module.id !== moduleId)
    .map((module, index) => ({ ...module, order: index }));
}

export function upsertLesson(
  modules: Module[],
  selectedModuleId: string,
  lessonData: Partial<Lesson>,
  editingLesson: Lesson | null,
): Module[] {
  return modules.map((module) => {
    if (module.id !== selectedModuleId) {
      return module;
    }

    if (editingLesson) {
      return {
        ...module,
        lessons: module.lessons.map((lesson) =>
          lesson.id === editingLesson.id
            ? { ...lesson, ...lessonData }
            : lesson,
        ),
      };
    }

    const newLesson: Lesson = {
      id: generateId(),
      title: lessonData.title || 'New Lesson',
      type: lessonData.type || 'video',
      duration: lessonData.duration || '',
      content: lessonData.content || '',
      order: module.lessons.length,
    };

    return {
      ...module,
      lessons: [...module.lessons, newLesson],
    };
  });
}

export function removeLesson(
  modules: Module[],
  moduleId: string,
  lessonId: string,
): Module[] {
  return modules.map((module) => {
    if (module.id !== moduleId) {
      return module;
    }

    return {
      ...module,
      lessons: module.lessons
        .filter((lesson) => lesson.id !== lessonId)
        .map((lesson, index) => ({ ...lesson, order: index })),
    };
  });
}

export function appendBulkModules(
  existingModules: Module[],
  modulesToAppend: Module[],
): Module[] {
  const startOrder = existingModules.length;
  const appendedModules = modulesToAppend.map((module, index) => ({
    ...module,
    order: startOrder + index,
  }));

  return [...existingModules, ...appendedModules];
}

export function normalizeCourseTotals(
  course: CourseBuilderData,
): CourseBuilderData {
  const modules = [...course.modules];
  const totalLessons = calculateTotalLessons(modules);
  const totalDuration = calculateTotalDuration(modules);
  const courseCode = course.courseCode || generateCourseCode(course.title);

  return {
    ...course,
    modules,
    totalLessons,
    totalDuration,
    courseCode,
  };
}

export function buildCourseUpdatePayload(course: CourseBuilderData) {
  const normalizedCourse = normalizeCourseTotals(course);

  return {
    title: normalizedCourse.title,
    description: normalizedCourse.description,
    category: normalizedCourse.category,
    level: normalizedCourse.level,
    thumbnailUrl: normalizedCourse.thumbnailUrl,
    courseCode: normalizedCourse.courseCode,
    modules: normalizedCourse.modules.map((module) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      order: module.order,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        content: lesson.content,
        order: lesson.order,
      })),
    })),
    duration: normalizedCourse.totalDuration,
    isPublic: normalizedCourse.isPublic,
    isFree: normalizedCourse.isFree,
    price: normalizedCourse.price,
    currency: normalizedCourse.currency || 'USD',
    instructorBio: normalizedCourse.instructorBio,
    hasCertificate: normalizedCourse.hasCertificate,
    hasBadges: normalizedCourse.hasBadges,
    hasLifetimeAccess: normalizedCourse.hasLifetimeAccess,
  };
}

export function getPublishValidationError(
  course: CourseBuilderData,
): string | null {
  if (course.modules.length === 0) {
    return 'Course must have at least one module to publish';
  }

  const hasLessons = course.modules.some((module) => module.lessons.length > 0);
  if (!hasLessons) {
    return 'Course must have at least one lesson to publish';
  }

  return null;
}

function withCurrentOption(options: string[], currentValue?: string): string[] {
  const normalizedCurrentValue = currentValue?.trim();
  if (!normalizedCurrentValue) {
    return [...options];
  }

  return options.includes(normalizedCurrentValue)
    ? [...options]
    : [normalizedCurrentValue, ...options];
}

export function deriveTeacherIdentity(
  profile: TeacherProfilePayload,
): CourseBuilderTeacherIdentity {
  const teacherName =
    profile.fullName ||
    profile.user?.fullName ||
    profile.email?.split('@')[0] ||
    'Teacher';

  return {
    tenantId: profile.tenantId || '',
    teacherId: profile.id || '',
    teacherName,
    teacherInitial: teacherName.charAt(0).toUpperCase(),
  };
}

export function syncCourseMetadataOptions(
  courseMetadata: CourseMetadata,
  course: CourseBuilderData | null,
): {
  course: CourseBuilderData | null;
  categoryOptions: string[];
  levelOptions: string[];
} {
  const nextCourse = course
    ? {
        ...course,
        category: course.category || courseMetadata.defaultCategory,
        level: course.level || courseMetadata.defaultLevel,
      }
    : null;

  return {
    course: nextCourse,
    categoryOptions: withCurrentOption(
      courseMetadata.categories,
      nextCourse?.category,
    ),
    levelOptions: withCurrentOption(courseMetadata.levels, nextCourse?.level),
  };
}

export function filterEnrolledStudents(
  students: EnrolledStudent[],
  searchQuery: string,
): EnrolledStudent[] {
  if (!searchQuery.trim()) {
    return students;
  }

  const query = searchQuery.toLowerCase();
  return students.filter(
    (student) =>
      student.fullName.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query),
  );
}

export function formatCourseBuilderDate(dateString: string): string {
  if (!dateString) {
    return 'N/A';
  }

  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
