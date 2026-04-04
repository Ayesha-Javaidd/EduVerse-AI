import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

import { ENDPOINTS } from '../../core/constants/api.constants';
import { CourseMetadata } from '../models/course-metadata.model';

@Injectable({
  providedIn: 'root',
})
export class CourseMetadataService {
  private metadata$?: Observable<CourseMetadata>;

  constructor(private http: HttpClient) {}

  getMetadata(forceRefresh = false): Observable<CourseMetadata> {
    if (!this.metadata$ || forceRefresh) {
      this.metadata$ = this.http
        .get<CourseMetadata>(ENDPOINTS.COURSES.METADATA)
        .pipe(shareReplay(1));
    }

    return this.metadata$;
  }

  updateCategories(categories: string[]): Observable<CourseMetadata> {
    return this.http
      .put<CourseMetadata>(ENDPOINTS.COURSES.METADATA_CATEGORIES, { categories })
      .pipe(
        tap((metadata) => {
          this.metadata$ = of(metadata).pipe(shareReplay(1));
        })
      );
  }
}
