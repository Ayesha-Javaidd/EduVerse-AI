import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { CourseMetadataService } from '../../../../shared/services/course-metadata.service';

@Component({
  selector: 'app-course-categories-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './course-categories-settings.component.html',
})
export class CourseCategoriesSettingsComponent implements OnInit {
  systemCategories: string[] = [];
  customCategories: string[] = [];
  initialCustomCategories: string[] = [];
  newCategory = '';
  editingIndex: number | null = null;
  editingValue = '';
  isLoading = true;
  isSaving = false;
  error: string | null = null;

  constructor(
    private courseMetadataService: CourseMetadataService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(forceRefresh = false): void {
    this.isLoading = true;
    this.error = null;

    this.courseMetadataService.getMetadata(forceRefresh).subscribe({
      next: (metadata) => {
        this.systemCategories = metadata.systemCategories ?? [];
        this.customCategories = [...(metadata.customCategories ?? [])];
        this.initialCustomCategories = [...this.customCategories];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load course categories:', err);
        this.error = 'Unable to load course categories.';
        this.isLoading = false;
      },
    });
  }

  addCategory(): void {
    const normalizedCategory = this.normalizeCategory(this.newCategory);
    if (!normalizedCategory) {
      return;
    }

    if (this.hasCategory(normalizedCategory)) {
      this.toastService.warning('That category already exists');
      return;
    }

    this.customCategories = [...this.customCategories, normalizedCategory];
    this.newCategory = '';
  }

  startEditing(index: number): void {
    this.editingIndex = index;
    this.editingValue = this.customCategories[index];
  }

  cancelEditing(): void {
    this.editingIndex = null;
    this.editingValue = '';
  }

  saveEditing(): void {
    if (this.editingIndex === null) {
      return;
    }

    const normalizedCategory = this.normalizeCategory(this.editingValue);
    if (!normalizedCategory) {
      return;
    }

    const duplicateCategory =
      this.systemCategories.some(
        (item) => item.toLowerCase() === normalizedCategory.toLowerCase()
      ) ||
      this.customCategories.some(
        (item, index) =>
          item.toLowerCase() === normalizedCategory.toLowerCase() &&
          index !== this.editingIndex
      );
    if (duplicateCategory) {
      this.toastService.warning('That category already exists');
      return;
    }

    this.customCategories = this.customCategories.map((category, index) =>
      index === this.editingIndex ? normalizedCategory : category
    );
    this.cancelEditing();
  }

  removeCategory(index: number): void {
    this.customCategories = this.customCategories.filter((_, i) => i !== index);
    if (this.editingIndex === index) {
      this.cancelEditing();
    }
  }

  saveCategories(): void {
    this.isSaving = true;
    const payload = this.customCategories
      .map((category) => this.normalizeCategory(category))
      .filter(Boolean);

    this.courseMetadataService.updateCategories(payload).subscribe({
      next: (metadata) => {
        this.systemCategories = metadata.systemCategories ?? [];
        this.customCategories = [...(metadata.customCategories ?? [])];
        this.initialCustomCategories = [...this.customCategories];
        this.isSaving = false;
        this.toastService.success('Course categories updated');
      },
      error: (err) => {
        console.error('Failed to save course categories:', err);
        this.isSaving = false;
        this.toastService.error(
          err?.error?.detail || 'Failed to update course categories'
        );
      },
    });
  }

  resetCustomCategories(): void {
    this.customCategories = [...this.initialCustomCategories];
    this.cancelEditing();
  }

  trackByIndex(index: number): number {
    return index;
  }

  get totalCategoryCount(): number {
    return this.systemCategories.length + this.customCategories.length;
  }

  get hasUnsavedChanges(): boolean {
    if (this.customCategories.length !== this.initialCustomCategories.length) {
      return true;
    }

    return this.customCategories.some(
      (category, index) =>
        this.normalizeCategory(category) !==
        this.normalizeCategory(this.initialCustomCategories[index] || '')
    );
  }

  private hasCategory(category: string): boolean {
    const normalizedKey = category.toLowerCase();
    return [...this.systemCategories, ...this.customCategories].some(
      (item) => item.toLowerCase() === normalizedKey
    );
  }

  private normalizeCategory(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }
}
