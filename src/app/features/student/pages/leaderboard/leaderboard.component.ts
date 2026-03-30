import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { NgChartsModule } from 'ng2-charts';
import { StudentPerformanceService, PointsHistoryItem, CertificateItem, LeaderboardUser } from '../../../../shared/services/student-performance.service';
import { CourseService } from '../../../../core/services/course.service';
import { AuthService } from '../../../auth/services/auth.service';
import { forkJoin } from 'rxjs';
import { API_BASE_URL } from '../../../../core/constants/api.constants';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, DecimalPipe, NgChartsModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css',
})
export class LeaderboardComponent implements OnInit {
  selectedRank = 1;
  totalPoints = signal(0);
  pointsChange = signal(0);
  currentLevel = signal(1);
  nextLevel = signal(2);
  xp = signal(0);
  xpToNext = signal(300);

  certificates: CertificateItem[] = [];
  pointsHistory: PointsHistoryItem[] = [];
  leaderboard: LeaderboardUser[] = [];

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
    const tenantId = this.authService.getTenantId() || '';
    if (!user) return;
    const studentId = user.studentId || user.id;

    forkJoin({
      performance: this.performanceService.getStudentPerformance(tenantId, studentId),
      top5: this.performanceService.getTenantTop5(tenantId),
      courses: this.courseService.getStudentCourses(studentId, tenantId)
    }).subscribe({
      next: ({ performance, top5, courses }) => {
        if (performance) {
          this.totalPoints.set(performance.totalPoints);
          this.pointsChange.set(performance.pointsThisWeek);
          this.currentLevel.set(performance.level);
          this.nextLevel.set(performance.level + 1);
          this.xp.set(performance.xp || 0);
          this.xpToNext.set(performance.xpToNextLevel);
          this.certificates = performance.certificates || [];
          
          this.pointsHistory = (performance.pointsHistory || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          if (performance.courseStats && performance.courseStats.length > 0) {
            const courseMap = new Map(courses.map((c: any) => [c._id, c.title]));
            const labels: string[] = [];
            const data: number[] = [];
            
            performance.courseStats.slice(0, 7).forEach(stat => {
               labels.push(courseMap.get(stat.courseId) || 'Course');
               data.push(stat.completionPercentage);
            });

            this.courseCompletionData = { ...this.courseCompletionData, labels };
            this.courseCompletionData.datasets[0].data = data;
          } else {
             this.courseCompletionData = { ...this.courseCompletionData, labels: [] };
             this.courseCompletionData.datasets[0].data = [];
          }
        }

        if (top5) {
          this.leaderboard = top5;
          const meIndex = this.leaderboard.findIndex(l => l.studentName && user.fullName && l.studentName.toLowerCase() === user.fullName.toLowerCase());
          if (meIndex !== -1) {
            this.selectedRank = this.leaderboard[meIndex].rank || (meIndex + 1);
          }
        }
      },
      error: (err) => console.error('Error loading gamification data', err)
    });
  }

  selectPlayer(rank: number): void {
    this.selectedRank = rank;
  }

  downloadCertificate(filename: string) {
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}/uploads/certificate/${filename}`;
    link.download = filename;
    link.target = '_blank';
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
        backgroundColor: [
          '#60A5FA', 
          '#34D399', 
          '#FBBF24', 
          '#A78BFA', 
          '#F87171', 
          '#34D399', 
          '#FBBF24', 
        ],
        borderRadius: 12,
        borderSkipped: false,
        barThickness: 50,
        hoverBackgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
          '#EF4444',
          '#10B981',
          '#F59E0B',
        ],
      },
    ],
  };

  courseCompletionOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#374151', font: { size: 14, weight: '500' } },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(243,244,246,0.3)' },
        ticks: { color: '#6B7280', font: { size: 13 }, stepSize: 25 },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E3A8A',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        borderWidth: 0,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    animation: <any>{
      duration: 1200,
    },
  };
}
