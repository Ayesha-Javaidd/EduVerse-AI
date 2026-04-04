import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, forwardRef, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, Validator, AbstractControl, ValidationErrors, NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import intlTelInput from 'intl-tel-input';
import { normalizeCountryIso2 } from '../../constants/countries';

type IntlTelCountry = ReturnType<typeof intlTelInput.getCountryData>[number];
type IntlTelCountryIso2 = IntlTelCountry['iso2'];
const PHONE_WRAPPER_CLASSES = ['w-full'];
const PHONE_SELECTED_COUNTRY_CLASSES = ['rounded-l-xl', 'pl-3'];
const PHONE_COUNTRY_LIST_CLASSES = [
  'max-h-[220px]',
  'rounded-xl',
  'border',
  'border-slate-200',
  'shadow-[0_10px_40px_rgba(0,0,0,0.12)]',
];
const PHONE_COUNTRY_OPTION_CLASSES = ['px-3', 'py-2', 'transition-colors', 'hover:bg-slate-100'];
const PHONE_SEARCH_INPUT_CLASSES = ['rounded-lg', 'pl-9'];

function extractLocaleCountry(locale: string): IntlTelCountryIso2 | '' {
  try {
    const region = new Intl.Locale(locale).region?.toLowerCase() ?? '';
    const normalizedRegion = normalizeCountryIso2(region);
    if (normalizedRegion) {
      return normalizedRegion as IntlTelCountryIso2;
    }
  } catch {
    // Fall through to the regex-based parser below.
  }

  const match = locale.toLowerCase().match(/[-_]([a-z]{2})$/);
  if (!match) {
    return '';
  }

  const region = match[1];
  return normalizeCountryIso2(region) as IntlTelCountryIso2 | '';
}

function resolveBrowserCountry(): IntlTelCountryIso2 | '' {
  if (typeof navigator === 'undefined') {
    return '';
  }

  const locales = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
  for (const locale of locales) {
    const country = extractLocaleCountry(locale);
    if (country) {
      return country;
    }
  }

  return '';
}

