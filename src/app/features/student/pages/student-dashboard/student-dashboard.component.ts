import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { NotificationsComponent } from '../../components/notifications/notifications.component';
import { ProgressSnapshotComponent } from '../../components/progress-snapshot/progress-snapshot.component';
import { ContinueLearningComponent } from '../../components/continue-learning/continue-learning.component';
import { CoursesCardComponent, Course } from '../../components/courses-card/courses-card.component';
import { CommonModule } from '@angular/common';
import { CourseService } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { QuizService } from '../../../teacher/services/quiz.service';
import { QuizSubmissionService } from '../../services/quiz-submission.service';
import { forkJoin } from 'rxjs';

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

  recommendations: Course[] = []; // Initially empty

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private quizService: QuizService,
    private submissionService: QuizSubmissionService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  // UPDATED: New method to load dashboard data from backend with proper types
  loadDashboardData() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();

    if (user && tenantId) {
      // Use studentId if available, otherwise fallback to user.id (though backend expects studentId)
      const studentId = user.studentId || user.id;

      // 1. Fetch Enrolled Courses
      this.courseService.getStudentCourses(studentId, tenantId).subscribe({
        next: (courses: any[]) => {
          this.statsCards[0].value = courses.length.toString().padStart(2, '0');
        },
        error: (err: { message: string }) => console.error('Error loading enrolled courses', err)
      });

      // 2. Fetch Quizzes and Submissions to calculate pending
      forkJoin({
        quizzes: this.quizService.getStudentAvailableQuizzes(),
        submissions: this.submissionService.getSubmissionsByStudent(studentId) // We might need student profile ID, but let's try user.id if studentId is missing or ensure AuthService has it
      }).subscribe({
        next: ({ quizzes, submissions }) => {
          // Filter quizzes that don't have a specific submission
          const pendingCount = quizzes.filter(q => {
            const hasSubmission = submissions.some(s => s.quizId === q.id);
            return !hasSubmission;
          }).length;

          this.statsCards[2].value = pendingCount.toString().padStart(2, '0');
        },
        error: (err) => console.error('Error loading quiz stats', err)
      });

      // Note: Assignment logic would be similar if an AssignmentService existed for students
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
