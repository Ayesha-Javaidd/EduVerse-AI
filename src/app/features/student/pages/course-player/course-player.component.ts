import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { StudentProgressService, CourseProgress } from '../../services/student-progress.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { QuizService, Quiz } from '../../services/quiz.service';
import { QuizSubmissionService } from '../../services/quiz-submission.service';
import { AiTutorMessageResponse, AiTutorService } from '../../services/ai-tutor.service';
import { AdaptiveLearningService } from '../../services/adaptive-learning.service';
import { CoursePlayerStorageService } from '../../services/course-player-storage.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { STORAGE_KEYS } from '../../../../core/constants/app.constants';
import { MarkdownModule } from 'ngx-markdown';
import {
    findGeneratedQuizForLesson,
    getLessonId,
    getNextLearningLesson,
    getTeacherLessonSource,
    hasValidContent,
    isFirstCourseLesson,
    lessonsMatch,
    selectMatchingAdaptiveLesson,
    normalizeMarkdownContent,
    shouldGenerateBaseLesson,
    shouldUseAdaptiveLessonContent,
    shouldWaitForAdaptiveLesson,
    toEmbedVideoUrl,
    upsertAdaptiveLesson,
} from './course-player.helpers';
import {
    AdaptiveLesson,
    ChatMessage,
    CoursePlayerLesson,
    QuizSubmissionResponse,
} from './course-player.models';

@Component({
    selector: 'app-course-player',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent, MarkdownModule],
    templateUrl: './course-player.component.html',
    styleUrls: ['./course-player.component.css']
})
export class CoursePlayerComponent implements OnInit, OnDestroy {
    private readonly playerPrefsStorageKey = STORAGE_KEYS.COURSE_PLAYER_PREFERENCES;
    isCompactViewport = false;
    courseId: string = '';
    course: BackendCourse | null = null;
    progress: CourseProgress | null = null;
    loading: boolean = true;
    activeLesson: CoursePlayerLesson | null = null;
    activeModuleIndex: number = 0;
    allLessons: CoursePlayerLesson[] = [];
    videoUrl: SafeResourceUrl | null = null;

    // Quiz State
    activeQuiz: Quiz | null = null;
    quizAnswers: string[] = [];
    quizScore: number = 0;
    quizSubmitted: boolean = false;
    loadingQuiz: boolean = false;
    submittingQuiz: boolean = false;
    /** Average score across all quiz submissions for this course (used for progress bar). */
    avgQuizScore: number = 0;

    // Sidebar visibility
    isSidebarOpen: boolean = true;
    isAiAssistantOpen: boolean = true;
    aiAssistantWidth: number = 288;
    private readonly minAiAssistantWidth = 260;
    private readonly maxAiAssistantWidth = 420;
    private isResizingAiAssistant = false;
    private readonly handleAiAssistantResize = (event: MouseEvent) => {
        if (!this.isResizingAiAssistant) {
            return;
        }

        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const nextWidth = Math.min(
            this.maxAiAssistantWidth,
            Math.max(this.minAiAssistantWidth, viewportWidth - event.clientX)
        );
        this.aiAssistantWidth = nextWidth;
    };
    private readonly stopAiAssistantResize = () => {
        if (!this.isResizingAiAssistant) {
            return;
        }
        this.isResizingAiAssistant = false;
        document.body.classList.remove('select-none', 'cursor-col-resize');
        window.removeEventListener('mousemove', this.handleAiAssistantResize);
        window.removeEventListener('mouseup', this.stopAiAssistantResize);
        this.persistPlayerPreferences();
    };

    // Notes
    userNotes: string = '';
    isSavingNotes: boolean = false;
    private lessonNoteDrafts: Record<string, string> = {};

    // Chat
    chatInput: string = '';
    chatMessages: ChatMessage[] = [
        { sender: 'AI', text: 'Hello! I am your AI study assistant. How can I help you with this course today?', time: new Date() }
    ];
    isSendingChat: boolean = false;
    private chatSubscription: any = null;

    // Adaptive Flow
    isGeneratingAiLesson: boolean = false;
    isWaitingForAdaptiveLesson: boolean = false;
    aiGeneratedLessons: AdaptiveLesson[] = [];
    studentQuizzes: Quiz[] = [];
    studentSubmissions: Map<string, number> = new Map();
    activeAdaptiveLesson: AdaptiveLesson | null = null;
    renderedAdaptiveLessonContent: string = '';
    private aiLessonsLoaded: boolean = false;
    private quizzesLoaded: boolean = false;
    private generatingBaseLessonForId: string | null = null;
    private generatingAdaptiveLessonForId: string | null = null;
    pendingAdaptiveLessonId: string | null = null;
    private adaptiveLessonPollToken: number = 0;
    /** Lesson IDs that hit a 429 — skip regenerating until next full page load. */
    private rateLimitedBaseLessonIds: Set<string> = new Set();
    aiGenerationError: string | null = null;
    aiQuizError: string | null = null;
    validationScore: number | null = null;
    validationVerdict: string | null = null;
    private isAiLessonsLoading: boolean = false;
    /** Timer IDs for scheduleAdaptiveRefresh so we can cancel stale ones. */
    private refreshQuizTimerId: ReturnType<typeof setTimeout> | null = null;
    private refreshLessonsTimerId: ReturnType<typeof setTimeout> | null = null;
    /** True when we are silently re-polling for a quiz that was still generating on page load. */
    isPollingForQuiz: boolean = false;
    /** True when adaptive-lesson polling timed out — content may still be generating. Next stays locked. */
    adaptiveLessonTimedOut: boolean = false;
    /**
     * Set to true at navigation time when the student moves to a lesson that was
     * already completed in a prior session. Allows lesson content to be shown
     * alongside the quiz on revisits, without affecting the first-time quiz flow
     * (where markComplete() clears this flag immediately).
     */
    isRevisitingCompletedLesson: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private courseService: CourseService,
        private progressService: StudentProgressService,
        private quizService: QuizService,
        private submissionService: QuizSubmissionService,
        private aiTutorService: AiTutorService,
        private adaptiveService: AdaptiveLearningService,
        private coursePlayerStorage: CoursePlayerStorageService,
        private toastService: ToastService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit() {
        this.updateViewportState();
        this.restorePlayerPreferences();
        this.route.paramMap.subscribe(params => {
            this.courseId = params.get('id') || '';
            if (this.courseId) {
                this.loadCourseAndProgress();
            }
        });
    }

    ngOnDestroy() {
        // Bump the poll token so ALL pending window.setTimeout callbacks from
        // ensureAdaptiveLessonReady stop scheduling new requests immediately.
        // Without this, old callbacks continue firing after the component is
        // destroyed (ghost polling) — visible as hundreds of GET requests.
        this.adaptiveLessonPollToken += 1;
        this.stopAiAssistantResize();
        this.cancelPendingRefreshTimers();
    }

    @HostListener('window:resize')
    updateViewportState() {
        this.isCompactViewport = window.innerWidth < 1280;
    }

    private restorePlayerPreferences() {
        const preferences = this.coursePlayerStorage.restorePreferences(
            this.playerPrefsStorageKey,
            this.minAiAssistantWidth,
            this.maxAiAssistantWidth
        );
        if (typeof preferences.isSidebarOpen === 'boolean') {
            this.isSidebarOpen = preferences.isSidebarOpen;
        }
        if (typeof preferences.isAiAssistantOpen === 'boolean') {
            this.isAiAssistantOpen = preferences.isAiAssistantOpen;
        }
        if (typeof preferences.aiAssistantWidth === 'number') {
            this.aiAssistantWidth = preferences.aiAssistantWidth;
        }
    }

