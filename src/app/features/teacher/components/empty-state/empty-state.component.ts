import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonComponent } from "../../../../shared/components/button/button.component";

@Component({
  selector: 'app-empty-state',
  imports: [ButtonComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  @Input() title = 'No Assignments Yet';
  @Input() description = 'Get started by creating your first assignment';
  @Input() iconClass = 'fa-solid fa-folder-open';
  @Input() actionLabel = 'Create Assignment';
  @Input() showAction = true;

  @Output() createClick = new EventEmitter<void>();
}
