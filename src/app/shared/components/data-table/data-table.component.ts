import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { Router ,RouterModule} from '@angular/router';
import { PaginationComponent } from '../pagination/pagination.component';



@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, ButtonComponent, PaginationComponent,RouterModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
})
export class DataTableComponent {
  /** Table title */
  @Input() title = 'Data Table';

  /** Columns to display */
  @Input() columns: TableColumn[] = [];

  /** Data rows */
  @Input() rows: unknown[] = [];

  /** Show View All button */
  @Input() showViewAll: boolean = false;

  /** Route to navigate when "View All" is clicked */
  @Input() viewAllRoute?: string;

  @Input() highlightedRowId?: string | null;

  getHighlightClass(row: unknown): string {
    const rowId = this.getRowId(row);
    if (this.highlightedRowId && rowId === this.highlightedRowId) {
      return 'bg-[#23A997]/10 border-l-4 border-l-[#23A997] transition-all duration-300';
    }
    return '';
  }

  /** Optional row click event */
  @Input() rowClickable: boolean = false;

  /** Row actions toggle */
  @Input() enableActions: boolean = false;

  @Input() visibleActions: string[] = ['edit', 'delete']; // NEW

  /** Emits when an action is triggered */
  @Output() edit = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  @Input() pageSize: number = 5; // how many rows per page → how many rows per page.
  @Input() totalItems: number = 0; // total number of rows → so it can pass this info down to pagination.
  @Input() currentPage: number = 1; // which page is active → determines which slice of rows to show (pagedRows).

  @Output() pageChange = new EventEmitter<number>(); // event to notify parent // → listens for pagination changes and emits them upward (so the parent page like TeachersComponent can update currentPage).

  /**
   * DataTable acts as a bridge:
   * It uses pagination internally and passes through the same inputs/outputs so the parent doesn’t have to talk to pagination directly.
   */

  get pagedRows(): unknown[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.rows.slice(start, start + this.pageSize);
  }

  constructor(private router: Router) {}

  onViewAllClick() {
    if (this.viewAllRoute) {
      this.router.navigate([this.viewAllRoute]);
    }
  }
  @Output() actionClick = new EventEmitter<any>();

  onActionClick(row: unknown) {
    this.actionClick.emit(row);
  }

  onEdit(row: unknown) {
    this.edit.emit(row);
  }

  onView(row: unknown) {
    this.view.emit(row);
  }

  onDelete(row: unknown) {
    this.delete.emit(row);
  }
  getProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 50) return 'bg-yellow-400';
  return 'bg-red-500';
}

  getRowId(row: unknown): string | undefined {
    const record = this.asRecord(row);
    const rowId = record['_id'] ?? record['id'];
    return typeof rowId === 'string' ? rowId : undefined;
  }

  getCellValue(row: unknown, key: string): string | number | Date | null | undefined {
    const value = this.asRecord(row)[key];
    if (value instanceof Date || typeof value === 'string' || typeof value === 'number' || value == null) {
      return value;
    }
    return String(value);
  }

  getTextValue(row: unknown, key: string): string {
    const value = this.asRecord(row)[key];
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  getNumberValue(row: unknown, key: string): number {
    const value = this.asRecord(row)[key];
    return typeof value === 'number' ? value : Number(value ?? 0);
  }

  getAvatarInitial(row: unknown, key: string): string {
    const preferredValue = this.getTextValue(row, key);
    if (preferredValue && preferredValue !== 'SP') {
      return preferredValue.charAt(0).toUpperCase();
    }

    const fallback = this.getPrimaryLabel(row);
    return fallback ? fallback.charAt(0).toUpperCase() : 'S';
  }

  getPrimaryLabel(row: unknown): string {
    return this.getTextValue(row, 'fullName') ||
      this.getTextValue(row, 'studentName') ||
      this.getTextValue(row, 'name');
  }

  getBadgeClass(row: unknown, key: string): string {
    const normalizedValue = this.getTextValue(row, key).toLowerCase();
    if (['active', 'published', 'enrolled', 'upcoming'].includes(normalizedValue)) {
      return 'bg-[#23A997]/10 text-[#23A997] border-[#23A997]/20';
    }
    if (['inactive', 'draft', 'dropped', 'graduated', 'completed'].includes(normalizedValue)) {
      return 'bg-slate-100 text-[#64748b] border-slate-200';
    }
    return 'bg-[#f8fafc] text-[#181F39] border-[#e2e8f0]';
  }

  private asRecord(row: unknown): Record<string, unknown> {
    return (row && typeof row === 'object') ? row as Record<string, unknown> : {};
  }

}

export interface TableColumn {
  key: string;                        // property name in row object
  label: string;                      // column header label
  type?: 'text' | 'badge' | 'avatar' | 'date' | 'action' | 'progress' | 'link';
  link?: string;                       // used when type = 'link'
  width?: string;                      // NEW: explicit width (e.g., '30%', '150px')
}
