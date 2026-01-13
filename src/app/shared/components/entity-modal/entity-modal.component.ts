import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'multiselect' | 'array';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

@Component({
  selector: 'app-entity-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="onBackdropClick($event)">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex justify-between items-center p-6 border-b">
          <h2 class="text-2xl font-bold text-gray-800">{{ title }}</h2>
          <button (click)="close()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <div *ngFor="let field of fields" class="space-y-2">
            <!-- Text/Email/Password Input -->
            <div *ngIf="field.type === 'text' || field.type === 'email' || field.type === 'password'">
              <label class="block text-sm font-medium text-gray-700">
                {{ field.label }}
                <span *ngIf="field.required" class="text-red-500">*</span>
              </label>
              <input
                [type]="field.type"
                [(ngModel)]="formData[field.name]"
                [name]="field.name"
                [required]="!!field.required"
                [placeholder]="field.placeholder || ''"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Textarea -->
            <div *ngIf="field.type === 'textarea'">
              <label class="block text-sm font-medium text-gray-700">
                {{ field.label }}
                <span *ngIf="field.required" class="text-red-500">*</span>
              </label>
              <textarea
                [(ngModel)]="formData[field.name]"
                [name]="field.name"
                [required]="!!field.required"
                [placeholder]="field.placeholder || ''"
                rows="3"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <!-- Select Dropdown -->
            <div *ngIf="field.type === 'select'">
              <label class="block text-sm font-medium text-gray-700">
                {{ field.label }}
                <span *ngIf="field.required" class="text-red-500">*</span>
              </label>
              <select
                [(ngModel)]="formData[field.name]"
                [name]="field.name"
                [required]="!!field.required"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select {{ field.label }}</option>
                <option *ngFor="let opt of field.options" [value]="opt.value">{{ opt.label }}</option>
              </select>
            </div>

            <!-- Array Input (for qualifications, subjects, etc.) -->
            <div *ngIf="field.type === 'array'">
              <label class="block text-sm font-medium text-gray-700">
                {{ field.label }}
                <span *ngIf="field.required" class="text-red-500">*</span>
              </label>
              <div class="space-y-2">
                <div *ngFor="let item of formData[field.name]; let i = index; trackBy: trackByFn" class="flex gap-2">
                  <input
                    type="text"
                    [(ngModel)]="formData[field.name][i]"
                    [name]="field.name + '_' + i"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    [placeholder]="field.placeholder || 'Enter ' + field.label"
                  />
                  <button
                    type="button"
                    (click)="removeArrayItem(field.name, i)"
                    class="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
                <button
                  type="button"
                  (click)="addArrayItem(field.name)"
                  class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <i class="fas fa-plus mr-2"></i>Add {{ field.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ errorMessage }}
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              (click)="close()"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="loading || isFormInvalid()"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {{ loading ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
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
  loading = false;
  errorMessage = '';

  ngOnInit() {
    this.initializeForm();
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
        this.formData[field.name] = this.initialData?.[field.name] || [''];
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
