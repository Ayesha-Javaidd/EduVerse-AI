import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmDialogService, ConfirmDialogConfig } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isVisible"
      class="fixed inset-0 z-[110] flex items-center justify-center"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        (click)="onCancel()"
      ></div>

      <!-- Dialog -->
      <div
        class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in"
      >
        <div class="p-6">
          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              [ngClass]="getIconBgClass()"
            >
              <!-- Warning Icon -->
              <svg
                *ngIf="config?.type === 'warning' || config?.type === 'danger'"
                class="w-6 h-6"
                [ngClass]="getIconClass()"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <!-- Info Icon -->
              <svg
                *ngIf="config?.type === 'info'"
                class="w-6 h-6"
                [ngClass]="getIconClass()"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <!-- Title -->
          <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">
            {{ config?.title || 'Confirm Action' }}
          </h3>

          <!-- Message -->
          <p class="text-gray-600 text-center mb-6">
            {{ config?.message || 'Are you sure you want to proceed?' }}
          </p>

          <!-- Buttons -->
          <div class="flex gap-3 justify-center">
            <button
              (click)="onCancel()"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
            >
              {{ config?.cancelText || 'Cancel' }}
            </button>
            <button
              (click)="onConfirm()"
              class="px-4 py-2 rounded-md font-medium transition-colors"
              [ngClass]="getConfirmButtonClass()"
            >
              {{ config?.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes scale-in {
        from {
          transform: scale(0.95);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      .animate-scale-in {
        animation: scale-in 0.2s ease-out;
      }
    `,
  ],
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
        return 'bg-red-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'info':
        return 'bg-blue-100';
      default:
        return 'bg-yellow-100';
    }
  }

  getIconClass(): string {
    switch (this.config?.type) {
      case 'danger':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-yellow-600';
    }
  }

  getConfirmButtonClass(): string {
    switch (this.config?.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  }

  onConfirm(): void {
    this.confirmDialogService.confirm();
  }

  onCancel(): void {
    this.confirmDialogService.cancel();
  }
}
