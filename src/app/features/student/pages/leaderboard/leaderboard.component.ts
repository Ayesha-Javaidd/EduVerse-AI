import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NgChartsModule } from 'ng2-charts';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import {
  StudentPerformanceService,
  PointsHistoryItem,
  CertificateItem,
  LeaderboardUser,
  LeaderboardSummary,
} from '../../../../shared/services/student-performance.service';
import { CourseService } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { API_BASE_URL } from '../../../../core/constants/api.constants';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, NgChartsModule, StatCardComponent, ButtonComponent],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css',
})
export class LeaderboardComponent implements OnInit {
  loading = true;
  error: string | null = null;

  totalPoints = signal(0);
  pointsChange = signal(0);
  currentLevel = signal(1);
  nextLevel = signal(2);
  xp = signal(0);
  xpToNext = signal(300);

  certificates: CertificateItem[] = [];
  pointsHistory: PointsHistoryItem[] = [];
  leaderboard: LeaderboardUser[] = [];
  topPerformers: LeaderboardUser[] = [];
  currentStudentEntry: LeaderboardUser | null = null;
  totalLeaderboardStudents = 0;

  private currentStudentId = '';
  private currentStudentName = '';

  constructor(
    private performanceService: StudentPerformanceService,
    private courseService: CourseService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadGamificationData();
  }

  loadGamificationData() {
    const user = this.authService.getUser();

    if (!user) {
      this.error = 'Unable to load leaderboard data right now.';
      this.loading = false;
      return;
    }

    const studentId = user.studentId || user.id;
    this.currentStudentId = studentId;
    this.currentStudentName = user.fullName || '';

    forkJoin({
      performance: this.performanceService.getMyPerformance().pipe(catchError(() => of(null))),
      leaderboardSummary: this.performanceService.getGlobalLeaderboardSummary(10).pipe(
        catchError(() =>
          of({
            top: [],
            currentStudent: null,
            totalStudents: 0,
          } as LeaderboardSummary)
        )
      ),
      courses: this.courseService.getStudentCourses(studentId).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ performance, leaderboardSummary, courses }) => {
        if (performance) {
          this.totalPoints.set(performance.totalPoints);
          this.pointsChange.set(performance.pointsThisWeek);
          this.currentLevel.set(performance.level);
          this.nextLevel.set(performance.level + 1);
          this.xp.set(performance.xp || 0);
          this.xpToNext.set(performance.xpToNextLevel);
          this.certificates = performance.certificates || [];
          this.pointsHistory = [...(performance.pointsHistory || [])].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          if (performance.courseStats && performance.courseStats.length > 0) {
            const courseMap = new Map(courses.map((course: any) => [course._id, course.title]));
            const labels: string[] = [];
            const data: number[] = [];

            [...performance.courseStats]
              .sort(
                (a, b) =>
                  new Date(b.lastActive || 0).getTime() -
                  new Date(a.lastActive || 0).getTime()
              )
              .slice(0, 6)
              .forEach((stat) => {
                labels.push(courseMap.get(stat.courseId) || 'Course');
                data.push(stat.completionPercentage);
              });

            this.courseCompletionData = {
              ...this.courseCompletionData,
              labels,
              datasets: [
                {
                  ...this.courseCompletionData.datasets[0],
                  data,
                },
              ],
            };
          } else {
            this.courseCompletionData = {
              ...this.courseCompletionData,
              labels: [],
              datasets: [
                {
                  ...this.courseCompletionData.datasets[0],
                  data: [],
                },
              ],
            };
          }
        }

        this.leaderboard = leaderboardSummary?.top || [];
        this.topPerformers = this.leaderboard.slice(0, 3);
        this.totalLeaderboardStudents = leaderboardSummary?.totalStudents || 0;
        this.currentStudentEntry =
          leaderboardSummary?.currentStudent ||
          this.leaderboard.find((entry) => entry.studentId === this.currentStudentId) ||
          this.leaderboard.find(
            (entry) =>
              !!entry.studentName &&
              !!this.currentStudentName &&
              entry.studentName.toLowerCase() === this.currentStudentName.toLowerCase()
          ) ||
          null;

        if (!this.leaderboard.length && !this.currentStudentEntry && !performance) {
          this.error = 'Unable to load leaderboard data right now.';
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading leaderboard data', err);
        this.error = 'Unable to load leaderboard data right now.';
        this.loading = false;
      },
    });
  }

  get summaryCards() {
    return [
      {
        title: 'Your Rank',
        value: this.currentStudentEntry ? `#${this.currentStudentEntry.rank}` : '--',
        icon: 'fa-solid fa-trophy',
        iconBgClass: 'bg-[#ecf9f6]',
        iconColorClass: 'text-[#23A997]',
      },
      {
        title: 'Total Points',
        value: this.totalPoints().toLocaleString(),
        icon: 'fa-solid fa-star',
        iconBgClass: 'bg-[#ecf9f6]',
        iconColorClass: 'text-[#23A997]',
      },
      {
        title: 'Current Level',
        value: `Level ${this.currentLevel()}`,
        icon: 'fa-solid fa-layer-group',
        iconBgClass: 'bg-slate-100',
        iconColorClass: 'text-[#181F39]',
      },
      {
        title: 'Certificates',
        value: this.certificates.length,
        icon: 'fa-solid fa-certificate',
        iconBgClass: 'bg-amber-100',
        iconColorClass: 'text-amber-600',
      },
    ];
  }

  get xpProgress(): number {
    const total = this.xp() + this.xpToNext();
    return total > 0 ? (this.xp() / total) * 100 : 0;
  }

  get currentLevelXpTarget(): number {
    return this.xp() + this.xpToNext();
  }

  get recentPointsHistory(): PointsHistoryItem[] {
    return this.pointsHistory.slice(0, 3);
  }

  isCurrentStudent(entry: LeaderboardUser): boolean {
    if (entry.studentId && this.currentStudentId) {
      return entry.studentId === this.currentStudentId;
    }

    return (
      !!entry.studentName &&
      !!this.currentStudentName &&
      entry.studentName.toLowerCase() === this.currentStudentName.toLowerCase()
    );
  }

  downloadCertificate(certificate: CertificateItem) {
    const desiredName = `${(certificate.title || 'Certificate').trim()}.pdf`;
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}/uploads/certificate/${certificate.file}?name=${encodeURIComponent(desiredName)}`;
    link.download = desiredName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  courseCompletionData: any = {
    labels: [],
    datasets: [
      {
        label: 'Completion (%)',
        data: [],
        backgroundColor: '#23A997',
        hoverBackgroundColor: '#1e9585',
        borderRadius: 10,
        borderSkipped: false,
        barThickness: 34,
      },
    ],
  };

  courseCompletionOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 12, weight: '500' } },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#e8eef2' },
        ticks: { color: '#94a3b8', font: { size: 12 }, stepSize: 25 },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#181F39',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        borderWidth: 0,
        cornerRadius: 10,
        displayColors: false,
      },
    },
    animation: {
      duration: 900,
    },
  };
}
