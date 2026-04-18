import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  HostListener,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../features/auth/services/auth.service';
import { TenantBranding, TenantBrandingService } from '../../services/tenant-branding.service';

interface MenuItem {
  icon: string;
  label: string;
  path: string;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnChanges, OnInit, OnDestroy {
  @Input() role: 'admin' | 'teacher' | 'super-admin' | 'student' = 'admin';
  @Output() toggleSidebar = new EventEmitter<boolean>();

  private destroy$ = new Subject<void>();
  isOpen = true;
  isMobileSidebarVisible = false;
  isMobile = false;
  menuItems: MenuItem[] = [];
  tenantBranding: TenantBranding | null = null;

  constructor(
    private authService: AuthService,
    private tenantBrandingService: TenantBrandingService,
  ) {}

  ngOnInit() {
    this.updateScreenSize();
    this.setMenuItems();
    this.tenantBrandingService.branding$
      .pipe(takeUntil(this.destroy$))
      .subscribe((branding) => {
        this.tenantBranding = branding;
      });
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setMenuItems() {
    if (this.role === 'admin') {
      this.menuItems = [
        {
          icon: 'fa-solid fa-table-cells-large',
          label: 'Dashboard',
          path: 'dashboard',
        },
        { icon: 'fa-solid fa-graduation-cap', label: 'Teachers', path: 'teachers' },
        { icon: 'fa-solid fa-user-group', label: 'Students', path: 'students' },
        { icon: 'fa-solid fa-book-open', label: 'Courses', path: 'courses' },
        { icon: 'fa-solid fa-gear', label: 'Settings', path: 'settings' },
      ];
    } else if (this.role === 'teacher') {
      this.menuItems = [
        {
          icon: 'fa-solid fa-chart-pie',
          label: 'Dashboard',
          path: 'dashboard',
        },
        { icon: 'fa-solid fa-book', label: 'My Courses', path: 'courses' },
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
        { icon: 'fa-solid fa-credit-card', label: 'Subscriptions', path: 'subscriptions' },
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

  get displayBrandName(): string {
    return this.tenantBranding?.tenantName?.trim() || 'EduVerse';
  }
}
