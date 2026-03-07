import { Component, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, DecimalPipe, NgChartsModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css',
})
export class LeaderboardComponent {
  selectedRank = 2;
  totalPoints = signal(12450);
  pointsChange = signal(250);
  currentLevel = signal(5);
  nextLevel = signal(6);
  xpToNext = signal(2500);

  selectPlayer(rank: number): void {
    this.selectedRank = rank;
  }

  certificates = [
    {
      title: 'Certificate of Completion: Intro to Marketing',
      date: 'Issued on: Oct 20, 2025',
      file: 'certificate-marketing.pdf',
    },
    {
      title: 'Certificate of Excellence: Art History',
      date: 'Issued on: Sep 15, 2025',
      file: 'certificate-art.pdf',
    },
    {
      title: 'Certificate of Excellence: AI',
      date: 'Issued on: Aug 19, 2025',
      file: 'certificate-art.pdf',
    },
  ];

  badges = [
    {
      name: 'Course Completer',
      date: 'Oct 20, 2025',
      color: 'bg-green-100',
      textColor: 'text-green-600',
      icon: 'fa-solid fa-graduation-cap',
    },
    {
      name: 'Perfect Quiz',
      date: 'Oct 18, 2024',
      color: 'bg-blue-100',
      textColor: 'text-blue-600',
      icon: 'fa-solid fa-clipboard-check',
    },
    {
      name: 'Team Player',
      date: 'Oct 15, 2025',
      color: 'bg-purple-100',
      textColor: 'text-purple-600',
      icon: 'fa-solid fa-users',
    },
    {
      name: 'Hot Streak',
      date: 'Oct 12, 2024',
      color: 'bg-red-100',
      textColor: 'text-red-600',
      icon: 'fa-solid fa-fire',
    },
    {
      name: 'Forum Leader',
      date: 'Locked',
      color: 'bg-gray-100',
      textColor: 'text-gray-400',
      icon: 'fa-solid fa-lock',
      locked: true,
    },
  ];

  leaderboard = [
    {
      rank: 1,
      name: 'Tayyaba Anwar',
      points: 15200,
      avatar: 'assets/avatar/1.png',
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      rank: 2,
      name: 'You',
      points: 12450,
      avatar: 'assets/avatar/5.png',
      color: 'bg-blue-500 text-white',
    },
    {
      rank: 3,
      name: 'Muhammad Hassan',
      points: 10300,
      avatar: 'assets/avatar/3.png',
      color: 'bg-green-100 text-gray-700',
    },
    {
      rank: 4,
      name: 'Ayesha Javaid',
      points: 9450,
      avatar: 'assets/avatar/2.png',
      color: 'bg-gray-100 text-gray-700',
    },
    {
      rank: 5,
      name: 'Manahil Kamran',
      points: 8200,
      avatar: 'assets/avatar/4.png',
      color: 'bg-pink-100 text-gray-700',

    },
    
    
    
  ];

  downloadCertificate(filename: string) {
    const link = document.createElement('a');
    link.href = `assets/certificates/${filename}`;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

courseCompletionData = {
  labels: ['Art', 'Math', 'Marketing', 'Illustration', 'Physics', 'DSA', 'OOP'],
  datasets: [
    {
      label: 'Completion (%)',
      data: [95, 88, 78, 90, 72,88,72],
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
      grid: {
        display: false,
      },
      ticks: {
        color: '#374151',
        font: { size: 14, weight: '500' },
      },
    },
    y: {
      beginAtZero: true,
      max: 100,
      grid: {
        color: 'rgba(243,244,246,0.3)',
      },
      ticks: {
        color: '#6B7280',
        font: { size: 13 },
        stepSize: 25,
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
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
    easing: 'easeOutQuart',
  },
};
weeklyStudyData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Study Hours',
      data: [5, 7, 3, 8, 6, 9, 4],
      fill: true,
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59,130,246,0.15)',
      tension: 0.4,
      pointBackgroundColor: '#2563EB',
      pointBorderWidth: 2,
      pointRadius: 5,
    },
  ],
};

weeklyStudyOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#4B5563', font: { size: 14 } },
    },
    y: {
      grid: { color: 'rgba(229,231,235,0.5)' },
      ticks: { color: '#6B7280', stepSize: 2 },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1E3A8A',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 8,
    },
  },
};


}
