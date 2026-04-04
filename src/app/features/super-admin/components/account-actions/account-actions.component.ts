import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { TenantResponse } from '../../services/tenant.service';

@Component({
  selector: 'app-account-actions',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './account-actions.component.html',
  styleUrl: './account-actions.component.css'
})
export class AccountActionsComponent {
  @Input() isActive = true;
  @Input() tenant: TenantResponse | null = null;
  @Output() deactivate = new EventEmitter<void>();
  @Output() activate = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() grantGracePeriod = new EventEmitter<void>();

  constructor(private confirmDialogService: ConfirmDialogService) { }

  get remainingDays(): number {
    if (!this.tenant?.subscriptionExpiryDate) {
      return Number.POSITIVE_INFINITY;
    }

    const now = new Date();
    const expiryDate = new Date(this.tenant.subscriptionExpiryDate);
    const difference = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Math.max(0, difference);
  }

  get canGrantGracePeriod(): boolean {
    return this.remainingDays <= 3;
  }

  async confirmToggleStatus() {
    if (this.isActive) {
      const isConfirmed = await this.confirmDialogService.confirm(
        'Deactivate Tenant',
        'Are you sure you want to deactivate this tenant? This will block access for all of their users.'
      );
      if (isConfirmed) this.deactivate.emit();
    } else {
      const isConfirmed = await this.confirmDialogService.confirm(
        'Activate Tenant',
        'Are you sure you want to reactivate this tenant? Users will regain access.'
      );
      if (isConfirmed) this.activate.emit();
    }
  }

  async confirmDelete() {
    const isConfirmed = await this.confirmDialogService.confirm('Delete Tenant', 'Are you sure you want to delete this tenant? This is irreversible.');
    if (isConfirmed) {
      this.delete.emit();
    }
  }
}
