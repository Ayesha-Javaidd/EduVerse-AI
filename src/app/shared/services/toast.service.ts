import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts: Toast[] = [];
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  private idCounter = 0;

  /**
   * Show a success toast
   */
  success(message: string, duration = 4000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Show an error toast
   */
  error(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show a warning toast
   */
  warning(message: string, duration = 4000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Show an info toast
   */
  info(message: string, duration = 4000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Show a toast notification
   */
  private show(message: string, type: Toast['type'], duration: number): void {
    const id = ++this.idCounter;
    const toast: Toast = { id, message, type, duration };

    this.toasts.push(toast);
    this.toastsSubject.next([...this.toasts]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  /**
   * Remove a toast by id
   */
  remove(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.toastsSubject.next([...this.toasts]);
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.toasts = [];
    this.toastsSubject.next([]);
  }
}