function resolveAutoCountry(
  success: (country: IntlTelCountryIso2) => void,
  failure: () => void,
): void {
  const localeCountry = resolveBrowserCountry();
  if (localeCountry) {
    success(localeCountry);
    return;
  }

  fetch('https://ipapi.co/json')
    .then((response) => response.json())
    .then((data) => {
      const detectedCountry = normalizeCountryIso2(data?.country_code);
      if (detectedCountry) {
        success(detectedCountry as IntlTelCountryIso2);
        return;
      }

      failure();
    })
    .catch(() => failure());
}

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'block w-full',
  },
  templateUrl: './phone-input.component.html',
  styleUrl: './phone-input.component.css',
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
  @Input() initialCountry: IntlTelCountryIso2 | '' = resolveBrowserCountry();
  @Input() set country(value: string | null | undefined) {
    this.countryValue = value ?? '';
    this.syncCountryFromInput();
  }

  private iti: any;
  private isDisabled = false;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private initialValue = '';
  private countryValue = '';
  private rafId: number | null = null;

  private readonly handleInput = () => {
    this.onChange(this.iti.getNumber());
  };

  private readonly handleBlur = () => {
    this.onTouched();
    this.onValidationChange();
  };

  private readonly handleCountryChange = () => {
    this.onChange(this.iti.getNumber());
    this.onValidationChange();
    this.scheduleUiSync();
  };

  ngAfterViewInit(): void {
    const resolvedInputCountry = normalizeCountryIso2(this.countryValue) || this.initialCountry || '';
    this.iti = intlTelInput(this.phoneInput.nativeElement, {
      initialCountry: resolvedInputCountry ? (resolvedInputCountry as IntlTelCountryIso2) : 'auto',
      separateDialCode: true,
      formatOnDisplay: false,
      formatAsYouType: false,
      countrySearch: true,
      fixDropdownWidth: false,
      strictMode: true,
      geoIpLookup: resolvedInputCountry ? null : resolveAutoCountry,
      loadUtils: () => import('intl-tel-input/utils')
    });

    this.scheduleUiSync();

    this.phoneInput.nativeElement.disabled = this.isDisabled;

    if (this.initialValue) {
      this.iti.setNumber(this.initialValue);
      this.scheduleUiSync();
    }

    this.phoneInput.nativeElement.addEventListener('input', this.handleInput);
    this.phoneInput.nativeElement.addEventListener('blur', this.handleBlur);
    this.phoneInput.nativeElement.addEventListener('countrychange', this.handleCountryChange);
  }

  ngOnDestroy(): void {
    if (this.phoneInput?.nativeElement) {
      this.phoneInput.nativeElement.removeEventListener('input', this.handleInput);
      this.phoneInput.nativeElement.removeEventListener('blur', this.handleBlur);
      this.phoneInput.nativeElement.removeEventListener('countrychange', this.handleCountryChange);
    }

    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
    }

    if (this.iti) {
      this.iti.destroy();
    }
  }

  writeValue(value: string): void {
    this.initialValue = value || '';
    if (this.iti) {
      this.iti.setNumber(this.initialValue);
      this.scheduleUiSync();
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;

    if (this.phoneInput) {
      this.phoneInput.nativeElement.disabled = isDisabled;
    }
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

  private applyPluginClasses(): void {
    if (!this.phoneInput) {
      return;
    }

    const container = this.phoneInput.nativeElement.closest('.iti');
    const selectedCountry = container?.querySelector<HTMLElement>('.iti__selected-country');
    const countryList = container?.querySelector<HTMLElement>('.iti__country-list');
    const searchInput = container?.querySelector<HTMLElement>('.iti__search-input');
    const countryOptions = container?.querySelectorAll<HTMLElement>('.iti__country') ?? [];

    container?.classList.add(...PHONE_WRAPPER_CLASSES);
    selectedCountry?.classList.add(...PHONE_SELECTED_COUNTRY_CLASSES);
    countryList?.classList.add(...PHONE_COUNTRY_LIST_CLASSES);
    searchInput?.classList.add(...PHONE_SEARCH_INPUT_CLASSES);
    countryOptions.forEach((option) => option.classList.add(...PHONE_COUNTRY_OPTION_CLASSES));
  }

  private syncSelectedCountryState(): void {
    if (!this.phoneInput) {
      return;
    }

    const container = this.phoneInput.nativeElement.closest('.iti');
    const countryContainer = container?.querySelector<HTMLElement>('.iti__country-container');
    const globe = container?.querySelector<HTMLElement>('.iti__globe');
    const selectedCountryData = this.iti?.getSelectedCountryData?.();
    const hasSelectedCountry = Boolean(selectedCountryData?.iso2);

    if (countryContainer) {
      countryContainer.classList.toggle('hidden', !hasSelectedCountry);
    }

    if (globe) {
      globe.classList.toggle('hidden', !hasSelectedCountry);
    }

    if (!hasSelectedCountry) {
      this.phoneInput.nativeElement.style.paddingLeft = '1rem';
    }
  }

  private syncCountryFromInput(): void {
    const iso2 = normalizeCountryIso2(this.countryValue);
    if (!this.phoneInput) {
      return;
    }

    if (!this.iti || !iso2) {
      this.syncSelectedCountryState();
      return;
    }

    const selectedCountryData = this.iti.getSelectedCountryData?.();
    if ((selectedCountryData?.iso2 ?? '').toLowerCase() !== iso2) {
      this.iti.setCountry(iso2 as IntlTelCountryIso2);
    }

    this.syncSelectedCountryState();
  }

  private scheduleUiSync(): void {
    if (!this.phoneInput) {
      return;
    }

    const runSync = () => {
      this.applyPluginClasses();
      this.syncCountryFromInput();
      this.syncSelectedCountryState();
    };

    runSync();

    if (typeof requestAnimationFrame === 'function') {
      this.rafId = requestAnimationFrame(() => {
        runSync();
        this.rafId = null;
      });
      return;
    }

    setTimeout(runSync);
  }
}
