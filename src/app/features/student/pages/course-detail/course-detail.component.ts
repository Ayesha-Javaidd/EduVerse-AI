import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService, BackendCourse } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { StudentProgressService } from '../../services/student-progress.service';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StripeEmbeddedModalComponent } from '../../../../shared/components/stripe-embedded-modal/stripe-embedded-modal.component';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ButtonComponent, StripeEmbeddedModalComponent],
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
  clientSecret: string = '';
  isEnrolled: boolean = false;
  progress: number = 0;
  quizCount: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private progressService: StudentProgressService,
    private confirmDialogService: ConfirmDialogService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.courseId = params.get('id') || '';
      if (this.courseId) {
        this.loadCourse();
      }
    });

    this.route.queryParamMap.subscribe((params) => {
      if (params.get('checkout_success') === '1') {
        this.showPaymentModal = false;
        this.clientSecret = '';
        this.loadCourse();
      }
    });
    // Scroll to top when navigation occurs
    window.scrollTo(0, 0);
  }

  loadCourse() {
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
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
    if (this.course?.modules) {
      this.course.modules.forEach(module => {
        if (module.lessons) {
          module.lessons.forEach((lesson: any) => {
            const type = (lesson.type || '').toLowerCase();
            if (type === 'quiz') {
              this.quizCount++;
            }
          });
        }
      });
    }
  }

  get moduleCount(): number {
    return this.course?.modules?.length || 0;
  }

  get lessonCount(): number {
    return this.course?.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;
  }

  get displayPrice(): string {
    if (!this.course || this.course.isFree || !this.course.price) {
      return 'Free';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.course.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(this.course.price);
  }

  checkEnrollment() {
    const user = this.authService.getUser();
    if (!user) return;

    const studentId = user.studentId || user.id;
    this.courseService.getStudentCourses(studentId).subscribe({
      next: (courses) => {
        this.isEnrolled = courses.some(c => c._id === this.courseId || c.id === this.courseId);
        if (this.isEnrolled) {
          this.loadProgress(this.course?.tenantId);
          if (this.route.snapshot.queryParamMap.get('checkout_success') === '1') {
            this.showSuccessModal = true;
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { checkout_success: null },
              queryParamsHandling: 'merge',
              replaceUrl: true,
            });
          }
        }
      },
      error: (err) => console.error('Error checking enrollment:', err)
    });
  }

  loadProgress(tenantId?: string) {
    this.progressService.getCourseProgress(this.courseId, tenantId).subscribe({
      next: (prog) => {
        this.progress = prog.progressPercentage;
      },
      error: (err) => console.error('Error loading progress:', err)
    });
  }

  get learningButtonText(): string {
    if (this.progress === 100) return "Enroll Again";
    if (this.progress > 0) return "Continue Learning";
    return "Start Learning";
  }

  get isCompletedCourse(): boolean {
    return this.isEnrolled && this.progress === 100;
  }

  startLearning() {
    this.router.navigate(['/student/learn', this.courseId]);
  }

  async handleEnrolledAction() {
    if (!this.isCompletedCourse) {
      this.startLearning();
      return;
    }

    const confirmed = await this.confirmDialogService.confirm(
      'Enroll Again',
      'This will reset your progress, quizzes, adaptive lessons, and tutor history for this course. Continue?'
    );

    if (!confirmed) {
      return;
    }

    this.processEnrollment();
  }

  async enroll() {
    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isCompletedCourse) {
      this.processEnrollment();
      return;
    }

    const isPaidCourse = !!(this.course && !this.course.isFree && (this.course.price || 0) > 0);
    const confirmed = await this.confirmDialogService.show({
      title: isPaidCourse ? 'Continue to Checkout' : 'Enroll in Course',
      message: isPaidCourse
        ? `You are about to continue to checkout for "${this.course?.title}".`
        : `You are about to enroll in "${this.course?.title}".`,
      confirmText: isPaidCourse ? 'Continue' : 'Enroll',
      cancelText: 'Cancel',
      type: 'warning',
    });

    if (!confirmed) {
      return;
    }

    // Check if course is paid
    if (isPaidCourse) {
      this.enrolling = true;
      this.courseService.createCheckoutSession(this.courseId).subscribe({
         next: (res) => {
            if(res.clientSecret) {
               this.clientSecret = res.clientSecret;
               this.showPaymentModal = true;
            } else {
               this.confirmDialogService.alert('Unable to start checkout right now. Please try again.', 'Checkout unavailable', 'warning');
            }
            this.enrolling = false;
         },
         error: async (err) => {
            console.error("Failed to generate stripe checkout", err);
            this.enrolling = false;
            await this.confirmDialogService.alert(err.error?.detail || 'Unable to open checkout right now.', 'Checkout unavailable', 'danger');
         }
      });
    } else {
      this.processEnrollment();
    }
  }

  onPaymentSuccess() {
    this.showPaymentModal = false;
    this.clientSecret = '';
  }

  processEnrollment() {
    const user = this.authService.getUser();
    if (!user) return;

    this.enrolling = true;
    const studentId = user.studentId || user.id;

    this.courseService.enrollStudent(this.courseId, studentId, this.course?.tenantId).subscribe({
      next: () => {
        this.enrolling = false;
        this.isEnrolled = true;
        this.progress = 0;
        this.showSuccessModal = true;
      },
      error: async (err) => {
        this.enrolling = false;
        console.error(err);
        await this.confirmDialogService.alert('Enrollment failed: ' + (err.error?.detail || 'Unknown error'), 'Error', 'danger');
      }
    });
  }

  closeModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/student/learn', this.courseId]);
  }

  goBack() {
    this.router.navigate(['/student/explore-courses']);
  }
}
