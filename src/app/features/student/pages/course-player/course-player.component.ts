import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { StudentProgressService, CourseProgress } from '../../services/student-progress.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { QuizService, Quiz } from '../../services/quiz.service';

interface ChatMessage {
    sender: 'AI' | 'Student';
    text: string;
    time: Date;
}

@Component({
    selector: 'app-course-player',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent],
    templateUrl: './course-player.component.html',
    styleUrls: ['./course-player.component.css']
})
export class CoursePlayerComponent implements OnInit, OnDestroy {
    courseId: string = '';
    course: BackendCourse | null = null;
    progress: CourseProgress | null = null;
    loading: boolean = true;
    activeLesson: any = null;
    activeModuleIndex: number = 0;
    allLessons: any[] = [];
    videoUrl: SafeResourceUrl | null = null;

    // Quiz State
    activeQuiz: Quiz | null = null;
    quizAnswers: string[] = [];
    quizScore: number = 0;
    quizSubmitted: boolean = false;
    loadingQuiz: boolean = false;

    // Sidebar visibility
    isSidebarOpen: boolean = true;

    // Notes
    userNotes: string = '';
    isSavingNotes: boolean = false;

    // Chat
    chatInput: string = '';
    chatMessages: ChatMessage[] = [
        { sender: 'AI', text: 'Hello! I am your AI study assistant. How can I help you with this course today?', time: new Date() }
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private courseService: CourseService,
        private authService: AuthService,
        private progressService: StudentProgressService,
        private quizService: QuizService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.courseId = params.get('id') || '';
            if (this.courseId) {
                this.loadCourseAndProgress();
            }
        });
    }

    ngOnDestroy() { }

    loadCourseAndProgress() {
        const tenantId = this.authService.getTenantId();
        if (!tenantId) return;

        // Load local notes
        const savedNotes = localStorage.getItem(`notes_${this.courseId}`);
        if (savedNotes) this.userNotes = savedNotes;

        this.courseService.getCourseById(this.courseId, tenantId).subscribe({
            next: (course) => {
                this.course = course;
                this.flattenLessons();
                this.loadProgress(tenantId);
                // Set first lesson as default
                if (course.modules?.[0]?.lessons?.[0]) {
                    this.selectLesson(course.modules[0].lessons[0], 0);
                }
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
                module.lessons.forEach((lesson: any) => {
                    this.allLessons.push({ ...lesson, moduleIndex: mIdx });
                });
            }
        });
    }

    loadProgress(tenantId: string) {
        this.progressService.getCourseProgress(this.courseId, tenantId).subscribe({
            next: (progress) => {
                this.progress = progress;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading progress', err);
                this.loading = false;
            }
        });
    }

    selectLesson(lesson: any, moduleIndex: number) {
        this.activeLesson = lesson;
        this.activeModuleIndex = moduleIndex;
        this.quizSubmitted = false;
        this.activeQuiz = null;

        console.log('Selected Lesson:', lesson.title, 'Type:', lesson.type);

        // Handle Video URL
        if (lesson.type === 'video' && lesson.content) {
            this.videoUrl = this.getSafeVideoUrl(lesson.content);
        } else {
            this.videoUrl = null;
        }

        // Handle Quiz
        if (lesson.type === 'quiz' && lesson.content) {
            this.loadQuiz(lesson.content);
        }

        // Auto-scroll to top of content
        const mainContent = document.querySelector('main');
        if (mainContent) mainContent.scrollTo(0, 0);
    }

    loadQuiz(quizId: string) {
        this.loadingQuiz = true;
        this.quizService.getQuizById(quizId).subscribe({
            next: (quiz) => {
                this.activeQuiz = quiz;
                this.quizAnswers = new Array(quiz.questions.length).fill('');
                this.loadingQuiz = false;
            },
            error: (err) => {
                console.error('Error loading quiz:', err);
                this.loadingQuiz = false;
            }
        });
    }

    submitQuiz() {
        if (!this.activeQuiz) return;

        let correctCount = 0;
        this.activeQuiz.questions.forEach((q, i) => {
            if (this.quizAnswers[i] === q.answer) {
                correctCount++;
            }
        });

        this.quizScore = Math.round((correctCount / this.activeQuiz.questions.length) * 100);
        this.quizSubmitted = true;

        if (this.quizScore >= 70) {
            // Auto complete if passed
            this.markComplete();
        }
    }

    getSafeVideoUrl(url: string): SafeResourceUrl {
        if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
        // Basic YouTube handling
        let embedUrl = url;
        if (url.includes('youtube.com/watch?v=')) {
            embedUrl = url.replace('watch?v=', 'embed/');
        } else if (url.includes('youtu.be/')) {
            embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
        }
        return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }

    // Helper to compare IDs safely
    lessonsMatch(l1: any, l2: any): boolean {
        if (!l1 || !l2) return false;
        const id1 = l1.id || l1._id;
        const id2 = l2.id || l2._id;
        return id1 === id2;
    }

    isLessonCompleted(lessonId: string): boolean {
        return this.progress?.completedLessons.includes(lessonId) || false;
    }

    markComplete() {
        if (!this.activeLesson) return;
        const lessonId = this.activeLesson.id || this.activeLesson._id;
        const tenantId = this.authService.getTenantId();
        if (!tenantId || !lessonId) return;

        this.progressService.markLessonComplete(this.courseId, lessonId, tenantId).subscribe({
            next: (updatedProgress) => {
                this.progress = updatedProgress;
            },
            error: (err) => console.error('Error marking completion', err)
        });
    }

    saveNotes() {
        this.isSavingNotes = true;
        localStorage.setItem(`notes_${this.courseId}`, this.userNotes);
        setTimeout(() => {
            this.isSavingNotes = false;
        }, 800);
    }

    sendChatMessage() {
        if (!this.chatInput.trim()) return;

        const userMsg: ChatMessage = { sender: 'Student', text: this.chatInput, time: new Date() };
        this.chatMessages.push(userMsg);

        const input = this.chatInput.toLowerCase();
        this.chatInput = '';

        // Mock AI Response
        setTimeout(() => {
            let aiResponse = "That's a great question about the current topic. How can I clarify it further for you?";
            if (input.includes('explain') || input.includes('help')) {
                aiResponse = "I'd be happy to explain this in more detail. Which specific part of " + (this.activeLesson?.title || 'the lesson') + " should we focus on?";
            }
            this.chatMessages.push({ sender: 'AI', text: aiResponse, time: new Date() });
        }, 1000);
    }

    nextLesson() {
        const currentIndex = this.allLessons.findIndex(l => this.lessonsMatch(l, this.activeLesson));
        if (currentIndex !== -1 && currentIndex < this.allLessons.length - 1) {
            const next = this.allLessons[currentIndex + 1];
            this.selectLesson(next, next.moduleIndex);
        }
    }

    previousLesson() {
        const currentIndex = this.allLessons.findIndex(l => this.lessonsMatch(l, this.activeLesson));
        if (currentIndex > 0) {
            const prev = this.allLessons[currentIndex - 1];
            this.selectLesson(prev, prev.moduleIndex);
        }
    }

    hasNextLesson(): boolean {
        const currentIndex = this.allLessons.findIndex(l => this.lessonsMatch(l, this.activeLesson));
        return currentIndex !== -1 && currentIndex < this.allLessons.length - 1;
    }

    hasPreviousLesson(): boolean {
        const currentIndex = this.allLessons.findIndex(l => this.lessonsMatch(l, this.activeLesson));
        return currentIndex > 0;
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
    }

    goBack() {
        this.router.navigate(['/student/courses']);
    }
}
