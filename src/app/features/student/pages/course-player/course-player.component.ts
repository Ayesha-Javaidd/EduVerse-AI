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
    private generatingBaseLessonForId: string | null = null;
    private pendingAdaptiveLessonId: string | null = null;
    private adaptiveLessonPollToken: number = 0;

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
        this.adaptiveService.getStudentLessons(this.courseId).subscribe({
            next: (lessons: AdaptiveLesson[]) => {
                this.aiGeneratedLessons = lessons;
                this.syncActiveAdaptiveLesson();
                if (this.activeAdaptiveLesson && this.pendingAdaptiveLessonId === this.getLessonId(this.activeLesson)) {
                    this.pendingAdaptiveLessonId = null;
                    this.isWaitingForAdaptiveLesson = false;
                }
            },
            error: (err) => console.error('Error loading AI lessons', err)
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
                        this.toastService.success('Your lesson quiz is ready.');
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
                        this.toastService.warning('Quiz generation is taking longer than expected. Please refresh in a few moments.');
                    }
                }
            },
            error: (err) => {
                console.error('Error loading student quizzes', err);
                if (showQuizForLessonId && attempt < 10) {
                    window.setTimeout(() => this.loadStudentQuizzes(showQuizForLessonId, attempt + 1), 2500);
                } else {
                    this.loadingQuiz = false;
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
        this.ensureBaseLessonContent();
        this.ensureAdaptiveLessonReady();

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
                const nextLesson = this.getNextLearningLesson(this.activeLesson);
                this.pendingAdaptiveLessonId = nextLesson ? this.getLessonId(nextLesson) : null;

                if (
                    this.activeLesson?.type === 'quiz' &&
                    this.quizScore >= 70 &&
                    !this.isLessonCompleted(this.getLessonId(this.activeLesson))
                ) {
                    this.markComplete();
                } else {
                    this.scheduleAdaptiveRefresh();
                }

                this.toastService.success(`Quiz submitted successfully. Score: ${this.quizScore}%`);
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

    get personalizedLessons(): AdaptiveLesson[] {
        return this.aiGeneratedLessons.filter((lesson) => lesson?.generationType !== 'base');
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

    get hasPersonalizedLessons(): boolean {
        return this.personalizedLessons.length > 0;
    }

    getNextLearningLesson(afterLesson: CoursePlayerLesson | null): CoursePlayerLesson | null {
        return getNextLearningLesson(this.allLessons, afterLesson);
    }

    findGeneratedQuizForLesson(lessonId: string): Quiz | null {
        return findGeneratedQuizForLesson(lessonId, this.studentQuizzes, this.courseId);
    }

    applyQuiz(quiz: Quiz) {
        this.activeQuiz = quiz;
        this.quizAnswers = new Array(quiz.questions.length).fill('');
        this.loadingQuiz = false;
    }

    openPersonalizedLesson(aiLesson: AdaptiveLesson) {
        const matchingLesson =
            this.allLessons.find((lesson) => this.getLessonId(lesson) === aiLesson.lessonId) ||
            this.allLessons.find((lesson) => lesson.title === aiLesson.sourceTopic);

        if (!matchingLesson) {
            this.toastService.warning('This personalized lesson is not linked to a course lesson yet.');
            return;
        }

        this.selectLesson(matchingLesson, matchingLesson.moduleIndex ?? 0);
        this.activeAdaptiveLesson = aiLesson;
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
            },
            error: (err) => {
                console.error('Error generating base lesson:', err);
                this.generatingBaseLessonForId = null;
                this.isGeneratingAiLesson = false;
                this.toastService.warning('Showing the teacher lesson content for now. AI lesson generation can be retried shortly.');
            }
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

    ensureAdaptiveLessonReady(attempt: number = 0, pollToken?: number) {
        if (!this.activeLesson || !this.shouldWaitForAdaptiveLesson(this.activeLesson)) {
            this.isWaitingForAdaptiveLesson = false;
            return;
        }

        const lessonId = this.getLessonId(this.activeLesson);

        if (pollToken === undefined) {
            this.adaptiveLessonPollToken += 1;
            pollToken = this.adaptiveLessonPollToken;
        }

        this.isWaitingForAdaptiveLesson = true;

        this.adaptiveService.getStudentLessons(this.courseId).subscribe({
            next: (lessons: AdaptiveLesson[]) => {
                if (pollToken !== this.adaptiveLessonPollToken) {
                    return;
                }

                this.aiGeneratedLessons = lessons;
                this.syncActiveAdaptiveLesson();

                if (this.activeAdaptiveLesson && this.getLessonId(this.activeLesson) === lessonId) {
                    this.pendingAdaptiveLessonId = null;
                    this.isWaitingForAdaptiveLesson = false;
                    return;
                }

                if (attempt < 12 && this.pendingAdaptiveLessonId === lessonId && this.getLessonId(this.activeLesson) === lessonId) {
                    window.setTimeout(() => this.ensureAdaptiveLessonReady(attempt + 1, pollToken), 2500);
                    return;
                }

                this.isWaitingForAdaptiveLesson = false;
                if (this.pendingAdaptiveLessonId === lessonId) {
                    this.toastService.warning('Personalized lesson is taking longer than expected. Please refresh in a few moments.');
                }
            },
            error: (err) => {
                console.error('Error waiting for adaptive lesson', err);

                if (pollToken !== this.adaptiveLessonPollToken) {
                    return;
                }

                if (attempt < 12 && this.pendingAdaptiveLessonId === lessonId && this.getLessonId(this.activeLesson) === lessonId) {
                    window.setTimeout(() => this.ensureAdaptiveLessonReady(attempt + 1, pollToken), 2500);
                    return;
                }

                this.isWaitingForAdaptiveLesson = false;
            }
        });
    }

    scheduleAdaptiveRefresh() {
        window.setTimeout(() => this.loadAiGeneratedLessons(), 3000);
        window.setTimeout(() => this.loadAiGeneratedLessons(), 18000);
        window.setTimeout(() => this.loadStudentQuizzes(), 3000);
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
            error: (err: unknown) => {
                console.error('AI Tutor error:', err);
                this.chatMessages.push({
                    sender: 'AI',
                    text: 'Sorry, I encountered an error. Please try again later.',
                    time: new Date()
                });
                this.isSendingChat = false;
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
        return this.loadingQuiz || this.submittingQuiz || Boolean(this.activeQuiz && !(this.quizSubmitted && this.quizScore >= 70));
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
