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
  showPaymentModal: boolean = false; // New state for payment modal

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
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load course details';
        this.loading = false;
      }
    });
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
