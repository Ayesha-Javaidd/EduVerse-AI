import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'multiselect' | 'array';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-entity-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        this.formData[field.name] = this.initialData?.[field.name] || '';
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
      if (field.required) {
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
      if (field.type === 'password' && field.required === false) {
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
}
