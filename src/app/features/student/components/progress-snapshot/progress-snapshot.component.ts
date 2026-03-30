import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-snapshot',
  imports: [CommonModule],
  templateUrl: './progress-snapshot.component.html',
  styleUrl: './progress-snapshot.component.css',
})
export class ProgressSnapshotComponent {
  @Input() progress: number = 0;
}
