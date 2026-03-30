import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

export interface PendingTaskItem {
  id: string;
  type: 'quiz' | 'assignment';
  title: string;
  courseName: string;
  dueDate: Date;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
  bgClass: string;
  route: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent {
  @Input() pendingTasks: PendingTaskItem[] = [];

  constructor(private router: Router) {}

  goToTask(route: string) {
    this.router.navigateByUrl(route);
  }
}
