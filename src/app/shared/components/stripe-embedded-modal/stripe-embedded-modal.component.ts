import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ENDPOINTS } from '../../../core/constants/api.constants';

interface EmbeddedCheckoutInstance {
  mount(element: HTMLElement): void;
  destroy(): void;
}

interface StripeWithEmbeddedCheckout {
  createEmbeddedCheckoutPage(options: { clientSecret: string }): Promise<EmbeddedCheckoutInstance>;
}

@Component({
  selector: 'app-stripe-embedded-modal',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './stripe-embedded-modal.component.html',
  styleUrl: './stripe-embedded-modal.component.css',
})
export class StripeEmbeddedModalComponent implements OnInit, OnDestroy {
  @Input() clientSecret: string = '';
  @Input() title: string = 'Secure Checkout';
  
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('checkoutContainer', { static: true }) checkoutContainer!: ElementRef;

  private checkoutInstance: EmbeddedCheckoutInstance | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    document.body.classList.add('overflow-hidden');
    
    if (!this.clientSecret) {
      this.error = "Invalid checkout session. Please try again.";
      this.loading = false;
      return;
    }

    try {
      this.http.get<{publishableKey: string}>(ENDPOINTS.PAYMENTS.CONFIG).subscribe({
        next: async (res) => {
          try {
            const { loadStripe } = await import('@stripe/stripe-js');
            const stripe = await loadStripe(res.publishableKey);
            if (!stripe) throw new Error("Stripe failed to initialize.");

            this.checkoutInstance = await (stripe as StripeWithEmbeddedCheckout).createEmbeddedCheckoutPage({
              clientSecret: this.clientSecret,
            });

            // Mount into the UI
            if (this.checkoutContainer && this.checkoutInstance) {
              this.checkoutInstance.mount(this.checkoutContainer.nativeElement);
              this.loading = false;
            }
          } catch(e: unknown) {
             const message = e instanceof Error ? e.message : "Failed to load secure payment terminal.";
             console.error("Stripe SDK Error:", message);
             this.error = message;
             this.loading = false;
          }
        },
        error: () => {
           this.error = "Failed to connect to payment secure server.";
           this.loading = false;
        }
      });
    } catch (err: unknown) {
      console.error("Stripe Checkout Error:", err);
      this.error = err instanceof Error ? err.message : "Failed to load secure payment terminal.";
      this.loading = false;
    }
  }

  ngOnDestroy() {
    document.body.classList.remove('overflow-hidden');
    
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
