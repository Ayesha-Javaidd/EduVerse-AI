import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [FormsModule, CommonModule, ButtonComponent],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.css',
})
export class FiltersComponent {
  /** Config for dropdowns */
  @Input() dropdowns: { key: string; label: string; options: string[] }[] = [];

  /** Config for search */
  @Input() searchPlaceholder = 'Search...';

  /** Current values */
  filters: { [key: string]: string } = { search: '' };

  /** Emits updated filters */
  @Output() filtersChange = new EventEmitter<{ [key: string]: string }>();

  ngOnInit() {
    this.dropdowns.forEach((d) => {
      if (!(d.key in this.filters)) {
        this.filters[d.key] = '';
      }
    });

    this.filtersChange.emit({ ...this.filters });
  }

  /** Handle search or dropdown changes */
  updateFilter(key: string, value: string) {
    this.filters[key] = value;
    this.filtersChange.emit({ ...this.filters });
  }

  resetFilters() {
    // Reset search
    this.filters['search'] = '';

    this.dropdowns.forEach((dropdown) => {
      this.filters[dropdown.key] = '';
    });

    this.filtersChange.emit({ ...this.filters });
  }
}