    private persistPlayerPreferences() {
        this.coursePlayerStorage.persistPreferences(this.playerPrefsStorageKey, {
            isSidebarOpen: this.isSidebarOpen,
            isAiAssistantOpen: this.isAiAssistantOpen,
            aiAssistantWidth: this.aiAssistantWidth,
        });
    }

    loadCourseAndProgress() {
        // Reset load flags so a course navigation always re-evaluates polling needs.
        this.quizzesLoaded = false;
        this.courseService.getCourseById(this.courseId).subscribe({
            next: (course) => {
                this.course = course;
                this.flattenLessons();
                this.loadProgress(course?.tenantId);  // loadStudentQuizzes is called inside this
                this.loadAiGeneratedLessons();
                // NOTE: loadStudentQuizzes() is intentionally NOT called here.
                // It is called from inside loadProgress() AFTER selectLesson() runs,
                // ensuring activeLesson + progress are always set before quiz polling logic fires.
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    flattenLessons() {
        this.allLessons = [];
        if (!this.course?.modules) return;
        this.course.modules.forEach((module, mIdx) => {
            if (module.lessons) {
                module.lessons.forEach((lesson: CoursePlayerLesson) => {
                    this.allLessons.push({ ...lesson, moduleIndex: mIdx });
                });
            }
        });
    }

    loadProgress(tenantId?: string) {
        this.progressService.getCourseProgress(this.courseId, tenantId).subscribe({
            next: (progress) => {
                this.progress = progress;
                if (!this.activeLesson) {
                    const savedLessonId = localStorage.getItem(`eduverse_last_lesson_${this.courseId}`);
                    let targetLesson = this.allLessons[0];
                    if (savedLessonId) {
                        targetLesson = this.allLessons.find(l => this.getLessonId(l) === savedLessonId) || this.allLessons[0];
                    } else {
                        targetLesson = this.allLessons.find((lesson) => !this.isLessonCompleted(this.getLessonId(lesson))) || this.allLessons[0];
                    }
                    
                    if (targetLesson) {
                        this.selectLesson(targetLesson, targetLesson.moduleIndex ?? 0);
                    }
                }
                this.loading = false;
                // Load quizzes NOW — progress and activeLesson are both guaranteed set.
                // This eliminates the race condition that caused the polling check to
                // fire before we knew which lesson is active or what is completed.
                this.loadStudentQuizzes();
            },
            error: (err) => {
                console.error('Error loading progress', err);
                this.loading = false;
                // Still load quizzes even if progress fails — show what we can.
                this.loadStudentQuizzes();
            }
        });
    }

    loadAiGeneratedLessons() {
        if (this.isAiLessonsLoading) return;
        this.isAiLessonsLoading = true;
        this.aiGenerationError = null;

        this.adaptiveService.getStudentLessons(this.courseId).subscribe({
            next: (lessons: AdaptiveLesson[]) => {
                this.aiGeneratedLessons = lessons;
                this.aiLessonsLoaded = true;
                this.isAiLessonsLoading = false;
                this.syncActiveAdaptiveLesson();
                if (this.activeAdaptiveLesson && this.pendingAdaptiveLessonId === this.getLessonId(this.activeLesson)) {
                    this.generatingAdaptiveLessonForId = null;
                    this.pendingAdaptiveLessonId = null;
                    this.isWaitingForAdaptiveLesson = false;
                }
                // Now that we know which AI lessons already exist, safely decide
                // if Lesson 1 base content needs to be generated.
                this.ensureBaseLessonContent();
                // If the active lesson expects adaptive content but none arrived yet
                // and nothing is polling (e.g. after a page refresh that cleared
                // pendingAdaptiveLessonId), auto-restart the poll so the student
                // isn't stuck on a blank spinner with no recovery path.
                this.recoverOrphanedAdaptivePending();
            },
            error: (err) => { 
                console.error('Error loading AI lessons', err); 
                this.aiLessonsLoaded = true; 
                this.isAiLessonsLoading = false;
                this.ensureBaseLessonContent(); 
            }
        });
    }

    loadStudentQuizzes(showQuizForLessonId?: string, attempt: number = 0) {
        this.quizService.getMyQuizzes().subscribe({
            next: (quizzes) => {
                this.studentQuizzes = quizzes.filter((quiz) => quiz.courseId === this.courseId);
                this.recomputeAvgQuizScore();
                const currentLessonId = this.activeLesson ? this.getLessonId(this.activeLesson) : null;
                if (!showQuizForLessonId) {
                    if (currentLessonId) {
                        const generatedQuiz = this.findGeneratedQuizForLesson(currentLessonId);
                        if (generatedQuiz && !this.activeQuiz) {
                            this.applyQuiz(generatedQuiz);
                            return;  // Quiz found — done.
                        }
                    }
                    // Quiz not in list yet — start polling if the lesson is complete
                    // (activeLesson and progress are both guaranteed set at this point
                    //  because loadStudentQuizzes is called after loadProgress resolves).
                    this.startQuizPollingIfExpected(currentLessonId || '');
                }
                if (showQuizForLessonId) {
                    const generatedQuiz = this.findGeneratedQuizForLesson(showQuizForLessonId);
                    if (generatedQuiz) {
                        this.applyQuiz(generatedQuiz);
                        this.isPollingForQuiz = false;
                        this.toastService.success('Your lesson quiz is ready.');
                    } else if (attempt < 72) {
                        // Ollama can take up to 6 minutes — poll every 5s for up to 72 attempts
                        window.setTimeout(() => this.loadStudentQuizzes(showQuizForLessonId, attempt + 1), 5000);
                    } else {
                        this.loadingQuiz = false;
                        this.isPollingForQuiz = false;
                        this.aiQuizError = 'Quiz generation is taking longer than expected. Please refresh the page in a moment.';
                        this.toastService.error('Quiz generation is taking longer than expected. Please refresh in a moment.');
                    }
                }
            },
            error: (err) => {
                console.error('Error loading student quizzes', err);
                if (showQuizForLessonId && attempt < 72) {
                    window.setTimeout(() => this.loadStudentQuizzes(showQuizForLessonId, attempt + 1), 5000);
                } else {
                    this.loadingQuiz = false;
                    this.isPollingForQuiz = false;
                    const errMsg = err?.error?.detail || err?.message || 'Quiz loading failed. Please try again.';
                    this.aiQuizError = errMsg;
                    this.toastService.error(errMsg);
                }
            }
        });
    }

    /**
     * Called on page load after quizzes are fetched and none match the current lesson.
     * If the lesson is already marked complete (meaning mark-complete already fired and
     * the backend should be generating a quiz), silently start polling — exactly like
     * the post-markComplete flow does. This makes page-refresh mid-generation graceful.
     *
     * NOTE: `startQuizPollingIfExpected` is the internal path when activeLesson is already
     * set at the time quizzes arrive. `checkAndStartQuizPolling` is the dual-trigger path
     * called from both loadProgress and loadStudentQuizzes to handle whichever finishes last.
     */
    private startQuizPollingIfExpected(lessonId: string) {
        if (
            !lessonId ||
            this.isPollingForQuiz ||
            this.activeQuiz ||
            this.aiQuizError ||
            !this.isLessonCompleted(lessonId) ||
            this.activeLesson?.type === 'quiz'
        ) {
            // Not in a state where quiz generation should be expected.
            this.loadingQuiz = false;
            return;
        }

        // Lesson is complete but no valid quiz found.
        // Call mark-complete again — the backend is now idempotent:
        // it checks if a valid quiz exists and generates one if not.
        // This covers the page-refresh scenario where Ollama failed silently.
        const tenantId = this.course?.tenantId;
        this.isMarkingComplete = true;
        this.loadingQuiz = true;

        this.progressService.markLessonComplete(this.courseId, lessonId, tenantId).subscribe({
            next: () => {
                this.isMarkingComplete = false;
                this.isPollingForQuiz = true;
                this.loadStudentQuizzes(lessonId, 0);
            },
            error: () => {
                // If mark-complete fails (e.g. network), fall back to polling only.
                this.isMarkingComplete = false;
                this.isPollingForQuiz = true;
                this.loadStudentQuizzes(lessonId, 0);
            }
        });
    }

    /**
     * Dual-trigger polling check: called from BOTH loadStudentQuizzes (initial load) AND
     * loadProgress so that whichever async call finishes last can start polling correctly.
     * Guarded by `quizzesLoaded` so it never fires before we have the quiz list.
     */
    private checkAndStartQuizPolling() {
        // Need both lesson + progress to evaluate; quizzes are guaranteed loaded by caller.
        if (!this.activeLesson || !this.progress || this.activeQuiz || this.isPollingForQuiz || this.aiQuizError) {
            if (this.activeLesson && this.progress && !this.activeQuiz && !this.isPollingForQuiz) {
                this.loadingQuiz = false;  // Nothing pending — clear the spinner.
            }
            return;
        }

        const lessonId = this.getLessonId(this.activeLesson);
        if (!lessonId || this.activeLesson.type === 'quiz' || !this.isLessonCompleted(lessonId)) {
            this.loadingQuiz = false;
            return;
        }

        // Check if quiz already arrived in the list we just loaded.
        const existing = this.findGeneratedQuizForLesson(lessonId);
        if (existing) {
            this.applyQuiz(existing);
            return;
        }

        // Lesson complete, no quiz found — backend is still generating. Start polling.
        this.isPollingForQuiz = true;
        this.loadingQuiz = true;
        this.loadStudentQuizzes(lessonId, 0);
    }

    /**
     * Recompute the average quiz score across all submissions for this course.
     * Uses the best (latest/highest) submission per quiz to avoid penalising retries.
     */
    private recomputeAvgQuizScore() {
        const user = this.authService.getUser();
        const studentId = user?.studentId || user?.id;
        if (!studentId || !this.courseId) {
            this.avgQuizScore = 0;
            return;
        }

        this.submissionService.getSubmissionsByStudent(studentId).subscribe({
            next: (submissions) => {
                const courseSubmissions = submissions.filter(s => s.courseId === this.courseId);
                if (!courseSubmissions.length) {
                    this.avgQuizScore = 0;
                    return;
                }

                // Get highest submission score for each quiz
                const bestSubmissions = new Map<string, number>();
                courseSubmissions.forEach(sub => {
                    if (sub.percentage !== undefined && sub.percentage !== null) {
                        const existing = bestSubmissions.get(sub.quizId) || 0;
                        bestSubmissions.set(sub.quizId, Math.max(existing, sub.percentage));
                    }
                });
                this.studentSubmissions = bestSubmissions;

                const scores = Array.from(bestSubmissions.values());
                if (!scores.length) {
                    this.avgQuizScore = 0;
                    return;
                }

                const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
                this.avgQuizScore = Math.round(avg);

                // Reactively update the current quiz state now that we have submissions.
                // This ensures revisiting a passed lesson correctly skips the quiz
                // even if this HTTP request finished after applyQuiz ran.
                if (this.isRevisitingCompletedLesson && this.activeQuiz && this.studentSubmissions.has(this.activeQuiz.id)) {
                    this.quizSubmitted = true;
                }
            },
            error: (err) => {
                console.error('Failed to compute avg quiz score', err);
                this.avgQuizScore = 0;
            }
        });
    }

    private getAdaptiveStudentLevel(): 'slow' | 'average' | 'fast' {
        if (this.avgQuizScore >= 80) {
            return 'fast';
        }
        if (this.avgQuizScore > 0 && this.avgQuizScore < 50) {
            return 'slow';
        }
        return 'average';
    }

    selectLesson(lesson: CoursePlayerLesson, moduleIndex: number) {
        this.persistCurrentLessonDraft();

        // Cancel any pending refresh timers from the previous lesson so we
        // don't fire stale backend calls after navigating away.
        this.cancelPendingRefreshTimers();

        this.activeLesson = lesson;
        const lessonId = this.getLessonId(lesson);
        if (lessonId) {
            localStorage.setItem(`eduverse_last_lesson_${this.courseId}`, lessonId);
        }
        
        this.activeModuleIndex = moduleIndex;
        this.quizSubmitted = false;
        this.activeQuiz = null;
        this.quizAnswers = [];
        this.loadingQuiz = true;
        this.isPollingForQuiz = false;
        this.quizEverSeen = false;   // Reset per lesson — quiz must appear fresh.
        // Clear stale adaptive content immediately so the old lesson's text
        // never flickers before the new lesson's content arrives.
        this.renderedAdaptiveLessonContent = '';

        // Capture whether this lesson is already completed BEFORE any mark-complete
        // calls fire. This lets the template show lesson content on revisits
        // without accidentally showing it during a fresh first-time quiz session.
        this.isRevisitingCompletedLesson = this.isLessonCompleted(this.getLessonId(lesson));
        this.loadNotesForCurrentLesson();
        this.syncActiveAdaptiveLesson();
        // Only generate Lesson 1 base content AFTER the AI-lessons fetch finishes
        // (aiLessonsLoaded). This prevents triggering generation before we know
        // whether the base lesson already exists from a prior session.
        // If not yet loaded, loadAiGeneratedLessons() will call this itself.
        if (this.aiLessonsLoaded) {
            this.ensureBaseLessonContent();
        }

        // Handle Video URL
        if (lesson.type === 'video' && lesson.content) {
            this.videoUrl = this.getSafeVideoUrl(lesson.content);
        } else {
            this.videoUrl = null;
        }

        // Handle Quiz
        this.loadQuizForLesson(lesson);

        // Auto-scroll to top of content
        const mainContent = document.querySelector('main');
        if (mainContent) mainContent.scrollTo(0, 0);

        if (this.isCompactViewport && this.isSidebarOpen) {
            this.isSidebarOpen = false;
            this.persistPlayerPreferences();
        }

        this.loadChatHistory();

        // Reset error state
        this.aiGenerationError = null;
        this.aiQuizError = null;
        this.adaptiveLessonTimedOut = false;
        // After all state resets, recover missing adaptive content for this lesson.
        // Must fire AFTER adaptiveLessonTimedOut=false so the guard inside passes.
        if (this.aiLessonsLoaded) {
            this.recoverOrphanedAdaptivePending();
        }

        // Reset error state
    }

    loadQuiz(quizId: string) {
        this.loadingQuiz = true;
        this.quizService.getQuizById(quizId).subscribe({
            next: (quiz) => {
                // Guard: if the stored quiz has no questions it is a failed generation artefact.
                // Do NOT call applyQuiz() — that would set quizEverSeen=true and show the
                // "Completed" badge even though the student has never actually taken a quiz.
                if (!quiz.questions || quiz.questions.length === 0) {
                    console.warn('loadQuiz: received quiz with 0 questions — discarding', quizId);
                    this.loadingQuiz = false;
                    this.aiQuizError = 'Quiz generation is still in progress. Please try again in a moment.';
                    return;
                }
                this.applyQuiz(quiz);
            },
            error: (err) => {
                console.error('Error loading quiz:', err);
                this.loadingQuiz = false;
                const errMsg = err?.error?.detail || err?.message || 'Could not load quiz. Please try again.';
                this.aiQuizError = errMsg;
                this.toastService.error(errMsg);
            }
        });
    }

    loadQuizForLesson(lesson: CoursePlayerLesson) {
        const lessonId = this.getLessonId(lesson);

        if (lesson.type === 'quiz' && lesson.content) {
            // Teacher-authored quiz — the lesson.content field holds the quiz's ObjectId
            // in the `quizzes` collection. Fetch it via the standard endpoint.
            this.loadQuiz(lesson.content);
            return;
        }

        // AI-generated quiz — already loaded into studentQuizzes via getMyQuizzes()
        // which reads from ai_quiz_sessions_collection. Apply directly; DO NOT call
        // loadQuiz() because /quizzes/{id} queries the wrong (quizzes) collection → 404.
        const generatedQuiz = this.findGeneratedQuizForLesson(lessonId);
        if (generatedQuiz) {
            this.applyQuiz(generatedQuiz);
        } else {
            this.loadingQuiz = false;
        }
    }

    submitQuiz() {
        if (!this.activeQuiz) return;
        const studentId = this.authService.getUser()?.studentId || '';
        const tenantId = this.course?.tenantId || '';
        if (!studentId || !tenantId) {
            this.toastService.error('Quiz context is incomplete right now. Please refresh and try again.');
            return;
        }
        this.submittingQuiz = true;
        this.loadingQuiz = true;

        const payload = {
            studentId,
            quizId: this.activeQuiz.id,
            courseId: this.courseId,
            tenantId,
            answers: this.quizAnswers.map((selected, questionIndex) => ({
                questionIndex,
                selected,
            })),
        };

        this.submissionService.submitQuiz(payload).subscribe({
            next: (submission: QuizSubmissionResponse) => {
                this.quizScore = submission.percentage || 0;
                this.quizSubmitted = true;
                this.submittingQuiz = false;
                this.loadingQuiz = false;

                // Update running quiz-score average immediately with this submission.
                this.updateAvgQuizScoreWith(this.quizScore);

                // Always trigger next adaptive lesson generation on EVERY submission
                // (first attempt and retries alike).
                const nextLesson = this.getNextLearningLesson(this.activeLesson);
                if (nextLesson && this.shouldUseAdaptiveLessonContent(nextLesson)) {
                    this.pendingAdaptiveLessonId = this.getLessonId(nextLesson);
                    this.isWaitingForAdaptiveLesson = true;
                    
                    // Explicitly tell the backend to start generating the next lesson
                    // using the newly achieved quiz score, then begin polling.
                    this.triggerAdaptiveLessonGeneration(this.pendingAdaptiveLessonId!, () => {
                        this.adaptiveLessonPollToken += 1;
                        const token = this.adaptiveLessonPollToken;
                        window.setTimeout(() => this.ensureAdaptiveLessonReady(0, token), 3000);
                    });
                }

                if (
                    this.activeLesson?.type === 'quiz' &&
                    !this.isLessonCompleted(this.getLessonId(this.activeLesson))
                ) {
                    this.markComplete();
                } else {
                    this.scheduleAdaptiveRefresh();
                }

                this.toastService.success(`Quiz submitted! Score: ${this.quizScore}%. Preparing your personalized next lesson...`);
            },
            error: (err) => {
                console.error('Error submitting quiz:', err);
                this.submittingQuiz = false;
                this.loadingQuiz = false;
                this.toastService.error(err?.error?.detail || 'Could not submit quiz right now.');
            }
        });
    }

    getSafeVideoUrl(url: string): SafeResourceUrl | null {
        const embedUrl = toEmbedVideoUrl(url);
        return embedUrl
            ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl)
            : null;
    }

    // Helper to compare IDs safely
    lessonsMatch(l1: CoursePlayerLesson | null, l2: CoursePlayerLesson | null): boolean {
        return lessonsMatch(l1, l2);
    }

    getLessonId(lesson: CoursePlayerLesson | AdaptiveLesson | null): string {
        return getLessonId(lesson);
    }

    syncActiveAdaptiveLesson() {
        this.activeAdaptiveLesson = selectMatchingAdaptiveLesson(
            this.activeLesson,
            this.aiGeneratedLessons,
            this.allLessons
        );
        this.renderedAdaptiveLessonContent = normalizeMarkdownContent(this.activeAdaptiveLesson?.content);
    }



    /**
     * Reset quiz state so the student can re-attempt the quiz.
     * Only valid for TEACHER-AUTHORED quizzes (lesson.type === 'quiz').
     * For AI-generated quizzes the retry path is retriggerQuizForLesson().
     */
    retryQuiz() {
        if (this.activeLesson?.type !== 'quiz') return;  // Guard: never reset AI quiz submissions.
        this.quizSubmitted = false;
        this.quizAnswers = new Array(this.activeQuiz?.questions?.length ?? 0).fill('');
        this.quizScore = 0;
    }

    /** True when every question has a selected answer. */
    get allAnswered(): boolean {
        if (!this.activeQuiz) return false;
        return this.quizAnswers.length === this.activeQuiz.questions.length &&
            this.quizAnswers.every(a => !!a);
    }

    /** True when the latest submitted quiz score is a pass (>= 70%). */
    get isQuizPassing(): boolean {
        return this.quizScore >= 70;
    }

    /** True when a backend adaptive-lesson generation is in progress for the next lesson. */
    get hasPendingAdaptiveLesson(): boolean {
        return !!this.pendingAdaptiveLessonId;
    }

    get totalLessons(): number {
        return this.allLessons.length;
    }

    get completedLessonCount(): number {
        return this.progress?.completedLessons?.length || 0;
    }

    get currentLessonNumber(): number {
        const index = this.allLessons.findIndex((lesson) => this.lessonsMatch(lesson, this.activeLesson));
        return index >= 0 ? index + 1 : 0;
    }

    get progressWidth(): number {
        return this.avgQuizScore;
    }

    get activeModuleTitle(): string {
        return this.course?.modules?.[this.activeModuleIndex]?.title || 'Current module';
    }



    getNextLearningLesson(afterLesson: CoursePlayerLesson | null): CoursePlayerLesson | null {
        return getNextLearningLesson(this.allLessons, afterLesson);
    }

    findGeneratedQuizForLesson(lessonId: string): Quiz | null {
        const lessonTitle =
            this.allLessons.find((lesson) => this.getLessonId(lesson) === lessonId)?.title ||
            this.activeLesson?.title ||
            null;

        return findGeneratedQuizForLesson(lessonId, lessonTitle, this.studentQuizzes, this.courseId);
    }

    applyQuiz(quiz: Quiz) {
        // Guard: never apply a 0-question quiz.
        // Such records are DB artefacts from failed Ollama generations.
        // Applying them would set quizEverSeen=true and show the
        // "Completed" badge even though no real quiz was presented.
        if (!quiz.questions || quiz.questions.length === 0) {
            console.warn('applyQuiz: skipping quiz with 0 questions', quiz.id);
            this.loadingQuiz = false;
            this.isPollingForQuiz = false;
            this.aiQuizError = 'Quiz generation encountered an issue. Please click "Retry Quiz Generation" to try again.';
            return;
        }
        this.activeQuiz = quiz;
        this.quizAnswers = new Array(quiz.questions.length).fill('');
        this.loadingQuiz = false;
        this.quizEverSeen = true;  // Quiz has appeared — disable "Mark Complete" from now on.

        // Only mark it as submitted if they actually passed it previously.
        if (this.isRevisitingCompletedLesson && this.studentSubmissions.has(quiz.id)) {
            this.quizSubmitted = true;
        }
    }



    isFirstCourseLesson(lesson: CoursePlayerLesson | null): boolean {
        return isFirstCourseLesson(this.allLessons, lesson);
    }

    getTeacherLessonSource(lesson: CoursePlayerLesson | null): string {
        return getTeacherLessonSource(lesson);
    }

    shouldGenerateBaseLesson(lesson: CoursePlayerLesson | null): boolean {
        return shouldGenerateBaseLesson(this.allLessons, lesson);
    }

    shouldUseAdaptiveLessonContent(lesson: CoursePlayerLesson | null): boolean {
        return shouldUseAdaptiveLessonContent(this.allLessons, lesson);
    }

    shouldShowAdaptiveLessonPlaceholder(): boolean {
        return Boolean(
            this.activeLesson &&
            this.shouldUseAdaptiveLessonContent(this.activeLesson) &&
            !this.activeAdaptiveLesson
        );
    }

    upsertAiGeneratedLesson(generatedLesson: AdaptiveLesson) {
        this.aiGeneratedLessons = upsertAdaptiveLesson(this.aiGeneratedLessons, generatedLesson);
    }

    ensureBaseLessonContent() {
        if (!this.activeLesson || !this.shouldGenerateBaseLesson(this.activeLesson)) {
            return;
        }

        const lessonId = this.getLessonId(this.activeLesson);
        if (
            !lessonId ||
            this.activeAdaptiveLesson ||
            this.generatingBaseLessonForId === lessonId ||
            this.rateLimitedBaseLessonIds.has(lessonId)  // 🔒 skip 429'd lessons
        ) {
            return;
        }

        const sourceContent = this.getTeacherLessonSource(this.activeLesson);
        if (!sourceContent) {
            return;
        }

        this.generatingBaseLessonForId = lessonId;
        this.isGeneratingAiLesson = true;

        const topic = this.activeLesson.title || 'Lesson 1';

        // Use generate-base-lesson endpoint so the content is SAVED to the DB
        // with generationType='base'. This means on a page refresh the backend
        // returns the cached lesson and we never call Ollama again.
        this.adaptiveService.generateBaseLesson(
            this.courseId,
            lessonId,
            topic,
            sourceContent
        ).subscribe({
            next: (generatedLesson: AdaptiveLesson) => {
                // The backend returns the full AdaptiveLesson object
                // (same shape as getStudentLessons), so we can upsert directly.
                this.upsertAiGeneratedLesson(generatedLesson);
                this.syncActiveAdaptiveLesson();
                this.generatingBaseLessonForId = null;
                this.isGeneratingAiLesson = false;
                this.aiGenerationError = null;
            },
            error: (err) => {
                console.error('Error generating base lesson:', err);
                this.generatingBaseLessonForId = null;
                this.isGeneratingAiLesson = false;

                if (err?.status === 429 || err?.status === 503) {
                    // 🔒 Mark rate-limited — don't retry until next full page load.
                    this.rateLimitedBaseLessonIds.add(lessonId);
                    this.aiGenerationError = err?.error?.detail || 'AI is busy generating content. Please try again in a moment.';
                } else if (err?.message === 'Base lesson generation already in progress for this lesson.') {
                    // Deduplicated — ignore silently, a concurrent call is in-flight.
                    return;
                } else {
                    // Any other error — always surface retry UI, never show vague toast.
                    this.aiGenerationError = err?.error?.detail || err?.message || 'Content generation failed. Please retry.';
                }
                this.toastService.error(this.aiGenerationError!);
            }
        });
    }

    // REMOVED: ensureAdaptiveLessonContent() was calling POST /adaptive/generate-lesson
    // from the frontend on every lesson navigation, wasting API quota and causing duplicates.
    // Adaptive lessons for Lesson 2+ are ONLY generated by the backend after quiz submission.
    // The frontend's job is only to poll for what the backend already produced.

    /**
     * Called after AI lessons load (or on lesson navigation). If the active lesson
     * expects adaptive content but none exists yet AND no poll is currently running
     * (e.g. after a page refresh that cleared pendingAdaptiveLessonId), immediately
     * POST to generate-lesson (idempotent — returns existing if already done) then
     * poll. Simply polling without triggering generation finds nothing forever.
     */
    private recoverOrphanedAdaptivePending() {
        if (
            !this.activeLesson ||
            this.pendingAdaptiveLessonId ||
            this.isWaitingForAdaptiveLesson ||
            this.adaptiveLessonTimedOut ||
            this.activeAdaptiveLesson ||
            !this.shouldUseAdaptiveLessonContent(this.activeLesson)
        ) {
            return;
        }
        const lessonId = this.getLessonId(this.activeLesson);
        if (!lessonId) return;
        this.pendingAdaptiveLessonId = lessonId;
        this.isWaitingForAdaptiveLesson = true;
        // Trigger generation immediately (backend is idempotent), then poll.
        this.triggerAdaptiveLessonGeneration(lessonId, () => {
            this.adaptiveLessonPollToken += 1;
            const token = this.adaptiveLessonPollToken;
            window.setTimeout(() => this.ensureAdaptiveLessonReady(0, token), 3000);
        });
    }

    shouldWaitForAdaptiveLesson(lesson: CoursePlayerLesson | null): boolean {
        return shouldWaitForAdaptiveLesson(
            this.pendingAdaptiveLessonId,
            this.activeAdaptiveLesson,
            this.allLessons,
            lesson
        );
    }

    /**
     * Poll the backend for the next lesson's AI content.
     * Retries every 5s for up to 36 attempts (~3 min).
     * On timeout: sets adaptiveLessonTimedOut=true and KEEPS pendingAdaptiveLessonId
     * so Next stays locked. Student uses retryAdaptiveLesson() to re-poll.
     */
    ensureAdaptiveLessonReady(attempt: number = 0, pollToken?: number) {
        if (!this.pendingAdaptiveLessonId) {
            this.isWaitingForAdaptiveLesson = false;
            return;
        }

        const targetLessonId = this.pendingAdaptiveLessonId;

        if (pollToken === undefined) {
            this.adaptiveLessonPollToken += 1;
            pollToken = this.adaptiveLessonPollToken;
        }

        this.adaptiveService.getStudentLessons(this.courseId).subscribe({
            next: (lessons: AdaptiveLesson[]) => {
                if (pollToken !== this.adaptiveLessonPollToken) return;

                this.aiGeneratedLessons = lessons;
                this.syncActiveAdaptiveLesson();

                const arrived = lessons.find(
                    (l) =>
                        (l.lessonId === targetLessonId || l.sourceTopic === this.getNextLearningLesson(this.activeLesson)?.title)
                        && l.generationType !== 'base'
                        && hasValidContent(l)
                );

                if (arrived) {
                    this.pendingAdaptiveLessonId = null;
                    this.isWaitingForAdaptiveLesson = false;
                    this.adaptiveLessonTimedOut = false;
                    this.syncActiveAdaptiveLesson();
                    this.toastService.success('Your personalized lesson is ready! Click Next to continue.');
                    return;
                }

                // Ollama can take up to 6 minutes on slow hardware — poll every 5s for 72 attempts (6 min).
                if (attempt < 72 && this.pendingAdaptiveLessonId === targetLessonId) {
                    window.setTimeout(() => this.ensureAdaptiveLessonReady(attempt + 1, pollToken), 5000);
                    return;
                }

                // Timed out — show retry UI but KEEP Next locked until content arrives.
                this.isWaitingForAdaptiveLesson = false;
                if (this.pendingAdaptiveLessonId === targetLessonId) {
                    this.adaptiveLessonTimedOut = true;  // keeps Next locked, shows retry UI
                    this.toastService.warning('AI lesson is still being prepared. Use "Retry Generation" to try again.');
                }
            },
            error: (err) => {
                console.error('Error polling for adaptive lesson', err);
                if (pollToken !== this.adaptiveLessonPollToken) return;

                if (err?.status === 429 || err?.status === 503) {
                    this.aiGenerationError = err?.error?.detail || 'Ollama is busy. Use "Retry Generation" to try again.';
                    this.isWaitingForAdaptiveLesson = false;
                    this.adaptiveLessonTimedOut = true;  // keep Next locked, show retry
                    this.toastService.error(this.aiGenerationError!);
                    return;
                }

                if (attempt < 72 && this.pendingAdaptiveLessonId === targetLessonId) {
                    window.setTimeout(() => this.ensureAdaptiveLessonReady(attempt + 1, pollToken), 5000);
                    return;
                }
                // Final fallback — show retry UI, keep Next locked.
                this.isWaitingForAdaptiveLesson = false;
                this.adaptiveLessonTimedOut = true;
            }
        });
    }

    /**
     * Re-triggers adaptive lesson generation + polling when it timed out or errored.
     * - Lesson 1 (base): resets the guard so ensureBaseLessonContent can POST again to Ollama.
     * - Lesson 2+ (adaptive): calls the generate-lesson endpoint again with the latest quiz score,
     *   then polls. Simply re-polling is not enough when Ollama failed silently on the backend.
     */
    retryAdaptiveLesson() {
        if (this.isWaitingForAdaptiveLesson || this.isGeneratingAiLesson) return;

        this.adaptiveLessonTimedOut = false;
        this.aiGenerationError = null;

        if (this.shouldGenerateBaseLesson(this.activeLesson)) {
            // Lesson 1 base content retry — reset guard and re-trigger generation.
            this.generatingBaseLessonForId = null;
            // Also reset rate-limit flag so the retry can proceed.
            const lessonId = this.getLessonId(this.activeLesson);
            if (lessonId) this.rateLimitedBaseLessonIds.delete(lessonId);
            this.ensureBaseLessonContent();
            return;
        }

        // Lesson 2+ adaptive content — re-trigger backend generation, then poll.
        // Use pendingAdaptiveLessonId (the NEXT lesson) when already set;
        // fall back to activeLesson only when no pending target exists.
        const targetLessonId = this.pendingAdaptiveLessonId || this.getLessonId(this.activeLesson);
        if (!targetLessonId) return;

        if (!this.pendingAdaptiveLessonId) {
            this.pendingAdaptiveLessonId = targetLessonId;
        }
        this.isWaitingForAdaptiveLesson = true;

        // Re-trigger generation on the backend (in case the previous Ollama call
        // failed silently). The backend is idempotent — if the lesson already
        // exists and is valid it returns it immediately without re-generating.
        this.triggerAdaptiveLessonReady(targetLessonId, () => {
            // On success or if generation is already in-progress, start polling.
            this.adaptiveLessonPollToken += 1;
            const token = this.adaptiveLessonPollToken;
            window.setTimeout(() => this.ensureAdaptiveLessonReady(0, token), 3000);
        });
    }

    /**
     * POSTs to the generate-lesson endpoint to ask the backend to (re)generate
     * adaptive content for lessonId. On success or network error, calls onTriggered
     * so polling can start regardless.
     *
     * NOTE: triggerAdaptiveLessonReady is the renamed entry point used by
     * retryAdaptiveLesson to ensure the correct (next) lesson ID is used.
     */
    private triggerAdaptiveLessonReady(lessonId: string, onTriggered: () => void) {
        this.triggerAdaptiveLessonGeneration(lessonId, onTriggered);
    }

    private triggerAdaptiveLessonGeneration(lessonId: string, onTriggered: () => void) {
        const lesson = this.allLessons.find(l => this.getLessonId(l) === lessonId);
        if (!lesson) { onTriggered(); return; }

        // Fall back to the lesson title when no teacher description is set.
        // This ensures the POST to generate-lesson always fires — never skip
        // generation just because the lesson description field is empty.
        const sourceContent = this.getTeacherLessonSource(lesson) || lesson.title || 'General lesson review';

        const quizForLesson = this.findGeneratedQuizForLesson(this.getLessonId(this.activeLesson!));
        const quizId = quizForLesson?.id || null;

        this.adaptiveService.generateAiLesson(
            this.courseId,
            lessonId,
            quizId,
            lesson.title || 'Lesson',
            sourceContent,
            this.progress,
            [],
            this.quizScore
        ).subscribe({
            next: (generatedLesson: AdaptiveLesson) => {
                // If lesson arrived synchronously (cached), upsert and sync immediately.
                this.upsertAiGeneratedLesson(generatedLesson);
                this.syncActiveAdaptiveLesson();
                if (this.activeAdaptiveLesson) {
                    this.pendingAdaptiveLessonId = null;
                    this.isWaitingForAdaptiveLesson = false;
                    this.adaptiveLessonTimedOut = false;
                    this.toastService.success('Your personalized lesson is ready! Click Next to continue.');
                    return;
                }
                onTriggered();
            },
            error: () => {
                // Even if this call errors, start polling — Ollama may still be running.
                onTriggered();
            }
        });
    }

    private cancelPendingRefreshTimers() {
        if (this.refreshQuizTimerId !== null) {
            clearTimeout(this.refreshQuizTimerId);
            this.refreshQuizTimerId = null;
        }
        if (this.refreshLessonsTimerId !== null) {
            clearTimeout(this.refreshLessonsTimerId);
            this.refreshLessonsTimerId = null;
        }
    }

    scheduleAdaptiveRefresh() {
        // Cancel any previously scheduled refresh to avoid stacking timers.
        this.cancelPendingRefreshTimers();

        // Refresh quiz list so newly generated quizzes appear immediately.
        this.refreshQuizTimerId = setTimeout(() => {
            this.refreshQuizTimerId = null;
            this.loadStudentQuizzes();
        }, 3000);

        // NOTE: We intentionally do NOT call loadAiGeneratedLessons() here.
        // That method calls ensureBaseLessonContent() which can fire an
        // additional Gemini API call.  The adaptive lesson list is already
        // refreshed by ensureAdaptiveLessonReady() polling after quiz
        // submission, so this extra refresh was purely redundant and was
        // a major source of wasted API quota.
    }

    getDisplayedLessonTitle(): string {
        return this.activeAdaptiveLesson?.title || this.activeLesson?.title || '';
    }

    getActiveLessonId(): string {
        return this.getLessonId(this.activeLesson);
    }

    isLessonCompleted(lessonId: string): boolean {
        return this.progress?.completedLessons.includes(lessonId) || false;
    }

    /** Track whether a mark-complete request is currently in-flight. */
    isMarkingComplete: boolean = false;
    /**
     * True once the quiz has appeared on screen for this lesson.
     * Until this is true, "Mark Complete" stays visible so the student can
     * re-trigger quiz generation if the first attempt fails.
     */
    quizEverSeen: boolean = false;

    markComplete() {
        if (!this.activeLesson) return;
        const lessonId = this.getLessonId(this.activeLesson);
        const tenantId = this.course?.tenantId;

        if (!lessonId) return;

        // Prevent double-click (in-flight guard only — NOT a completed guard).
        // The backend handles idempotency: if the lesson is already completed
        // but no valid quiz exists, it will generate one. So we allow this call
        // even when the lesson is already marked complete.
        if (this.isMarkingComplete) return;

        this.isMarkingComplete = true;

        this.progressService.markLessonComplete(this.courseId, lessonId, tenantId).subscribe({
            next: (updatedProgress) => {
                this.progress = updatedProgress;
                this.isMarkingComplete = false;

                // Lesson is now being completed fresh in this session —
                // clear the revisit flag so the quiz takes full focus.
                this.isRevisitingCompletedLesson = false;

                if (this.activeLesson?.type !== 'quiz') {
                    this.toastService.info('Preparing your lesson quiz...');
                    this.loadingQuiz = true;
                    this.isPollingForQuiz = true;
                    this.quizSubmitted = false;
                    this.loadStudentQuizzes(lessonId);
                }

                this.scheduleAdaptiveRefresh();
            },
            error: (err) => {
                console.error('Error marking completion', err);
                this.isMarkingComplete = false;
            }
        });
    }

    /**
     * Called when a student clicks "Mark Complete" after the lesson is already complete
     * but the quiz never appeared (e.g. it failed to generate on the first attempt).
     *
     * Calls mark-complete on the backend AGAIN — the backend will detect that
     * no valid quiz exists for this lesson and trigger a fresh Ollama generation.
     * Once the backend responds, polling starts to wait for the new quiz.
     */
    retriggerQuizForLesson() {
        if (!this.activeLesson || this.isPollingForQuiz || this.activeQuiz || this.isMarkingComplete) return;
        const lessonId = this.getLessonId(this.activeLesson);
        const tenantId = this.course?.tenantId;
        if (!lessonId) return;

        this.aiQuizError = null;
        this.isMarkingComplete = true;
        this.toastService.info('Requesting quiz generation...');

        // Re-call mark-complete — backend is now idempotent: it checks if a valid
        // quiz already exists and generates one if not, even for already-completed lessons.
        this.progressService.markLessonComplete(this.courseId, lessonId, tenantId).subscribe({
            next: () => {
                this.isMarkingComplete = false;
                this.isPollingForQuiz = true;
                this.loadingQuiz = true;
                this.loadStudentQuizzes(lessonId, 0);
            },
            error: (err) => {
                this.isMarkingComplete = false;
                this.aiQuizError = 'Could not contact the server. Please try again.';
                console.error('Error retriggering quiz:', err);
            }
        });
    }

    /**
     * Unified handler for the "Mark Complete" button.
     *
     * - Lesson NOT yet complete → call markComplete() normally (first-time flow).
     * - Lesson IS complete but quiz never appeared → call retriggerQuizForLesson()
     *   so the student can recover from a failed generation without being stuck.
     *
     * The button hides entirely once quizEverSeen = true (quiz appeared on screen).
     */
    markCompleteOrRetrigger() {
        if (!this.activeLesson) return;
        const lessonId = this.getLessonId(this.activeLesson);

        if (this.isLessonCompleted(lessonId)) {
            // Lesson already marked complete — re-trigger quiz generation.
            this.retriggerQuizForLesson();
        } else {
            // First time — normal mark-complete flow.
            this.markComplete();
        }
    }

    /**
     * True while the "Mark Complete / Request Quiz" button should be visible.
     *
     * Rules:
     *  - Always hide for quiz-type lessons (they have their own complete button).
     *  - Show until the quiz has been seen on screen for the first time (quizEverSeen).
     *  - Hide once the quiz appeared — Retry handles re-attempts from that point on.
     */
    get showMarkCompleteButton(): boolean {
        if (!this.activeLesson || this.activeLesson.type === 'quiz') return false;
        return !this.quizEverSeen;
    }

    /**
     * Label for the unified Mark Complete button based on current state.
     */
    get markCompleteButtonLabel(): string {
        if (!this.activeLesson) return 'Mark Complete';
        const lessonId = this.getLessonId(this.activeLesson);

        if (this.isMarkingComplete) return 'Saving...';
        if (this.isPollingForQuiz) return 'Preparing Quiz...';

        // Label for content generation state
        if (this.isGeneratingAiLesson || this.isWaitingForAdaptiveLesson) return 'Generating...';

        if (this.isLessonCompleted(lessonId)) return 'Retry Quiz Generation';
        return 'Mark Complete';
    }

    /**
     * True when the unified Mark Complete button should be disabled.
     * Prevents completion before the lesson content or quiz is ready.
     */
    get isMarkCompleteButtonDisabled(): boolean {
        // Core action guards
        if (this.isMarkingComplete || this.isPollingForQuiz) return true;

        // Content generation in progress (Lesson 1 base or Lesson 2+ adaptive)
        if (this.isGeneratingAiLesson || this.isWaitingForAdaptiveLesson) return true;

        // Content missing check — if the lesson requires AI content, it's disabled until that content arrives.
        if (this.activeLesson) {
            const needsBaseGen = this.shouldGenerateBaseLesson(this.activeLesson);
            const needsAdaptiveGen = this.shouldUseAdaptiveLessonContent(this.activeLesson);

            if ((needsBaseGen || needsAdaptiveGen) && !this.activeAdaptiveLesson) {
                return true;
            }
        }

        return false;
    }

    /**
     * Quick local update of avgQuizScore after a fresh submission so the
     * progress bar reflects the new score without waiting for a full reload.
     */
    private updateAvgQuizScoreWith(newScore: number) {
        // Count the number of quizzes that already have a recorded score.
        const scoredCount = this.studentQuizzes
            .filter((q: any) => (q.lastScore ?? q.score ?? q.percentage) !== undefined).length;
        const total = scoredCount > 0 ? scoredCount : 1;
        // Running average: add the new score as an additional data point.
        this.avgQuizScore = Math.round(
            (this.avgQuizScore * total + newScore) / (total + 1)
        );
    }

    saveNotes() {
        const storageKey = this.getCurrentLessonNotesStorageKey();
        if (!storageKey) return;
        this.isSavingNotes = true;
        this.coursePlayerStorage.saveLessonNotes(storageKey, this.userNotes);
        this.lessonNoteDrafts[storageKey] = this.userNotes;
        setTimeout(() => {
            this.isSavingNotes = false;
        }, 800);
    }

    private getLessonNotesStorageKey(lesson: CoursePlayerLesson | null): string {
        const lessonId = this.getLessonId(lesson);
        return this.coursePlayerStorage.getLessonNotesStorageKey(this.courseId, lessonId);
    }

    private getCurrentLessonNotesStorageKey(): string {
        return this.getLessonNotesStorageKey(this.activeLesson);
    }

    private persistCurrentLessonDraft() {
        const storageKey = this.getCurrentLessonNotesStorageKey();
        if (!storageKey) return;
        this.lessonNoteDrafts[storageKey] = this.userNotes;
    }

    private loadNotesForCurrentLesson() {
        const storageKey = this.getCurrentLessonNotesStorageKey();
        if (!storageKey) {
            this.userNotes = '';
            return;
        }

        if (storageKey in this.lessonNoteDrafts) {
            this.userNotes = this.lessonNoteDrafts[storageKey];
            return;
        }

        this.userNotes = this.coursePlayerStorage.loadLessonNotes(storageKey);
    }

    sendChatMessage() {
        if (!this.chatInput.trim()) return;

        // 🛑 Auto-stop previous request if it's still running
        if (this.isSendingChat && this.chatSubscription) {
            this.chatSubscription.unsubscribe();
            this.isSendingChat = false;
            // Optionally add a system message that the previous was cancelled
            this.chatMessages.push({ sender: 'AI', text: '_Previous request cancelled._', time: new Date() });
        }

        const userMsg: ChatMessage = { sender: 'Student', text: this.chatInput, time: new Date() };
        this.chatMessages.push(userMsg);
        this.saveChatHistory(); // Persist history immediately

        const message = this.chatInput;
        this.chatInput = '';
        this.isSendingChat = true;

        const lessonId = this.activeLesson?.id || this.activeLesson?._id;

        this.chatSubscription = this.aiTutorService.sendMessage(message, this.courseId, lessonId).subscribe({
            next: (response: AiTutorMessageResponse) => {
                this.chatMessages.push({
                    sender: 'AI',
                    text: response.response || response.reply || response.message || response.content || "I couldn't generate a response.",
                    time: new Date()
                });
                this.isSendingChat = false;
                this.saveChatHistory(); // Persist the AI's answer
            },
            error: (err: any) => {
                console.error('AI Tutor error:', err);
                let errorMessage = 'Sorry, I encountered an error. Please try again later.';
                
                if (err?.status === 429) {
                    errorMessage = 'Try again later, our servers are busy.';
                } else if (err?.status === 503 || err?.status === 504) {
                    errorMessage = 'Try again later, our servers are busy.';
                }

                this.chatMessages.push({
                    sender: 'AI',
                    text: errorMessage,
                    time: new Date()
                });
                this.isSendingChat = false;
                this.saveChatHistory();
                
                if (err?.status === 429) {
                    this.toastService.warning(err?.error?.detail || 'Ollama is busy. Try again shortly.');
                }
            }
        });
    }

    private getChatHistoryStorageKey(): string {
        const lessonId = this.getActiveLessonId() || 'general';
        return `eduverse_chat_${this.courseId}_${lessonId}`;
    }

    private saveChatHistory() {
        try {
            const key = this.getChatHistoryStorageKey();
            localStorage.setItem(key, JSON.stringify(this.chatMessages));
        } catch (e) {
            console.error('Failed to save chat history', e);
        }
    }

    private loadChatHistory() {
        try {
            const key = this.getChatHistoryStorageKey();
            const saved = localStorage.getItem(key);
            if (saved) {
                this.chatMessages = JSON.parse(saved);
                // Convert back string dates to Date objects if needed (though not strictly required for template)
                this.chatMessages.forEach(m => m.time = new Date(m.time));
            } else {
                // Default welcome message if no history
                this.chatMessages = [
                    { sender: 'AI', text: 'Hello! I am your AI study assistant. How can I help you with this course today?', time: new Date() }
                ];
            }
        } catch (e) {
            this.chatMessages = [
                { sender: 'AI', text: 'Hello! I am your AI study assistant. How can I help you with this course today?', time: new Date() }
            ];
        }
    }

    nextLesson() {
        if (this.isNextLessonLocked()) {
            return;
        }
        const currentIndex = this.allLessons.findIndex(l => this.lessonsMatch(l, this.activeLesson));
        if (currentIndex !== -1 && currentIndex < this.allLessons.length - 1) {
            const next = this.allLessons[currentIndex + 1];
            this.selectLesson(next, next.moduleIndex ?? 0);
        }
    }

    isSidebarLessonLocked(lesson: CoursePlayerLesson): boolean {
        const targetIndex = this.allLessons.findIndex(l => this.lessonsMatch(l, lesson));
        if (targetIndex <= 0) return false;

        const prevLesson = this.allLessons[targetIndex - 1];
        const prevLessonId = this.getLessonId(prevLesson);
        if (!prevLessonId) return true;

        if (!this.isLessonCompleted(prevLessonId)) return true;

        if (prevLesson.type === 'quiz') return false;

        const prevQuiz = this.findGeneratedQuizForLesson(prevLessonId);
        if (!prevQuiz || !this.studentSubmissions.has(prevQuiz.id)) {
            return true;
        }

        return false;
    }

    previousLesson() {
        const currentIndex = this.allLessons.findIndex(l => this.lessonsMatch(l, this.activeLesson));
        if (currentIndex > 0) {
            const prev = this.allLessons[currentIndex - 1];
            this.selectLesson(prev, prev.moduleIndex ?? 0);
        }
    }

    hasNextLesson(): boolean {
        const currentIndex = this.allLessons.findIndex(l => this.lessonsMatch(l, this.activeLesson));
        return currentIndex !== -1 && currentIndex < this.allLessons.length - 1;
    }

    isNextLessonLocked(): boolean {
        const activeLessonId = this.getActiveLessonId();
        const isCurrentLessonCompleted = activeLessonId ? this.isLessonCompleted(activeLessonId) : false;

        // Core rule: lesson must be complete AND quiz must be submitted.
        // If we are actively polling for the quiz to be generated, keep it locked.
        if (!isCurrentLessonCompleted || this.loadingQuiz || this.submittingQuiz || this.isPollingForQuiz) {
            return true;
        }
        // Every lesson requires its corresponding quiz to be submitted before moving forward.
        // If the AI quiz failed to generate (activeQuiz is null), they still cannot proceed
        // until they use the "Retry Quiz Generation" button and submit it.
        if (!this.quizSubmitted) {
            return true;
        }

        // Block if next lesson's adaptive content is still generating or waiting.
        // isWaitingForAdaptiveLesson covers the window between quiz submit and
        // the first poll response, before pendingAdaptiveLessonId is resolved.
        if (this.isWaitingForAdaptiveLesson) {
            return true;
        }

        const nextLesson = this.getNextLearningLesson(this.activeLesson);
        if (nextLesson && this.shouldUseAdaptiveLessonContent(nextLesson)) {
            const nextId = this.getLessonId(nextLesson);

            // Check whether valid adaptive content already exists for the next lesson.
            const nextLessonReady = !!this.aiGeneratedLessons.find(
                (l) => (l.lessonId === nextId || l.sourceTopic === nextLesson.title)
                    && l.generationType !== 'base' && hasValidContent(l)
            );

            if (nextLessonReady) {
                // Content arrived — but also verify the rendered text is non-empty.
                // This prevents the button unlocking while markdown is still being parsed.
                if (!this.renderedAdaptiveLessonContent?.trim()) return true;
                return false;  // Content ready and rendered — allow navigation.
            }

            // Still actively polling.
            if (this.pendingAdaptiveLessonId === nextId) return true;

            // Polling timed out — keep locked until student retries and content arrives.
            if (this.adaptiveLessonTimedOut) return true;

            // Quiz was just submitted and generation is queued but pendingAdaptiveLessonId
            // may not be set yet — keep locked if we know content doesn't exist.
            if (this.quizSubmitted && !nextLessonReady) return true;
        }

        return false;
    }

    /**
     * Determines whether the quiz score chip should be shown at the bottom.
     *
     * Rule: once the quiz is submitted, keep the score chip visible for the
     * rest of this lesson visit so students always see their result.
     * The quiz FORM itself disappears via `!quizSubmitted` in the template —
     * the chip is a separate, persistent summary that does NOT affect the lesson.
     */
    get shouldShowQuizScoreChip(): boolean {
        // Never show if no quiz was submitted this session.
        if (!this.quizSubmitted || !this.activeQuiz) return false;
        // Always show once submitted — student navigating away resets quizSubmitted.
        return true;
    }

    hasPreviousLesson(): boolean {
        const currentIndex = this.allLessons.findIndex(l => this.lessonsMatch(l, this.activeLesson));
        return currentIndex > 0;
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
        this.persistPlayerPreferences();
    }

    toggleAiAssistant() {
        this.isAiAssistantOpen = !this.isAiAssistantOpen;
        this.persistPlayerPreferences();
    }

    startAiAssistantResize(event: MouseEvent) {
        event.preventDefault();
        if (!this.isAiAssistantOpen || this.isCompactViewport) {
            return;
        }

        this.isResizingAiAssistant = true;
        document.body.classList.add('select-none', 'cursor-col-resize');
        window.addEventListener('mousemove', this.handleAiAssistantResize);
        window.addEventListener('mouseup', this.stopAiAssistantResize);
    }

    goBack() {
        this.router.navigate(['/student/courses']);
    }
}
