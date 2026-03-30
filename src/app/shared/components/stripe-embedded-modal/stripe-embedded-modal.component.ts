import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/constants/api.constants';

@Component({
  selector: 'app-stripe-embedded-modal',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './stripe-embedded-modal.component.html',
  styles: [`
    :host {
      display: contents;
    }
    #checkout {
       width: 100%;
       min-height: 500px;
    }
  `]
})
export class StripeEmbeddedModalComponent implements OnInit, OnDestroy {
  @Input() clientSecret: string = '';
  @Input() title: string = 'Secure Checkout';
  
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('checkoutContainer', { static: true }) checkoutContainer!: ElementRef;

  private checkoutInstance: any = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    if (!this.clientSecret) {
      this.error = "Invalid checkout session. Please try again.";
      this.loading = false;
      return;
    }

    try {
      this.http.get<{publishableKey: string}>(`${API_BASE_URL}/payments/config`).subscribe({
        next: async (res) => {
          try {
            // dynamic import to ensure DOM is ready and types don't panic
            const { loadStripe } = await import('@stripe/stripe-js');
            const stripe = await loadStripe(res.publishableKey) as any;
            if (!stripe) throw new Error("Stripe failed to initialize.");

            this.checkoutInstance = await stripe.createEmbeddedCheckoutPage({
              clientSecret: this.clientSecret,
            });

            // Mount into the UI
            if (this.checkoutContainer && this.checkoutInstance) {
              this.checkoutInstance.mount(this.checkoutContainer.nativeElement);
              this.loading = false;
            }
          } catch(e: any) {
             console.error("Stripe SDK Error:", e?.message || e);
             this.error = e?.message || "Failed to load secure payment terminal.";
             this.loading = false;
          }
        },
        error: () => {
           this.error = "Failed to connect to payment secure server.";
           this.loading = false;
        }
      });
    } catch (err: any) {
      console.error("Stripe Checkout Error:", err);
      this.error = "Failed to load secure payment terminal.";
      this.loading = false;
    }
  }

  ngOnDestroy() {
    if (this.checkoutInstance) {
      try {
        this.checkoutInstance.destroy();
      } catch (e) {
        console.error("Error destroying stripe instance", e);
      }
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
