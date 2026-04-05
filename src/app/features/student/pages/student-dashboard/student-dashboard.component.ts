import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { NotificationsComponent, PendingTaskItem } from '../../components/notifications/notifications.component';
import { ProgressSnapshotComponent } from '../../components/progress-snapshot/progress-snapshot.component';
import { ContinueLearningComponent } from '../../components/continue-learning/continue-learning.component';
import { CoursesCardComponent, Course } from '../../components/courses-card/courses-card.component';
import { CommonModule } from '@angular/common';
import { CourseService } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { QuizService, Quiz } from '../../services/quiz.service';
import { QuizSubmissionService } from '../../services/quiz-submission.service';
import { forkJoin } from 'rxjs';
import { StudentProgressService, CourseProgress } from '../../services/student-progress.service';
import { ContinueCourse } from '../../components/continue-learning/continue-learning.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    StatCardComponent,
    ButtonComponent,
    NotificationsComponent,
    ProgressSnapshotComponent,
    ContinueLearningComponent,
    CoursesCardComponent,
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css',
})
export class StudentDashboardComponent implements OnInit {
  statsCards: StatCard[] = [
    {
      title: 'Courses Enrolled',
      value: '0',
      icon: 'fas fa-graduation-cap',
      bgColor: 'bg-white',
      iconBgClass: 'bg-[#ecf9f6]',
      iconColorClass: 'text-[#23A997]',
    },
    {
      title: 'Pending Quizzes',
      value: '0', // TODO: Implement Assignment Service logic similar to Quizzes
      icon: 'fas fa-clipboard-question',
      bgColor: 'bg-white',
      iconBgClass: 'bg-amber-100',
      iconColorClass: 'text-amber-600',
    },
    {
      title: 'Completed Courses',
      value: '0',
      icon: 'fas fa-circle-check',
      bgColor: 'bg-white',
      iconBgClass: 'bg-[#ecf9f6]',
      iconColorClass: 'text-[#23A997]',
    },
  ];

  overallProgress: number = 0;
  pendingTasks: PendingTaskItem[] = [];
  continueCourses: ContinueCourse[] = [];
  recommendations: Course[] = []; // Initially empty
  hasEnrolledCourses: boolean = false;

  constructor(
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private quizService: QuizService,
    private submissionService: QuizSubmissionService,
    private progressService: StudentProgressService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  private getPendingQuizTitle(quiz: Quiz): string {
    const topic = quiz.topic?.trim();
    const description = quiz.description?.trim();

    if (topic) {
      return topic;
    }

    if (description) {
      return description;
    }

    if (quiz.quizNumber !== undefined && quiz.quizNumber !== null) {
      return `Quiz ${quiz.quizNumber}`;
    }

    return 'Course Quiz';
  }

  // UPDATED: New method to load dashboard data from backend with proper types
  loadDashboardData() {
    const user = this.authService.getUser();

    if (user) {
      // Use studentId if available, otherwise fallback to user.id (though backend expects studentId)
      const studentId = user.studentId || user.id;

      // 1. Fetch Enrolled Courses
      this.courseService.getStudentCourses(studentId).subscribe({
        next: (courses: any[]) => {
          this.statsCards[0].value = courses.length.toString();
        },
        error: (err: { message: string }) => console.error('Error loading enrolled courses', err)
      });

      // 2. Tasks & Deadlines Pipeline
      forkJoin({
        quizzes: this.quizService.getMyQuizzes(),
        quizSubs: this.submissionService.getSubmissionsByStudent(studentId),
        enrolledCourses: this.courseService.getStudentCourses(studentId),
      }).subscribe({
        next: ({ quizzes, quizSubs, enrolledCourses }) => {
          const pendingQuizzes = quizzes.filter(q => !quizSubs.some(s => s.quizId === q.id));
          this.statsCards[1].value = pendingQuizzes.length.toString();

          const courseNameById = new Map<string, string>(
            enrolledCourses.map((course: any) => [
              course._id || course.id,
              course.title || course.courseName || 'Course',
            ])
          );

          const quizTasks: PendingTaskItem[] = pendingQuizzes
            .map(q => ({
              id: q.id,
              type: 'quiz' as const,
              title: this.getPendingQuizTitle(q),
              courseName: courseNameById.get(q.courseId) || 'Course',
              dueDate: new Date(q.generatedAt || Date.now()),
              icon: 'fa-solid fa-clock',
              iconBgClass: 'bg-[#ecf9f6]',
              iconColorClass: 'text-[#23A997]',
              bgClass: 'bg-white',
              route: `/student/learn/${q.courseId}`
            }))
            .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

          this.pendingTasks = quizTasks.slice(0, 4);
        },
        error: (err) => console.error('Error loading tasks pipeline', err)
      });

      // 4. Fetch Dashboard Widgets Data (Courses, Progress, Recommendations)
      forkJoin({
        enrolled: this.courseService.getStudentCourses(studentId),
        progress: this.progressService.getAllProgress(),
        allCourses: this.courseService.getCourses()
      }).subscribe({
        next: ({ enrolled, progress, allCourses }) => {
          this.hasEnrolledCourses = enrolled.length > 0;

          // A. Calculate Progress Snapshot
          if (progress.length > 0) {
            const totalProgress = progress.reduce((sum: number, p: CourseProgress) => sum + p.progressPercentage, 0);
            this.overallProgress = Math.round(totalProgress / progress.length);
          }
          this.statsCards[2].value = progress.filter((p: CourseProgress) => p.progressPercentage >= 100).length.toString();

          // B. Continue Learning (Top 2 Active Courses)
          const progressMap = new Map<string, CourseProgress>(progress.map((p: CourseProgress) => [p.courseId, p]));
          const activeCourses = enrolled.map((c: any) => {
            const p = progressMap.get(c._id);
            return {
               id: c._id,
               title: c.title,
               lesson: p ? `Completed ${p.completedLessons.length} lessons` : 'Start learning',
               progress: p ? p.progressPercentage : 0,
               lastAccessedAt: p ? new Date(p.lastAccessedAt).getTime() : 0
            };
          }).filter((c: any) => c.progress < 100);
          
          // Sort by last accessed descending
          activeCourses.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
          this.continueCourses = activeCourses.slice(0, 2);

          // C. Recommendations (Marketplace missing from Enrolled)
          const enrolledIds = new Set(enrolled.map((c: any) => c._id));
          const recommended = allCourses.filter((c: any) => !enrolledIds.has(c._id));
          
          this.recommendations = recommended.slice(0, 3).map((c: any) => ({
            id: c._id,
            title: c.title,
            description: c.description || 'Recommended for you',
            image: c.thumbnailUrl || 'assets/images/Web Development.jpeg',
            instructor: c.instructorName || 'Instructor',
            level: c.level as any || 'Beginner',
            duration: c.duration || '0h'
          }));
        },
        error: (err) => console.error('Error loading dashboard widgets', err)
      });
    }
  }

  navigateToExplore() {
    this.router.navigate(['/student/explore-courses']);
  }

  navigateToMyCourses() {
    this.router.navigate(['/student/courses']);
  }
}

interface StatCard {
  title: string;
  value: string;
  icon: string;
  bgColor: string;
  iconBgClass: string;
  iconColorClass: string;
}
