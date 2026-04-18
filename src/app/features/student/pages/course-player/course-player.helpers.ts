import { Quiz } from '../../services/quiz.service';
import { AdaptiveLesson, CoursePlayerLesson } from './course-player.models';

export function getLessonId(lesson: CoursePlayerLesson | AdaptiveLesson | null | undefined): string {
  if (!lesson) {
    return '';
  }
  return lesson.id || ('_id' in lesson ? lesson._id || '' : '');
}

export function lessonsMatch(
  firstLesson: CoursePlayerLesson | null | undefined,
  secondLesson: CoursePlayerLesson | null | undefined,
): boolean {
  if (!firstLesson || !secondLesson) {
    return false;
  }

  return getLessonId(firstLesson) === getLessonId(secondLesson);
}

export function toEmbedVideoUrl(url: string): string | null {
  if (!url) {
    return null;
  }

  const youTubeMatch = url.match(
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
  );
  if (youTubeMatch?.[1]) {
    return `https://www.youtube.com/embed/${youTubeMatch[1]}`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/i);
  if (loomMatch?.[1]) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }

  return null;
}

export function findGeneratedQuizForLesson(
  lessonId: string,
  lessonTitle: string | null | undefined,
  studentQuizzes: Quiz[],
  courseId: string,
): Quiz | null {
  const normalizedLessonTitle = normalizeQuizTopic(lessonTitle);

  return (
    studentQuizzes.find((quiz) => quiz.lessonId === lessonId && quiz.courseId === courseId) ||
    studentQuizzes.find((quiz) => {
      if (quiz.courseId !== courseId || quiz.lessonId) {
        return false;
      }

      const normalizedQuizTopic = normalizeQuizTopic(quiz.topic || quiz.description);
      return Boolean(
        normalizedLessonTitle &&
          normalizedQuizTopic &&
          (
            normalizedQuizTopic === normalizedLessonTitle ||
            normalizedQuizTopic.includes(normalizedLessonTitle) ||
            normalizedLessonTitle.includes(normalizedQuizTopic)
          ),
      );
    }) ||
    null
  );
}

function normalizeQuizTopic(value: string | null | undefined): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function isFirstCourseLesson(
  lessons: CoursePlayerLesson[],
  lesson: CoursePlayerLesson | null | undefined,
): boolean {
  return lessons.length > 0 && lessonsMatch(lessons[0], lesson);
}

export function getTeacherLessonSource(lesson: CoursePlayerLesson | null | undefined): string {
  return String(lesson?.description || lesson?.content || '').trim();
}

export function isTextLearningLesson(lesson: CoursePlayerLesson | null | undefined): boolean {
  const textLessonTypes = ['document', 'reading', 'file'];
  return Boolean(lesson && (!lesson.type || textLessonTypes.includes(lesson.type)));
}

export function shouldGenerateBaseLesson(
  lessons: CoursePlayerLesson[],
  lesson: CoursePlayerLesson | null | undefined,
): boolean {
  return Boolean(
    lesson &&
      isFirstCourseLesson(lessons, lesson) &&
      isTextLearningLesson(lesson) &&
      getTeacherLessonSource(lesson),
  );
}

export function shouldUseAdaptiveLessonContent(
  lessons: CoursePlayerLesson[],
  lesson: CoursePlayerLesson | null | undefined,
): boolean {
  return Boolean(
    lesson &&
      !isFirstCourseLesson(lessons, lesson) &&
      isTextLearningLesson(lesson) &&
      getTeacherLessonSource(lesson),
  );
}

export function shouldWaitForAdaptiveLesson(
  pendingAdaptiveLessonId: string | null,
  activeAdaptiveLesson: AdaptiveLesson | null,
  lessons: CoursePlayerLesson[],
  lesson: CoursePlayerLesson | null | undefined,
): boolean {
  const lessonId = getLessonId(lesson);

  return Boolean(
    lesson &&
      lessonId &&
      pendingAdaptiveLessonId === lessonId &&
      !activeAdaptiveLesson &&
      !isFirstCourseLesson(lessons, lesson) &&
      isTextLearningLesson(lesson),
  );
}

export function getNextLearningLesson(
  allLessons: CoursePlayerLesson[],
  currentLesson: CoursePlayerLesson | null | undefined,
): CoursePlayerLesson | null {
  const currentIndex = allLessons.findIndex((lesson) => lessonsMatch(lesson, currentLesson));
  if (currentIndex === -1) {
    return null;
  }

  for (let index = currentIndex + 1; index < allLessons.length; index += 1) {
    const candidate = allLessons[index];
    if (candidate?.type !== 'quiz') {
      return candidate;
    }
  }

  return null;
}

export function selectMatchingAdaptiveLesson(
  activeLesson: CoursePlayerLesson | null,
  aiGeneratedLessons: AdaptiveLesson[],
  allLessons: CoursePlayerLesson[],
): AdaptiveLesson | null {
  if (!activeLesson) {
    return null;
  }

  const lessonId = getLessonId(activeLesson);
  const matchingLessons = aiGeneratedLessons.filter(
    (lesson) => lesson.lessonId === lessonId || lesson.sourceTopic === activeLesson.title,
  );

  if (isFirstCourseLesson(allLessons, activeLesson)) {
    return (
      matchingLessons.find((lesson) => lesson.generationType === 'base') ||
      matchingLessons[0] ||
      null
    );
  }

  return (
    matchingLessons.find((lesson) => lesson.generationType !== 'base') ||
    matchingLessons[0] ||
    null
  );
}

export function upsertAdaptiveLesson(
  existingLessons: AdaptiveLesson[],
  generatedLesson: AdaptiveLesson,
): AdaptiveLesson[] {
  return [
    generatedLesson,
    ...existingLessons.filter(
      (lesson) =>
        lesson.id !== generatedLesson.id &&
        !(
          lesson.lessonId === generatedLesson.lessonId &&
          lesson.generationType === generatedLesson.generationType
        ),
    ),
  ];
}
