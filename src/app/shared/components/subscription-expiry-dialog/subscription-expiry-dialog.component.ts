import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-subscription-expiry-dialog',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <!-- Backdrop (Blurred & Dark) -->
      <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-md"></div>

      <!-- Dialog Content -->
      <div class="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-bounce-in">
        <!-- Error/Lock Icon -->
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 class="text-2xl font-bold text-slate-900 mb-3">Subscription Expired</h2>
        <p class="text-slate-600 mb-8">
          Your access to the EduVerse platform has been restricted because your subscription has ended and the grace period has passed.
        </p>

        <div class="space-y-3">
          <button 
            [routerLink]="['/admin/settings/billing']"
            (click)="onUpgrade.emit()"
            class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-200">
            Renew or Upgrade Now
          </button>
          
          <button 
            (click)="onContactSupport.emit()"
            class="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold transition-all">
            Contact Support
          </button>
        </div>

        <p class="mt-6 text-xs text-slate-400">
          EduVerse AI Multi-Tenant Platform &bull; Billing Control
        </p>
      </div>
    </div>
  `,
  styles: [`
    .animate-bounce-in {
      animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    @keyframes bounceIn {
      0% { opacity: 0; transform: scale(0.3); }
      50% { opacity: 1; transform: scale(1.05); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
  `]
})
export class SubscriptionExpiryDialogComponent {
  @Output() onUpgrade = new EventEmitter<void>();
  @Output() onContactSupport = new EventEmitter<void>();
}
