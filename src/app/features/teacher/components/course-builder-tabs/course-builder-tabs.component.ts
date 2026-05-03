import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

type TabType = 'content' | 'settings' | 'students';

interface Tab {
  id: TabType;
  label: string;
}

@Component({
  selector: 'app-course-builder-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-builder-tabs.component.html',
  styleUrl: './course-builder-tabs.component.css',
})
export class CourseBuilderTabsComponent {
  @Input() activeTab: TabType = 'content';
  @Output() tabChange = new EventEmitter<TabType>();

  tabs: Tab[] = [
    { id: 'content', label: 'Content Builder' },
    { id: 'settings', label: 'Course Settings' },
    { id: 'students', label: 'Enrolled Students' },
  ];

  onTabClick(tab: TabType): void {
    this.tabChange.emit(tab);
  }
}
