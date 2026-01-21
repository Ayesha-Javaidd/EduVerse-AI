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
  @Input() rows: any[] = [];

  /** Show View All button */
  @Input() showViewAll: boolean = false;

  /** Route to navigate when "View All" is clicked */
  @Input() viewAllRoute?: string;

  /** Optional row click event */
  @Input() rowClickable: boolean = false;

  /** Row actions toggle */
  @Input() enableActions: boolean = false;

  @Input() visibleActions: string[] = ['edit', 'delete']; // NEW

  /** Emits when an action is triggered */
  @Output() edit = new EventEmitter();
  @Output() view = new EventEmitter();
  @Output() delete = new EventEmitter();

  @Input() pageSize: number = 5; // how many rows per page → how many rows per page.
  @Input() totalItems: number = 0; // total number of rows → so it can pass this info down to pagination.
  @Input() currentPage: number = 1; // which page is active → determines which slice of rows to show (pagedRows).

  @Output() pageChange = new EventEmitter<number>(); // event to notify parent // → listens for pagination changes and emits them upward (so the parent page like TeachersComponent can update currentPage).

  /**
   * DataTable acts as a bridge:
   * It uses pagination internally and passes through the same inputs/outputs so the parent doesn’t have to talk to pagination directly.
   */

  get pagedRows(): any[] {
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

  onActionClick(row: any) {
    this.actionClick.emit(row);
  }

  onEdit(row: any) {
    this.edit.emit(row);
  }

  onDelete(row: any) {
    this.delete.emit(row);
  }
  getProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 50) return 'bg-yellow-400';
  return 'bg-red-500';
}

}

export interface TableColumn {
  key: string;                        // property name in row object
  label: string;                      // column header label
  type?: 'text' | 'badge' | 'avatar' | 'date' | 'action' | 'progress' | 'link';
  badgeColors?: { [key: string]: string }; // used only when type = 'badge'
  link?: string;                       // used when type = 'link'
}
