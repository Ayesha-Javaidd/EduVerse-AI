import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CountrySelectComponent } from '../country-select/country-select.component';
import { PhoneInputComponent } from '../phone-input/phone-input.component';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'multiselect' | 'array' | 'phone' | 'country';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  colSpan?: 1 | 2;
}

@Component({
  selector: 'app-entity-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PhoneInputComponent, CountrySelectComponent],
  templateUrl: './entity-modal.component.html',
  styles: []
})
export class EntityModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() title = 'Add Entity';
  @Input() fields: FormField[] = [];
  @Input() initialData: any = null;
  @Input() isEditMode = false;
  @Output() close$ = new EventEmitter<void>();
  @Output() submit$ = new EventEmitter<any>();

  formData: any = {};
  showPasswords: { [key: string]: boolean } = {};
  loading = false;
  errorMessage = '';

  ngOnInit() {
    this.initializeForm();
  }

  togglePassword(fieldName: string) {
    this.showPasswords[fieldName] = !this.showPasswords[fieldName];
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.initializeForm();
    }
  }

  initializeForm() {
    this.formData = {};
    this.errorMessage = '';

    // Initialize form data
    this.fields.forEach(field => {
      if (field.type === 'array') {
        const initialArray = this.initialData?.[field.name];
        this.formData[field.name] = Array.isArray(initialArray) ? [...initialArray] : [''];
      } else {
        this.formData[field.name] = this.initialData?.[field.name] ?? '';
      }
    });
  }

  trackByFn(index: number, item: any): number {
    return index;
  }

  addArrayItem(fieldName: string) {
    if (!this.formData[fieldName]) {
      this.formData[fieldName] = [];
    }
    this.formData[fieldName].push('');
  }

  removeArrayItem(fieldName: string, index: number) {
    this.formData[fieldName].splice(index, 1);
  }

  onBackdropClick(event: MouseEvent) {
    this.close();
  }

  close() {
    this.isOpen = false;
    this.close$.emit();
  }

  isFormInvalid(): boolean {
    return this.fields.some(field => {
      const isPasswordInEdit = this.isEditMode && field.type === 'password';
      if (field.required && !isPasswordInEdit) {
        const val = this.formData[field.name];
        if (field.type === 'array') {
          return !val || val.length === 0 || val.every((i: string) => !i || i.trim() === '');
        }
        return !val || (typeof val === 'string' && val.trim() === '');
      }
      return false;
    });
  }

  hasUnsavedChanges(): boolean {
    if (!this.isEditMode || !this.initialData) return true;

    for (const field of this.fields) {
      if (field.type === 'password') {
        if (this.formData[field.name]) return true;
        continue;
      }

      let current = this.formData[field.name];
      let initial = this.initialData[field.name];

      if (field.type === 'array') {
        current = (current || []).filter((i: string) => i && i.trim() !== '');
        initial = (initial || []).filter((i: string) => i && i.trim() !== '');
        if (JSON.stringify(current) !== JSON.stringify(initial)) return true;
      } else {
        current = current == null ? '' : String(current);
        initial = initial == null ? '' : String(initial);
        if (current !== initial) return true;
      }
    }
    return false;
  }

  onSubmit() {
    if (this.isFormInvalid()) {
      this.errorMessage = 'Please fill in all required fields marked with *';
      return;
    }

    this.errorMessage = '';

    // Clean up array fields (remove empty strings)
    const cleanedData = { ...this.formData };
    this.fields.forEach(field => {
      if (field.type === 'array' && cleanedData[field.name]) {
        cleanedData[field.name] = cleanedData[field.name].filter((item: string) => item.trim() !== '');
      }
    });

    this.submit$.emit(cleanedData);
  }

  resolvePhoneCountry(fieldName: string): string {
    const linkedCountryField = this.fields.find((field) => field.type === 'country');
    if (linkedCountryField) {
      return this.formData[linkedCountryField.name] ?? '';
    }

    return this.formData.country || this.formData.address || '';
  }

  shouldSpanFullWidth(field: FormField, index: number): boolean {
    if (field.colSpan === 2 || field.type === 'textarea' || field.type === 'array') {
      return true;
    }

    const singleColumnFields = this.fields.filter(
      (currentField) =>
        currentField.colSpan !== 2 &&
        currentField.type !== 'textarea' &&
        currentField.type !== 'array'
    );

    if (singleColumnFields.length % 2 === 1) {
      const lastSingleColumnField = singleColumnFields[singleColumnFields.length - 1];
      return this.fields[index] === lastSingleColumnField;
    }

    return false;
  }
}
