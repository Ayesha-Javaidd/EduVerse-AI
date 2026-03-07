import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ENDPOINTS } from '../constants/api.constants';

export interface AdminTeacher {
    id?: string;
    _id?: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    assignedCourses?: any[];
}

export interface AdminStudent {
    _id: string;
    fullName: string;
    email: string;
    country?: string;
    status: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('eduverse_access_token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    // Fetch all teachers (Admin only)
    getTeachers(): Observable<AdminTeacher[]> {
        return this.http.get<{ total: number, teachers: AdminTeacher[] }>(`${ENDPOINTS.ADMINS.BASE}/teachers`, {
            headers: this.getHeaders()
        }).pipe(
            map(response => response.teachers || [])
        );
    }

    // Fetch all students (Admin only)
    getStudents(): Observable<AdminStudent[]> {
        return this.http.get<{ total: number, students: AdminStudent[] }>(`${ENDPOINTS.ADMINS.BASE}/students`, {
            headers: this.getHeaders()
        }).pipe(
            map(response => response.students || [])
        );
    }

    // Fetch all courses (Admin only)
    getCourses(): Observable<any[]> {
        return this.http.get<{ total: number, courses: any[] }>(`${ENDPOINTS.ADMINS.BASE}/courses`, {
            headers: this.getHeaders()
        }).pipe(
            map(response => response.courses || [])
        );
    }

    // Delete a teacher
    deleteTeacher(teacherId: string): Observable<any> {
        return this.http.delete(`${ENDPOINTS.TEACHERS.BASE}/${teacherId}`, {
            headers: this.getHeaders()
        });
    }



    // Create a teacher
    createTeacher(data: any): Observable<any> {
        return this.http.post(`${ENDPOINTS.TEACHERS.BASE}/`, data, {
            headers: this.getHeaders()
        });
    }

    // Update a teacher
    updateTeacher(teacherId: string, data: any): Observable<any> {
        // Remove id/_id from payload to avoid 422
        const { id, _id, ...updateData } = data;
        return this.http.put(`${ENDPOINTS.TEACHERS.BASE}/${teacherId}`, updateData, {
            headers: this.getHeaders()
        });
    }

    // Create a student
    createStudent(data: any): Observable<any> {
        const tenantId = localStorage.getItem('tenantId');
        return this.http.post(`${ENDPOINTS.STUDENTS.BASE}/${tenantId}`, data, {
            headers: this.getHeaders()
        });
    }

    // Update a student
    updateStudent(studentId: string, data: any): Observable<any> {
        const tenantId = localStorage.getItem('tenantId');
        // Remove id/_id from payload
        const { id, _id, ...updateData } = data;
        return this.http.patch(`${ENDPOINTS.STUDENTS.BASE}/${tenantId}/${studentId}`, updateData, {
            headers: this.getHeaders()
        });
    }

    // Delete a student
    deleteStudent(studentId: string): Observable<any> {
        const tenantId = localStorage.getItem('tenantId');
        return this.http.delete(`${ENDPOINTS.STUDENTS.BASE}/${tenantId}/${studentId}`, {
            headers: this.getHeaders()
        });
    }

    // Create a course
    createCourse(data: any): Observable<any> {
        return this.http.post(`${ENDPOINTS.COURSES.BASE}/`, data, {
            headers: this.getHeaders()
        });
    }

    // Update a course
    updateCourse(courseId: string, data: any): Observable<any> {
        // Remove id/_id from payload
        const { id, _id, instructorName, enrolledStudents, ...updateData } = data;
        const tenantId = localStorage.getItem('tenantId');
        return this.http.put(`${ENDPOINTS.COURSES.BASE}/${courseId}?tenantId=${tenantId}`, updateData, {
            headers: this.getHeaders()
        });
    }

    // Delete a course
    deleteCourse(courseId: string): Observable<any> {
        const tenantId = localStorage.getItem('tenantId');
        return this.http.delete(`${ENDPOINTS.COURSES.BASE}/${courseId}?tenantId=${tenantId}`, {
            headers: this.getHeaders()
        });
    }
}
