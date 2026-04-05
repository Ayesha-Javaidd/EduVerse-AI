import { Injectable } from '@angular/core';
import { CoursePlayerPreferences } from '../pages/course-player/course-player.models';
import { STORAGE_KEYS } from '../../../core/constants/app.constants';

@Injectable({
  providedIn: 'root',
})
export class CoursePlayerStorageService {
  restorePreferences(
    storageKey: string,
    minAiAssistantWidth: number,
    maxAiAssistantWidth: number,
  ): Partial<CoursePlayerPreferences> {
    try {
      const rawPrefs = localStorage.getItem(storageKey);
      if (!rawPrefs) {
        return {};
      }

      const prefs = JSON.parse(rawPrefs) as Partial<CoursePlayerPreferences>;
      const restoredPrefs: Partial<CoursePlayerPreferences> = {};

      if (typeof prefs.isSidebarOpen === 'boolean') {
        restoredPrefs.isSidebarOpen = prefs.isSidebarOpen;
      }
      if (typeof prefs.isAiAssistantOpen === 'boolean') {
        restoredPrefs.isAiAssistantOpen = prefs.isAiAssistantOpen;
      }
      if (typeof prefs.aiAssistantWidth === 'number') {
        restoredPrefs.aiAssistantWidth = Math.min(
          maxAiAssistantWidth,
          Math.max(minAiAssistantWidth, prefs.aiAssistantWidth),
        );
      }

      return restoredPrefs;
    } catch (error) {
      console.error('Failed to restore course player preferences', error);
      return {};
    }
  }

  persistPreferences(storageKey: string, preferences: CoursePlayerPreferences): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to persist course player preferences', error);
    }
  }

  getLessonNotesStorageKey(courseId: string, lessonId: string): string {
    return STORAGE_KEYS.coursePlayerLessonNotes(courseId, lessonId);
  }

  loadLessonNotes(storageKey: string): string {
    return storageKey ? localStorage.getItem(storageKey) || '' : '';
  }

  saveLessonNotes(storageKey: string, notes: string): void {
    if (!storageKey) {
      return;
    }
    localStorage.setItem(storageKey, notes);
  }
}
