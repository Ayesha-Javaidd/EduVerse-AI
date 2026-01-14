import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../../features/auth/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  private destroy$ = new Subject<void>();
  @Input() pageTitle: string = 'Dashboard';
  @Input() notificationCount: number = 0;

  // profile input remains for manual override if needed
  @Input() profile?: Profile;

  currentUser: User | null = null;
  displayProfile: Profile = { name: '', initials: '' };

  @Output() notificationClick = new EventEmitter<void>();
  @Output() profileClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();

  constructor(private authService: AuthService) {
    this.updateScreenSize();
  }

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.setupProfile();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupProfile() {
    if (this.profile && this.profile.name) {
      this.displayProfile = this.profile;
    } else if (this.currentUser) {
      const name = this.currentUser.fullName || 'User';
      this.displayProfile = {
        name: name,
        initials: this.getInitials(name)
      };
    } else {
      this.displayProfile = { name: 'User Profile', initials: 'UP' };
    }
  }

  private getInitials(name: string): string {
    if (!name) return 'U';
    // Always return just the first letter as requested by user
    return name.trim().charAt(0).toUpperCase();
  }

  isMobile = false;
  onNotificationClick(): void {
    this.notificationClick.emit();
  }

  onProfileClick(): void {
    this.profileClick.emit();
  }

  onLogoutClick(): void {
    this.logoutClick.emit();
  }

  @HostListener('window:resize')
  updateScreenSize() {
    this.isMobile = window.innerWidth < 992;
  }
}

interface Profile {
  name: string;
  initials: string;
  avatar?: string;
}
