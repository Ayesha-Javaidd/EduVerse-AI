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
  // Exclude corrupted records (0 questions) — these are saved artefacts from
  // failed Ollama generations and should never be shown to the student.
  const validQuizzes = studentQuizzes.filter(
    (q) => q.courseId === courseId && Array.isArray(q.questions) && q.questions.length > 0
  );

  const normalizedLessonTitle = normalizeQuizTopic(lessonTitle);

  return (
    validQuizzes.find((quiz) => quiz.lessonId === lessonId) ||
    validQuizzes.find((quiz) => {
      if (quiz.lessonId) {
        // Has a lessonId but it didn't match above — skip topic fallback.
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

/** Content values that indicate a failed/incomplete AI generation. */
const BAD_CONTENT_VALUES = new Set(['', 'content unavailable.', 'content unavailable']);

/** Returns true when an adaptive lesson has real, displayable content. */
export function hasValidContent(lesson: AdaptiveLesson | null | undefined): boolean {
  if (!lesson) return false;
  const content = (lesson.content || '').trim();
  if (BAD_CONTENT_VALUES.has(content.toLowerCase())) return false;
  // Reject raw JSON dumps (Layer 4 rescue failures) — content should be markdown, not JSON
  if (content.startsWith('{')) return false;
  return true;
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
  // Filter out lessons with fallback/empty content so that a previous failed
  // generation does NOT block a fresh one from being triggered.
  const matchingLessons = aiGeneratedLessons.filter(
    (lesson) =>
      (lesson.lessonId === lessonId || lesson.sourceTopic === activeLesson.title) &&
      hasValidContent(lesson),
  );

  if (isFirstCourseLesson(allLessons, activeLesson)) {
    // Lesson 1: always show 'base' content (teacher description → AI expanded)
    return (
      matchingLessons.find((lesson) => lesson.generationType === 'base') ||
      matchingLessons[0] ||
      null
    );
  }

  // Lesson 2+: prefer 'adaptive' content generated after quiz submission
  return (
    matchingLessons.find((lesson) => lesson.generationType === 'adaptive') ||
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

export function normalizeMarkdownContent(content: string | null | undefined): string {
  const normalized = String(content || '').replace(/\r\n/g, '\n').trim();
  if (!normalized.startsWith('```')) {
    return normalized;
  }

  const fencedBlockMatch = normalized.match(
    /^```(?:[a-zA-Z0-9_-]+)?\s*\n([\s\S]*)\n```(?:\s*([\s\S]*))?$/i,
  );

  if (!fencedBlockMatch) {
    return normalized;
  }

  const markdownBody = fencedBlockMatch[1]?.trim() || '';
  const trailingText = fencedBlockMatch[2]?.trim() || '';

  return [markdownBody, trailingText].filter(Boolean).join('\n\n');
}
