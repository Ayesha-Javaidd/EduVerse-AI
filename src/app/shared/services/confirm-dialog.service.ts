import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface ConfirmDialogConfig {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
}

interface DialogState {
  isVisible: boolean;
  config: ConfirmDialogConfig | null;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private dialogStateSubject = new BehaviorSubject<DialogState>({
    isVisible: false,
    config: null,
  });
  dialogState$ = this.dialogStateSubject.asObservable();

  private responseSubject = new Subject<boolean>();

  /**
   * Show a confirmation dialog and return a promise that resolves to true (confirmed) or false (cancelled)
   */
  show(config: ConfirmDialogConfig): Promise<boolean> {
    this.dialogStateSubject.next({
      isVisible: true,
      config: {
        type: 'warning',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        ...config,
      },
    });

    return new Promise<boolean>((resolve) => {
      const subscription = this.responseSubject.subscribe((result) => {
        subscription.unsubscribe();
        resolve(result);
      });
    });
  }

  /**
   * Convenience method for delete confirmations
   */
  confirmDelete(itemName?: string): Promise<boolean> {
    return this.show({
      title: 'Delete Confirmation',
      message: itemName
        ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
        : 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
  }

  /**
   * Called when user clicks confirm
   */
  confirm(): void {
    this.hide();
    this.responseSubject.next(true);
  }

  /**
   * Called when user clicks cancel or closes dialog
   */
  cancel(): void {
    this.hide();
    this.responseSubject.next(false);
  }

  private hide(): void {
    this.dialogStateSubject.next({
      isVisible: false,
      config: null,
    });
  }
}
