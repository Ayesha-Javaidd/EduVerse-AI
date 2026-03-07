import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

@Component({
    selector: 'app-payment-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent],
    templateUrl: './payment-modal.component.html',
    styles: [`
    :host {
      display: contents;
    }
  `]
})
export class PaymentModalComponent {
    @Input() courseTitle: string = '';
    @Input() price: number = 0;
    @Input() currency: string = 'USD';

    @Output() confirmPayment = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    isProcessing: boolean = false;

    // Mock form data
    cardName: string = '';
    cardNumber: string = '';
    expiry: string = '';
    cvc: string = '';

    constructor() { }

    onPay() {
        this.isProcessing = true;

        // Simulate API call
        setTimeout(() => {
            this.isProcessing = false;
            this.confirmPayment.emit();
        }, 2000);
    }

    onCancel() {
        this.cancel.emit();
    }
}
