import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-account-actions',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './account-actions.component.html',
  styleUrl: './account-actions.component.css'
})
export class AccountActionsComponent {
  @Output() deactivate = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  constructor(private confirmDialogService: ConfirmDialogService) {}

  async confirmDeactivate() {
    const isConfirmed = await this.confirmDialogService.confirm('Deactivate Tenant', 'Are you sure you want to deactivate this tenant? This will block access for all of their users.');
    if (isConfirmed) {
      this.deactivate.emit();
    }
  }

  async confirmDelete() {
    const isConfirmed = await this.confirmDialogService.confirm('Delete Tenant', 'Are you sure you want to delete this tenant? This is irreversible.');
    if (isConfirmed) {
      this.delete.emit();
    }
  }
}
