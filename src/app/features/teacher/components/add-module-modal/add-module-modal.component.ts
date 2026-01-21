import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Module } from '../../../../shared/models/course-builder.model';

@Component({
  selector: 'app-add-module-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-module-modal.component.html',
  styleUrl: './add-module-modal.component.css',
})
export class AddModuleModalComponent implements OnInit {
  @Input() module: Module | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<Module>>();

  title: string = '';
  description: string = '';

  isEditMode = false;

  ngOnInit(): void {
    if (this.module) {
      this.isEditMode = true;
      this.title = this.module.title;
      this.description = this.module.description || '';
    }
  }

  get isValid(): boolean {
    return this.title.trim().length >= 3;
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    if (!this.isValid) return;

    this.save.emit({
      title: this.title.trim(),
      description: this.description.trim(),
    });
  }
}
