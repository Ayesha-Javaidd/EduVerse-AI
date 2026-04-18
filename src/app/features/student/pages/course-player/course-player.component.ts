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
    isFirstCourseLesson,
    lessonsMatch,
    selectMatchingAdaptiveLesson,
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

    // Adaptive Flow
    isGeneratingAiLesson: boolean = false;
    isWaitingForAdaptiveLesson: boolean = false;
    aiGeneratedLessons: AdaptiveLesson[] = [];
    studentQuizzes: Quiz[] = [];
    activeAdaptiveLesson: AdaptiveLesson | null = null;
    private aiLessonsLoaded: boolean = false;
    private generatingBaseLessonForId: string | null = null;
    private generatingAdaptiveLessonForId: string | null = null;
    private pendingAdaptiveLessonId: string | null = null;
    private adaptiveLessonPollToken: number = 0;
    aiGenerationError: string | null = null;
    aiQuizError: string | null = null;
    private isAiLessonsLoading: boolean = false;

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
        this.stopAiAssistantResize();
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
        this.courseService.getCourseById(this.courseId).subscribe({
            next: (course) => {
                this.course = course;
                this.flattenLessons();
                this.loadProgress(course?.tenantId);
                this.loadAiGeneratedLessons();
                this.loadStudentQuizzes();
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
                    const nextLesson =
                        this.allLessons.find((lesson) => !this.isLessonCompleted(this.getLessonId(lesson))) ||
                        this.allLessons[0];
                    if (nextLesson) {
                        this.selectLesson(nextLesson, nextLesson.moduleIndex ?? 0);
                    }
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading progress', err);
                this.loading = false;
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
                const currentLessonId = this.activeLesson ? this.getLessonId(this.activeLesson) : null;
                if (currentLessonId && !showQuizForLessonId) {
                    const generatedQuiz = this.findGeneratedQuizForLesson(currentLessonId);
                    if (generatedQuiz && !this.activeQuiz) {
                        this.applyQuiz(generatedQuiz);
                    }
                }
                if (showQuizForLessonId) {
                    const generatedQuiz = this.findGeneratedQuizForLesson(showQuizForLessonId);
                    if (generatedQuiz) {
                        this.applyQuiz(generatedQuiz);
                        this.toastService.success('Your lesson quiz is ready.');
                    } else if (attempt < 10) {
                        window.setTimeout(() => this.loadStudentQuizzes(showQuizForLessonId, attempt + 1), 2500);
                    } else {
                        this.loadingQuiz = false;
                        this.aiQuizError = 'AI limit reached. Cannot generate quiz for now.';
                        this.toastService.error('AI limit reached. Cannot generate quiz for now.');
                    }
                }
            },
            error: (err) => {
                console.error('Error loading student quizzes', err);
                if (showQuizForLessonId && attempt < 10) {
                    window.setTimeout(() => this.loadStudentQuizzes(showQuizForLessonId, attempt + 1), 2500);
                } else {
                    this.loadingQuiz = false;
                    this.aiQuizError = 'AI limit reached. Cannot generate quiz for now.';
                    this.toastService.error('AI limit reached. Cannot generate quiz for now.');
                }
            }
        });
    }

    selectLesson(lesson: CoursePlayerLesson, moduleIndex: number) {
        this.persistCurrentLessonDraft();
        this.activeLesson = lesson;
        this.activeModuleIndex = moduleIndex;
        this.quizSubmitted = false;
        this.activeQuiz = null;
        this.quizAnswers = [];
        this.loadingQuiz = true;
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

        // Reset error state
        this.aiGenerationError = null;
        this.aiQuizError = null;
    }

    loadQuiz(quizId: string) {
        this.loadingQuiz = true;
        this.quizService.getQuizById(quizId).subscribe({
            next: (quiz) => {
                this.applyQuiz(quiz);
            },
            error: (err) => {
                console.error('Error loading quiz:', err);
                this.loadingQuiz = false;
                this.aiQuizError = 'AI limit reached. Cannot generate quiz for now.';
                this.toastService.error('AI limit reached. Cannot generate quiz for now.');
            }
        });
    }

    loadQuizForLesson(lesson: CoursePlayerLesson) {
        const lessonId = this.getLessonId(lesson);
        let quizId = null;

        if (lesson.type === 'quiz' && lesson.content) {
            quizId = lesson.content;
        } else {
            const generatedQuiz = this.findGeneratedQuizForLesson(lessonId);
            if (generatedQuiz) {
                quizId = generatedQuiz.id;
            }
        }

        if (quizId) {
            this.loadQuiz(quizId);
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

                // After quiz submission, the backend generates the next lesson
                // in the background based on the quiz score. Start polling for it.
                const nextLesson = this.getNextLearningLesson(this.activeLesson);
                if (nextLesson && this.shouldUseAdaptiveLessonContent(nextLesson)) {
                    this.pendingAdaptiveLessonId = this.getLessonId(nextLesson);
                    this.isWaitingForAdaptiveLesson = true;
                    // 3s delay so backend has time to start generating before first poll.
                    window.setTimeout(() => this.ensureAdaptiveLessonReady(0), 3000);
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
        return this.progress?.progressPercentage || 0;
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
        this.activeQuiz = quiz;
        this.quizAnswers = new Array(quiz.questions.length).fill('');
        this.loadingQuiz = false;
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
        if (!lessonId || this.activeAdaptiveLesson || this.generatingBaseLessonForId === lessonId) {
            return;
        }

        const sourceContent = this.getTeacherLessonSource(this.activeLesson);
        if (!sourceContent) {
            return;
        }

        this.generatingBaseLessonForId = lessonId;
        this.isGeneratingAiLesson = true;

        this.adaptiveService.generateBaseLesson(
            this.courseId,
            lessonId,
            this.activeLesson.title || 'Lesson 1',
            sourceContent
        ).subscribe({
            next: (generatedLesson) => {
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
                
                if (err?.status === 429) {
                    this.aiGenerationError = 'Try again later, our servers are busy.';
                    this.toastService.error('AI limit reached. Please try again later.');
                } else {
                    this.toastService.warning('AI lesson generation failed. Please try again later.');
                }
            }
        });
    }

    // REMOVED: ensureAdaptiveLessonContent() was calling POST /adaptive/generate-lesson
    // from the frontend on every lesson navigation, wasting API quota and causing duplicates.
    // Adaptive lessons for Lesson 2+ are ONLY generated by the backend after quiz submission.
    // The frontend's job is only to poll for what the backend already produced.

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
     * Called once after quiz submission (with a 3s delay to give backend time).
     * Retries every 5s for up to 24 attempts (~2 minutes total).
     * Cancels automatically if the student navigates away (pollToken mismatch).
     */
    ensureAdaptiveLessonReady(attempt: number = 0, pollToken?: number) {
        // Guard: only poll when we're waiting for a specific pending lesson.
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
                // Stale poll — a new poll cycle was started, ignore this result.
                if (pollToken !== this.adaptiveLessonPollToken) return;

                this.aiGeneratedLessons = lessons;
                this.syncActiveAdaptiveLesson();

                // Check if the specific pending lesson now has content.
                const arrived = lessons.find(
                    (l) => (l.lessonId === targetLessonId || l.sourceTopic === this.getNextLearningLesson(this.activeLesson)?.title)
                        && l.generationType !== 'base'
                        && Boolean((l.content || '').trim())
                );

                if (arrived) {
                    this.pendingAdaptiveLessonId = null;
                    this.isWaitingForAdaptiveLesson = false;
                    this.toastService.success('Your personalized lesson is ready! Click Next to continue.');
                    return;
                }

                // Keep retrying up to 24 attempts (~2 minutes).
                if (attempt < 24 && this.pendingAdaptiveLessonId === targetLessonId) {
                    window.setTimeout(() => this.ensureAdaptiveLessonReady(attempt + 1, pollToken), 5000);
                    return;
                }

                // Timed out — stop spinner but keep Next locked until lesson arrives.
                this.isWaitingForAdaptiveLesson = false;
                if (this.pendingAdaptiveLessonId === targetLessonId) {
                    this.toastService.warning('Personalized lesson is taking longer than expected. Please wait a moment then refresh.');
                }
            },
            error: (err) => {
                console.error('Error polling for adaptive lesson', err);
                if (pollToken !== this.adaptiveLessonPollToken) return;

                if (err?.status === 429) {
                    this.aiGenerationError = 'Try again later, our servers are busy.';
                    this.isWaitingForAdaptiveLesson = false;
                    this.pendingAdaptiveLessonId = null;
                    this.toastService.error('AI limit reached. Please try again later.');
                    return;
                }

                if (attempt < 24 && this.pendingAdaptiveLessonId === targetLessonId) {
                    window.setTimeout(() => this.ensureAdaptiveLessonReady(attempt + 1, pollToken), 5000);
                    return;
                }
                this.isWaitingForAdaptiveLesson = false;
            }
        });
    }

    scheduleAdaptiveRefresh() {
        // Refresh quiz list so newly generated quizzes appear immediately.
        window.setTimeout(() => this.loadStudentQuizzes(), 3000);
        // Refresh generated lessons list (for sidebar display).
        window.setTimeout(() => this.loadAiGeneratedLessons(), 5000);
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

    markComplete() {
        if (!this.activeLesson) return;
        const lessonId = this.getLessonId(this.activeLesson);
        const tenantId = this.course?.tenantId;
        
        if (!lessonId) return;

        this.progressService.markLessonComplete(this.courseId, lessonId, tenantId).subscribe({
            next: (updatedProgress) => {
                this.progress = updatedProgress;

                if (this.activeLesson?.type !== 'quiz') {
                    this.toastService.info('Preparing your lesson quiz...');
                    this.loadingQuiz = true;
                    this.quizSubmitted = false;
                    this.loadStudentQuizzes(lessonId);
                }

                this.scheduleAdaptiveRefresh();
            },
            error: (err) => console.error('Error marking completion', err)
        });
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
        if (!this.chatInput.trim() || this.isSendingChat) return;

        const userMsg: ChatMessage = { sender: 'Student', text: this.chatInput, time: new Date() };
        this.chatMessages.push(userMsg);

        const message = this.chatInput;
        this.chatInput = '';
        this.isSendingChat = true;

        const lessonId = this.activeLesson?.id || this.activeLesson?._id;

        this.aiTutorService.sendMessage(message, this.courseId, lessonId).subscribe({
            next: (response: AiTutorMessageResponse) => {
                this.chatMessages.push({
                    sender: 'AI',
                    text: response.response || response.reply || response.message || response.content || "I couldn't generate a response.",
                    time: new Date()
                });
                this.isSendingChat = false;
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
                
                if (err?.status === 429) {
                    this.toastService.warning('AI limit reached.');
                }
            }
        });
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
        if (!isCurrentLessonCompleted || this.loadingQuiz || this.submittingQuiz) {
            return true;
        }
        if (this.activeQuiz && !this.quizSubmitted) {
            return true;
        }

        // Additionally: block navigation if the NEXT lesson's AI content
        // hasn't been generated yet. This enforces the adaptive flow:
        // quiz result → AI generates next lesson → student can proceed.
        if (this.pendingAdaptiveLessonId) {
            const nextLesson = this.getNextLearningLesson(this.activeLesson);
            if (nextLesson && this.getLessonId(nextLesson) === this.pendingAdaptiveLessonId) {
                return true; // Still generating, keep Next locked.
            }
        }

        return false;
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
