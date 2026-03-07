import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-subscription-details',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './subscription-details.component.html',
  styleUrl: './subscription-details.component.css'
})
export class SubscriptionDetailsComponent 
implements OnChanges 
{
  @Input() subscription: any = null;
  @Output() upgrade = new EventEmitter<void>();
  @Output() renew = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['subscription']?.currentValue) {
      // Ensure both are real Date objects
      const sub = changes['subscription'].currentValue;
      this.subscription = {
        ...sub,
        startDate: new Date(sub.startDate),
        expiryDate: new Date(sub.expiryDate),
      };
    }
  }

  get remainingDays(): number {
    if (!this.subscription?.expiryDate) {
      return 0;
    }

    const now = new Date();
    const expiryDate = new Date(this.subscription.expiryDate);
    const difference = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, difference);
  }

  onUpgrade() {
    this.upgrade.emit();
  }

  onRenew() {
    this.renew.emit();
  }
}
