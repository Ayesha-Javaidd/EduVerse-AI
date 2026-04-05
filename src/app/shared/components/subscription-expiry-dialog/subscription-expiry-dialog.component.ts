import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { APP_BRANDING } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-subscription-expiry-dialog',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subscription-expiry-dialog.component.html',
})
export class SubscriptionExpiryDialogComponent {
  @Output() onUpgrade = new EventEmitter<void>();
  @Output() onContactSupport = new EventEmitter<void>();
  readonly appName = APP_BRANDING.NAME;
}
