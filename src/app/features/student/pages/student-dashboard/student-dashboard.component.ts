import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { NotificationsComponent, PendingTaskItem } from '../../components/notifications/notifications.component';
import { ProgressSnapshotComponent } from '../../components/progress-snapshot/progress-snapshot.component';
import { ContinueLearningComponent } from '../../components/continue-learning/continue-learning.component';
import { CoursesCardComponent, Course } from '../../components/courses-card/courses-card.component';
import { CommonModule } from '@angular/common';
import { CourseService } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { QuizService } from '../../../teacher/services/quiz.service';
import { QuizSubmissionService } from '../../services/quiz-submission.service';
import { AssignmentService } from '../../../../shared/services/assignment.service';
import { forkJoin } from 'rxjs';
import { StudentProgressService, CourseProgress } from '../../services/student-progress.service';
import { ContinueCourse } from '../../components/continue-learning/continue-learning.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    StatCardComponent,
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
      bgColor: 'bg-blue-50',
      iconBgClass: 'bg-blue-100',
      iconColorClass: 'text-blue-600',
    },
    {
      title: 'Assignments Due',
      value: '0', // TODO: Implement Assignment Service logic similar to Quizzes
      icon: 'fas fa-book-open',
      bgColor: 'bg-purple-50',
      iconBgClass: 'bg-purple-100',
      iconColorClass: 'text-purple-600',
    },
    {
      title: 'Pending Quizzes',
      value: '0',
      icon: 'fas fa-chalkboard-teacher',
      bgColor: 'bg-orange-50',
      iconBgClass: 'bg-orange-100',
      iconColorClass: 'text-orange-600',
    },
  ];

  overallProgress: number = 0;
  pendingTasks: PendingTaskItem[] = [];
  continueCourses: ContinueCourse[] = [];
  recommendations: Course[] = []; // Initially empty

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private quizService: QuizService,
    private submissionService: QuizSubmissionService,
    private assignmentService: AssignmentService,
    private progressService: StudentProgressService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  // UPDATED: New method to load dashboard data from backend with proper types
  loadDashboardData() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId() || '';

    if (user) {
      // Use studentId if available, otherwise fallback to user.id (though backend expects studentId)
      const studentId = user.studentId || user.id;

      // 1. Fetch Enrolled Courses
      this.courseService.getStudentCourses(studentId, tenantId).subscribe({
        next: (courses: any[]) => {
          this.statsCards[0].value = courses.length.toString();
        },
        error: (err: { message: string }) => console.error('Error loading enrolled courses', err)
      });

      // 2. Tasks & Deadlines Pipeline
      forkJoin({
        quizzes: this.quizService.getStudentAvailableQuizzes(),
        quizSubs: this.submissionService.getSubmissionsByStudent(studentId),
        assignmentsResp: this.assignmentService.getAssignments({ tenantId: tenantId, status: 'active' }),
        assignmentSubs: this.assignmentService.getMySubmissions()
      }).subscribe({
        next: ({ quizzes, quizSubs, assignmentsResp, assignmentSubs }) => {
          // A. Filter Quizzes
          const pendingQuizzes = quizzes.filter(q => !quizSubs.some(s => s.quizId === q.id));
          this.statsCards[2].value = pendingQuizzes.length.toString();

          // B. Filter Assignments
          const assignments = assignmentsResp.data || [];
          const pendingAssignments = assignments.filter(a => !assignmentSubs.some(s => s.assignmentId === a.id));
          this.statsCards[1].value = pendingAssignments.length.toString();

          // C. Build Timeline
          const combinedTasks: PendingTaskItem[] = [
            ...pendingQuizzes.map(q => ({
               id: q.id,
               type: 'quiz' as const,
               title: q.description || `Quiz ${q.quizNumber}`,
               courseName: q.courseName || 'Course Assessment',
               dueDate: new Date(q.dueDate),
               icon: 'fa-solid fa-clock',
               iconBgClass: 'bg-orange-200',
               iconColorClass: 'text-orange-600',
               bgClass: 'bg-orange-50',
               route: `/student/quizzes`
            })),
            ...pendingAssignments.map(a => ({
               id: a.id,
               type: 'assignment' as const,
               title: a.title,
               courseName: a.courseName || 'Course Assignment',
               dueDate: new Date(a.dueDate),
               icon: 'fa-solid fa-book-open',
               iconBgClass: 'bg-purple-200',
               iconColorClass: 'text-purple-600',
               bgClass: 'bg-purple-50',
               route: `/student/assignments`
            }))
          ];

          // Sort by Due Date ascending (soonest first)
          combinedTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

          this.pendingTasks = combinedTasks.slice(0, 4);
        },
        error: (err) => console.error('Error loading tasks pipeline', err)
      });

      // 4. Fetch Dashboard Widgets Data (Courses, Progress, Recommendations)
      forkJoin({
        enrolled: this.courseService.getStudentCourses(studentId, tenantId),
        progress: this.progressService.getAllProgress(tenantId),
        allCourses: this.courseService.getCourses(tenantId)
      }).subscribe({
        next: ({ enrolled, progress, allCourses }) => {
          // A. Calculate Progress Snapshot
          if (progress.length > 0) {
            const totalProgress = progress.reduce((sum: number, p: CourseProgress) => sum + p.progressPercentage, 0);
            this.overallProgress = Math.round(totalProgress / progress.length);
          }

          // B. Continue Learning (Top 2 Active Courses)
          const progressMap = new Map<string, CourseProgress>(progress.map((p: CourseProgress) => [p.courseId, p]));
          const activeCourses = enrolled.map((c: any) => {
            const p = progressMap.get(c._id);
            return {
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
}

interface StatCard {
  title: string;
  value: string;
  icon: string;
  bgColor: string;
  iconBgClass: string;
  iconColorClass: string;
}
