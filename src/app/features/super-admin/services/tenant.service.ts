import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class TenantService {
    private tenants = [
        {
            id: 1,
            name: 'Innovate Inc.',
            adminEmail: 'admin@innovate.com',
            contactNumber: '+1 (555) 123-4567',
            address: '123 Innovation Drive, Tech City, TX 75001',
            subscription: {
                plan: 'Enterprise',
                startDate: new Date('2025-01-15'),
                expiryDate: new Date('2026-01-14'),
                status: 'Active',
            },
            courses: 25,
            teachers: 18,
            students: 150,
        },
        {
            id: 2,
            name: 'Quantum Solutions',
            adminEmail: 'admin@quantum.com',
            contactNumber: '+1 (555) 333-9999',
            address: '42 Quantum Lane, Future City, TX 75001',
            subscription: {
                plan: 'Trial',
                startDate: new Date('2025-09-01'),
                expiryDate: new Date('2025-10-01'),
                status: 'Active',
            },
            courses: 42,
            teachers: 25,
            students: 220,
        },
        {
            id: 3,
            name: 'Synergy Corp',
            adminEmail: 'support@synergy.org',
            contactNumber: '+1 (555) 111-2222',
            address: '15 Harmony Street, Austin, TX 73301',
            subscription: {
                plan: 'Free',
                startDate: new Date('2025-05-01'),
                expiryDate: new Date('2026-05-01'),
                status: 'Inactive',
            },
            courses: 15,
            teachers: 5,
            students: 85,
        },
        {
            id: 4,
            name: 'Apex Enterprises',
            adminEmail: 'info@apexent.com',
            contactNumber: '+1 (555) 555-8888',
            address: '78 Summit Blvd, Dallas, TX 75201',
            subscription: {
                plan: 'Premium',
                startDate: new Date('2025-03-10'),
                expiryDate: new Date('2026-03-09'),
                status: 'Active',
            },
            courses: 60,
            teachers: 35,
            students: 310,
        },
        {
            id: 5,
            name: 'Global Tech',
            adminEmail: 'contact@globaltech.io',
            contactNumber: '+1 (555) 909-7777',
            address: '900 Silicon Avenue, San Jose, CA 95110',
            subscription: {
                plan: 'Free',
                startDate: new Date('2025-04-20'),
                expiryDate: new Date('2026-04-20'),
                status: 'Active',
            },
            courses: 18,
            teachers: 8,
            students: 95,
        },
        {
            id: 6,
            name: 'NextGen Academy',
            adminEmail: 'admin@nextgen.edu',
            contactNumber: '+1 (555) 876-5432',
            address: '55 Learning Park, Boston, MA 02108',
            subscription: {
                plan: 'Trial',
                startDate: new Date('2025-10-01'),
                expiryDate: new Date('2025-11-01'),
                status: 'Active',
            },
            courses: 28,
            teachers: 12,
            students: 175,
        },
        {
            id: 7,
            name: 'TechHub Learning',
            adminEmail: 'support@techhub.com',
            contactNumber: '+1 (555) 444-1212',
            address: '77 Innovation Road, Seattle, WA 98101',
            subscription: {
                plan: 'Enterprise',
                startDate: new Date('2025-02-01'),
                expiryDate: new Date('2026-02-01'),
                status: 'Active',
            },
            courses: 35,
            teachers: 20,
            students: 200,
        },
        {
            id: 8,
            name: 'EduSphere',
            adminEmail: 'contact@edusphere.com',
            contactNumber: '+1 (555) 555-2525',
            address: '12 Knowledge Street, Denver, CO 80202',
            subscription: {
                plan: 'Basic',
                startDate: new Date('2024-10-01'),
                expiryDate: new Date('2025-10-01'),
                status: 'Expired',
            },
            courses: 12,
            teachers: 6,
            students: 65,
        },
    ];

    private selectedTenant$ = new BehaviorSubject<any>(null);

    /** Returns a simplified version for table view */
    getTenants() {
        return this.tenants.map((t) => ({
            id: t.id,
            name: t.name,
            email: t.adminEmail,
            courses: t.courses,
            teachers: t.teachers,
            students: t.students,
            subscription: this.mapSubscriptionStatus(t.subscription.status),
        }));
    }

    /** Optionally normalize subscription statuses to match your old labels */
    private mapSubscriptionStatus(status: string): string {
        switch (status) {
            case 'Active':
                return 'Paid';
            case 'Inactive':
                return 'Free';
            case 'Expired':
                return 'Expired';
            default:
                return status;
        }
    }

    getTenantById(id: number) {
        return this.tenants.find((t) => t.id === id);
    }
// getTenantById(id: number) {
//   const tenant = this.tenants.find(t => t.id === id);
//   if (tenant) {
//     return {
//       ...tenant,
//       subscription: {
//         ...tenant.subscription,
//         startDate: new Date(tenant.subscription.startDate),
//         expiryDate: new Date(tenant.subscription.expiryDate),
//       },
//     };
//   }
//   return null;
// }


    setSelectedTenant(tenant: any) {
        this.selectedTenant$.next(tenant);
    }

    getSelectedTenant() {
        return this.selectedTenant$.asObservable();
    }

    updateTenant(updatedTenant: any) {
        const index = this.tenants.findIndex((t) => t.id === updatedTenant.id);
        if (index > -1) {
            this.tenants[index] = { ...updatedTenant };
            this.selectedTenant$.next({ ...this.tenants[index] });
        }
    }
}
