import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../button/button.component';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  HostListener,
  OnInit,
} from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth.service';

interface MenuItem {
  icon: string;
  label: string;
  path: string;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnChanges {
  @Input() role: 'admin' | 'teacher' | 'super-admin' | 'student' = 'admin';
  @Output() toggleSidebar = new EventEmitter<boolean>();

  isOpen = true;
  isMobileSidebarVisible = false;
  isMobile = false;
  menuItems: MenuItem[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.updateScreenSize();
  }

  @HostListener('window:resize')
  updateScreenSize() {
    this.isMobile = window.innerWidth < 992;
    if (this.isMobile) {
      this.isMobileSidebarVisible = false; // hidden by default
    } else {
      this.isMobileSidebarVisible = true; // always visible on desktop
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['role']) this.setMenuItems();
  }

  private setMenuItems() {
    if (this.role === 'admin') {
      this.menuItems = [
        {
          icon: 'fa-solid fa-chart-pie',
          label: 'Dashboard',
          path: 'dashboard',
        },
        { icon: 'fa-solid fa-users', label: 'Teachers', path: 'teachers' },
        { icon: 'fa-solid fa-users', label: 'Students', path: 'students' },
        { icon: 'fa-solid fa-book', label: 'Courses', path: 'courses' },
        { icon: 'fa-solid fa-cog', label: 'Settings', path: 'settings' },
      ];
    } else if (this.role === 'teacher') {
      this.menuItems = [
        {
          icon: 'fa-solid fa-chart-pie',
          label: 'Dashboard',
          path: 'dashboard',
        },
        { icon: 'fa-solid fa-book', label: 'My Courses', path: 'courses' },
        { icon: 'fa-solid fa-question', label: 'Quizzes', path: 'quizzes' },
        { icon: 'fa-solid fa-file', label: 'Assignments', path: 'assignments' },
        {
          icon: 'fa-solid fa-user',
          label: 'Track Student',
          path: 'trackstudent',
        },
        { icon: 'fa-solid fa-cog', label: 'Settings', path: 'settings' },
      ];
    } else if (this.role === 'student') {
      this.menuItems = [
        {
          icon: 'fa-solid fa-chart-pie',
          label: 'Dashboard',
          path: 'dashboard',
        },
        { icon: 'fa-solid fa-book', label: 'My Courses', path: 'courses' },
        {
          icon: 'fa-solid fa-book',
          label: 'Explore Courses',
          path: 'explore-courses',
        },
        { icon: 'fa-solid fa-question', label: 'Quizzes', path: 'quizzes' },
        { icon: 'fa-solid fa-file', label: 'Assignments', path: 'assignments' },
        {
          icon: 'fa-solid fa-robot',
          label: 'Ai Assistant',
          path: 'ai-assisstant',
        },
        { icon: 'fa-solid fa-user', label: 'Leaderboard', path: 'leaderboard' },
        { icon: 'fa-solid fa-cog', label: 'Settings', path: 'settings' },
      ];
    } else if (this.role === 'super-admin') {
      this.menuItems = [
        {
          icon: 'fa-solid fa-chart-pie',
          label: 'Dashboard',
          path: 'dashboard',
        },
        { icon: 'fa-solid fa-building', label: 'Tenants', path: 'tenants' },
        { icon: 'fa-solid fa-cog', label: 'Settings', path: 'settings' },
      ];
    } else {
      this.menuItems = [];
    }
  }

  /** Universal toggle for both desktop and mobile */
  toggleSidebarAction() {
    if (this.isMobile) {
      this.isMobileSidebarVisible = !this.isMobileSidebarVisible;
    } else {
      this.isOpen = !this.isOpen;
      this.toggleSidebar.emit(this.isOpen);
    }
  }

  closeMobileSidebar() {
    if (this.isMobile) {
      this.isMobileSidebarVisible = false;
    }
  }

  logout() {
    this.authService.logout();
  }

  toggleDesktopSidebar() {
    this.isOpen = !this.isOpen;
    this.toggleSidebar.emit(this.isOpen);
  }
}
