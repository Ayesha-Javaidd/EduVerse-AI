import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { PaymentModalComponent } from '../../../../shared/components/payment-modal/payment-modal.component';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ButtonComponent, PaymentModalComponent],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.css']
})
export class CourseDetailComponent implements OnInit {
  courseId: string = '';
  course: BackendCourse | null = null;
  loading: boolean = true;
  error: string | null = null;
  enrolling: boolean = false;
  showSuccessModal: boolean = false;
  showPaymentModal: boolean = false;
  isEnrolled: boolean = false;
  quizCount: number = 0;
  assignmentCount: number = 0; // Currently mapping 'reading' or custom types to assignments if applicable

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.courseId = params.get('id') || '';
      if (this.courseId) {
        this.loadCourse();
      }
    });
    // Scroll to top when navigation occurs
    window.scrollTo(0, 0);
  }

  loadCourse() {
    const tenantId = this.authService.getTenantId();
    if (!tenantId) {
      this.error = 'Tenant ID not found';
      this.loading = false;
      return;
    }

    this.courseService.getCourseById(this.courseId, tenantId).subscribe({
      next: (course) => {
        console.log('Loaded Course:', course); // DEBUG
        this.course = course;
        this.calculateStats();
        this.checkEnrollment();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load course details';
        this.loading = false;
      }
    });
  }

  calculateStats() {
    this.quizCount = 0;
    this.assignmentCount = 0;
    if (this.course?.modules) {
      this.course.modules.forEach(module => {
        if (module.lessons) {
          module.lessons.forEach((lesson: any) => {
            const type = (lesson.type || '').toLowerCase();
            if (type === 'quiz') {
              this.quizCount++;
            } else if (type === 'document' || type === 'reading' || type === 'assignment' || type === 'file') {
              this.assignmentCount++;
            }
          });
        }
      });
    }
  }

  checkEnrollment() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();
    if (!user || !tenantId) return;

    const studentId = user.studentId || user.id;
    this.courseService.getStudentCourses(studentId, tenantId).subscribe({
      next: (courses) => {
        this.isEnrolled = courses.some(c => c._id === this.courseId || c.id === this.courseId);
      },
      error: (err) => console.error('Error checking enrollment:', err)
    });
  }

  startLearning() {
    this.router.navigate(['/student/courses']);
  }

  enroll() {
    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // Check if course is paid
    if (this.course && !this.course.isFree && (this.course.price || 0) > 0) {
      this.showPaymentModal = true;
    } else {
      this.processEnrollment();
    }
  }

  onPaymentSuccess() {
    this.showPaymentModal = false;
    this.processEnrollment();
  }

  processEnrollment() {
    const user = this.authService.getUser();
    const tenantId = this.authService.getTenantId();

    if (!user || !tenantId) return;

    this.enrolling = true;
    const studentId = user.studentId || user.id;

    this.courseService.enrollStudent(this.courseId, studentId, tenantId).subscribe({
      next: () => {
        this.enrolling = false;
        this.showSuccessModal = true;
      },
      error: (err) => {
        this.enrolling = false;
        console.error(err);
        alert('Enrollment failed: ' + (err.error?.detail || 'Unknown error'));
      }
    });
  }

  closeModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/student/courses']);
  }

  goBack() {
    this.router.navigate(['/student/explore-courses']);
  }
}
