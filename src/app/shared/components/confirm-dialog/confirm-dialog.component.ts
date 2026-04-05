import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmDialogService, ConfirmDialogConfig } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {
  isVisible = false;
  config: ConfirmDialogConfig | null = null;
  private subscription?: Subscription;

  constructor(private confirmDialogService: ConfirmDialogService) {}

  ngOnInit(): void {
    this.subscription = this.confirmDialogService.dialogState$.subscribe(
      (state) => {
        this.isVisible = state.isVisible;
        this.config = state.config;
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getIconBgClass(): string {
    switch (this.config?.type) {
      case 'danger':
        return 'bg-red-50';
      case 'warning':
        return 'bg-amber-50';
      case 'info':
        return 'bg-[#ecf9f6]';
      default:
        return 'bg-[#ecf9f6]';
    }
  }

  getIconClass(): string {
    switch (this.config?.type) {
      case 'danger':
        return 'text-red-600';
      case 'warning':
        return 'text-amber-500';
      case 'info':
        return 'text-[#23A997]';
      default:
        return 'text-[#23A997]';
    }
  }

  getAccentClass(): string {
    switch (this.config?.type) {
      case 'danger':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-400';
      case 'info':
        return 'bg-[#23A997]';
      default:
        return 'bg-[#23A997]';
    }
  }

  getConfirmButtonClass(): string {
    switch (this.config?.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white';
      case 'warning':
        return 'bg-[#23A997] hover:bg-[#1e9585] focus:ring-[#23A997] text-white';
      case 'info':
        return 'bg-[#23A997] hover:bg-[#1e9585] focus:ring-[#23A997] text-white';
      default:
        return 'bg-[#23A997] hover:bg-[#1e9585] focus:ring-[#23A997] text-white';
    }
  }

  onConfirm(): void {
    this.confirmDialogService.onConfirm();
  }

  onCancel(): void {
    this.confirmDialogService.cancel();
  }
}
