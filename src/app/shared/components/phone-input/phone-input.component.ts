import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, forwardRef, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, Validator, AbstractControl, ValidationErrors, NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import intlTelInput from 'intl-tel-input';

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `<input #phoneInput type="tel" [attr.placeholder]="placeholder" />`,
  styles: [`
    .iti { width: 100%; }
    .iti input {
      width: 100%;
      height: 46px;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      background: white;
      padding-right: 16px;
      color: #181F39;
      font-size: 15px;
      outline: none;
      transition: all 0.2s;
    }
    html body .iti input[type=tel] {
      padding-left: 90px; /* Space for the dial code */
    }
    .iti input:focus {
      border-color: #23A997;
      box-shadow: 0 0 0 4px rgba(35, 169, 151, 0.2);
    }
    .iti__selected-country {
      border-radius: 12px 0 0 12px;
      padding-left: 12px;
    }
    .iti__country-list {
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.12);
      border: 1px solid #e2e8f0;
      max-height: 220px;
    }
    .iti__country {
      padding: 8px 12px;
    }
    .iti__country:hover {
      background: #f1f5f9;
    }
    .iti__country.iti__highlight {
      background: rgba(35, 169, 151, 0.08);
    }
    .iti__search-input {
      padding-left: 36px; /* Space for the search icon */
      border-radius: 8px;
    }
    .ng-invalid.ng-touched .iti input {
      border-color: #ef4444;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    }
  ]
})
export class PhoneInputComponent implements AfterViewInit, OnDestroy, ControlValueAccessor, Validator {
  @ViewChild('phoneInput') phoneInput!: ElementRef<HTMLInputElement>;
  @Input() placeholder = 'Enter phone number';

  private iti: any;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private initialValue = '';

  ngAfterViewInit(): void {
    this.iti = intlTelInput(this.phoneInput.nativeElement, {
      initialCountry: 'auto',
      separateDialCode: true,
      formatOnDisplay: true,
      countrySearch: true,
      fixDropdownWidth: false,
      geoIpLookup: (callback) => {
        fetch('https://ipapi.co/json')
          .then((res) => res.json())
          .then((data) => callback(data.country_code))
          .catch(() => callback('us'));
      },
      utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@26.9.1/build/js/utils.js'
    });

    if (this.initialValue) {
      this.iti.setNumber(this.initialValue);
    }

    this.phoneInput.nativeElement.addEventListener('input', () => {
      this.onChange(this.iti.getNumber());
    });

    this.phoneInput.nativeElement.addEventListener('blur', () => {
      this.onTouched();
      this.onValidationChange();
    });

    this.phoneInput.nativeElement.addEventListener('countrychange', () => {
      this.onChange(this.iti.getNumber());
      this.onValidationChange();
    });
  }

  ngOnDestroy(): void {
    if (this.iti) {
      this.iti.destroy();
    }
  }

  writeValue(value: string): void {
    this.initialValue = value || '';
    if (this.iti) {
      this.iti.setNumber(this.initialValue);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  private onValidationChange: () => void = () => {};

  registerOnValidatorChange(fn: () => void): void {
    this.onValidationChange = fn;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.iti) return null;
    const value = control.value;
    
    if (!value) return null; // Let standard required validators handle empty

    if (!this.iti.isValidNumber()) {
      return { invalidPhone: true };
    }
    
    return null;
  }
}
