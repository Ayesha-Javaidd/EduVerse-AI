import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
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
    this.currentUser = this.authService.getCurrentUser();
    this.setupProfile();
  }

  private setupProfile() {
    if (this.profile && this.profile.name) {
      this.displayProfile = this.profile;
    } else if (this.currentUser) {
      this.displayProfile = {
        name: this.currentUser.fullName,
        initials: this.getInitials(this.currentUser.fullName)
      };
    } else {
      this.displayProfile = { name: 'User Profile', initials: 'UP' };
    }
  }

  private getInitials(name: string): string {
    if (!name) return 'UP';
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
