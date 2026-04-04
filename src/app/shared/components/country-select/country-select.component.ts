import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
  forwardRef,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';

import {
  COUNTRY_LIST,
  normalizeCountryName,
  isoToFlag,
} from '../../constants/countries';

@Component({
  selector: 'app-country-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './country-select.component.html',
  styleUrl: './country-select.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountrySelectComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CountrySelectComponent),
      multi: true,
    },
  ],
})
export class CountrySelectComponent
  implements ControlValueAccessor, Validator
{
  @Input() placeholder = 'Select country';
  @Input() required = false;
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  readonly countries = COUNTRY_LIST;

  disabled = false;
  isOpen = false;
  searchTerm = '';
  touched = false;
  value = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidationChange: () => void = () => {};

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  /** Flag emoji for the currently selected value */
  get selectedFlag(): string {
    if (!this.value) return '';
    const entry = this.countries.find(
      (c) => c.name.toLowerCase() === this.value.toLowerCase(),
    );
    return entry?.flag ?? '';
  }

  get filteredCountries() {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return this.countries;
    }

    return this.countries.filter((c) =>
      c.name.toLowerCase().includes(query),
    );
  }

  writeValue(value: string | null | undefined): void {
    this.value = normalizeCountryName(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidationChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.closeDropdown(false);
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const value = normalizeCountryName(control.value ?? this.value);
    if (this.required && !value.trim()) {
      return { required: true };
    }

    return null;
  }

  toggleDropdown(): void {
    if (this.disabled) {
      return;
    }

    if (this.isOpen) {
      this.closeDropdown();
      return;
    }

    this.isOpen = true;
    this.searchTerm = '';

    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    });
  }

  handleSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  selectCountry(country: { iso2: string; name: string; flag: string }): void {
    this.value = country.name;
    this.touched = true;
    this.onChange(country.name);
    this.onTouched();
    this.onValidationChange();
    this.closeDropdown(false);
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (this.isOpen && target && !this.elementRef.nativeElement.contains(target)) {
      this.closeDropdown();
    }
  }

  private closeDropdown(markTouched = true): void {
    this.isOpen = false;
    this.searchTerm = '';

    if (markTouched) {
      this.touched = true;
      this.onTouched();
      this.onValidationChange();
    }
  }
}
