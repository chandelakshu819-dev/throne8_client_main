// src/lib/api/company.service.ts
import config from "@/config/env.config";
import api from "./api.intance";

class CompanyService {

    // Step 1: Create Company
    static async createCompany(companyData: {
        companyName: string;
        email: string;
        phone: { country: string; number: string };
        industry: string;
        size: string;
        founded?: number;
        headquarters: {
            address: string;
            city: string;
            state: string;
            country: string;
            pincode?: string;
        };
        website?: string;
        descriptions?: {
            short?: string;
            tagline?: string;
        };
    }): Promise<any> {
        try {
            const { data } = await api.post(`${config.NEXT_PUBLIC_COMPANY_CREATE_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_CREATE_ENDPOINT}`, companyData);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create company');
        }
    }

    static async getAllCompanies(params?: { page?: number; pageSize?: number; search?: string }): Promise<any> {
        try {
            const { data } = await api.get(`${config.NEXT_PUBLIC_COMPANY_GET_ALL_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_GET_ALL_ENDPOINT}`, { params });
            console.log('Fetched all companies:', data); // Debug log
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch companies');
        }
    }

    static async getCompaniesForNetwork(params?: {
        page?: number;
        pageSize?: number;
    }): Promise<any> {
        try {
            const { data } = await api.get(`${config.NEXT_PUBLIC_COMPANY_GET_ALL_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_GET_ALL_ENDPOINT}`, { params });
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch companies');
        }
    }


    // Logo by logoId
    static async getLogoById(companyId: string, logoId: string): Promise<any> {
        try {
            const { data } = await api.get(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/logo/${logoId}`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch logo');
        }
    }

    // Cover by coverId
    static async getCoverById(companyId: string, coverId: string): Promise<any> {
        try {
            const { data } = await api.get(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/cover/${coverId}`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch cover');
        }
    }

    // GET company by companyId
    static async getCompany(companyId: string): Promise<any> {
        try {
            const { data } = await api.get(`${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}`);
            console.log('Fetched company data:', data); // Debug log
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch company');
        }
    }

    // GET active logo
    static async getCompanyLogos(companyId: string): Promise<any> {
        try {
            const { data } = await api.get(`${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/logos`);
            // console.log('Fetched company logos:', data); // Debug log
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch logos');
        }
    }

    // GET active cover
    static async getCompanyCovers(companyId: string): Promise<any> {
        try {
            const { data } = await api.get(`${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/covers`);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch covers');
        }
    }

    // Step 2: Upload Company Logo (optional)
    static async uploadCompanyLogo(companyId: string, logoFile: File): Promise<any> {
        try {
            const formData = new FormData();
            formData.append('logo', logoFile);

            const { data } = await api.post(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/logo`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to upload logo');
        }
    }

    // Step 3: Upload Company Cover (optional)
    static async uploadCompanyCover(companyId: string, coverFile: File): Promise<any> {
        try {
            const formData = new FormData();
            formData.append('cover', coverFile);

            const { data } = await api.post(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/cover`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to upload cover');
        }
    }

    //for employee management
    // company.service.ts ke CompanyService class ke andar add karo

    static async createEmployee(employeeData: {
        firstName: string;
        lastName: string;
        email: string;
        company: string;
        designation: string;
        department: string;
        joinDate: string;
        skills: string[];
        bio: string;
    }): Promise<any> {
        try {
            const { data } = await api.post(`${config.NEXT_PUBLIC_COMPANY_EMPLOYEES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_EMPLOYEES_ENDPOINT}/create`, employeeData);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create employee');
        }
    }

    static async getEmployeeById(employeeId: string): Promise<any> {
        try {
            const { data } = await api.get(`${config.NEXT_PUBLIC_COMPANY_EMPLOYEE_GET_BY_ID_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_EMPLOYEE_GET_BY_ID_ENDPOINT}/${employeeId}`);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch employee');
        }
    }

    static async getAllEmployees(companyId: string): Promise<any> {
        try {
            const { data } = await api.get(`${config.NEXT_PUBLIC_COMPANY_EMPLOYEES_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_EMPLOYEES_COMPANIES_ENDPOINT}/${companyId}`);
            // console.log('✅ getAllEmployees result:', data);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch employees');
        }
    }

    static async updateEmployee(employeeId: string, employeeData: Partial<{
        firstName: string;
        lastName: string;
        designation: string;
        department: string;
        joinDate: string;
        skills: string[];
        bio: string;
    }>): Promise<any> {
        try {
            const { data } = await api.put(`${config.NEXT_PUBLIC_COMPANY_EMPLOYEES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_EMPLOYEES_ENDPOINT}/${employeeId}`, employeeData);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update employee');
        }
    }

    static async deleteEmployee(employeeId: string): Promise<any> {
        try {
            const { data } = await api.delete(`${config.NEXT_PUBLIC_COMPANY_EMPLOYEES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_EMPLOYEES_ENDPOINT}/${employeeId}`);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete employee');
        }
    }

    static async toggleEmployeeStatus(employeeId: string): Promise<any> {
        try {
            const { data } = await api.patch(`${config.NEXT_PUBLIC_COMPANY_EMPLOYEES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_EMPLOYEES_ENDPOINT}/${employeeId}/status`);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to toggle employee status');
        }
    }

    // toggleEmployeeStatus ke baad add karo
    static async toggleEmployeeAdvocacy(companyId: string, employeeId: string, isAdvocate: boolean): Promise<any> {
        try {
            const { data } = await api.patch(
                `${config.NEXT_PUBLIC_COMPANY_EMPLOYEE_ADVOCACY_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_EMPLOYEE_ADVOCACY_ENDPOINT}/${companyId}/${employeeId}`,
                { isAdvocate }
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to toggle employee advocacy');
        }
    }

    static async createPost(formData: FormData): Promise<any> {
        try {
            // ✅ FIX: headers में Content-Type को explicitly delete karo
            // Axios default 'application/json' set karta hai jo FormData ke sath conflict karta hai
            const { data } = await api.post(
                `${config.NEXT_PUBLIC_COMPANY_POSTS_CREATE_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_POSTS_CREATE_ENDPOINT}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',  // ✅ explicitly set karo
                    },
                    transformRequest: [(data) => data],  // ✅ axios ko data transform mat karne do
                }
            );
            // console.log('Post created successfully:', data);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create post');
        }
    }

    // ✅ ADD: Get Posts by Company
    static async getPostsByCompany(
        companyId: string,
        page = 1,
        pageSize = 20
    ): Promise<any> {
        try {
            const { data } = await api.get(
                `${config.NEXT_PUBLIC_COMPANY_POSTS_COMPANY_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_POSTS_COMPANY_ENDPOINT}/${companyId}`,
                { params: { page, pageSize } }
            );
            console.log('Fetched posts for company:', data); // Debug log
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch posts');
        }
    }

    static async publishPost(postId: string): Promise<any> {
        try {
            const { data } = await api.patch(
                `${config.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT}/${postId}/publish`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to publish post');
        }
    }

    static async deletePost(postId: string): Promise<any> {
        try {
            const { data } = await api.delete(
                `${config.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT}/${postId}`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete post');
        }
    }

    static async togglePostLike(postId: string): Promise<any> {
        try {
            const { data } = await api.post(
                `${config.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT}/${postId}/like`
            );
            return data;
        } catch (error: any) {
            console.warn('Failed to toggle post like:', error);
        }
    }

    static async getPostComments(postId: string): Promise<any> {
        try {
            const { data } = await api.get(
                `${config.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT}/${postId}/comments`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch comments');
        }
    }

    static async addPostComment(postId: string, text: string): Promise<any> {
        try {
            const { data } = await api.post(
                `${config.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT}/${postId}/comments`,
                { text }
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to add comment');
        }
    }

    static async deletePostComment(postId: string, commentId: string): Promise<any> {
        try {
            const { data } = await api.delete(
                `${config.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT}/${postId}/comments/${commentId}`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete comment');
        }
    }

    static async incrementShares(postId: string): Promise<any> {
        try {
            const { data } = await api.patch(
                `${config.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_POSTS_ENDPOINT}/${postId}/shares`
            );
            return data;
        } catch (error: any) {
            console.warn('Failed to increment shares:', error);
        }
    }

    static async createEvent(formData: FormData): Promise<any> {
        const endpoint = config.NEXT_PUBLIC_COMPANY_EVENTS_CREATE_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_EVENTS_CREATE_ENDPOINT || '/company/events/create-event';
        try {
            console.log('🚀 [CREATE_EVENT] Requesting POST:', endpoint, { baseURL: api.defaults.baseURL });
            const { data } = await api.post(
                endpoint,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    transformRequest: [(data) => data],
                }
            );
            console.log('✅ [CREATE_EVENT] Success:', data);
            return data;
        } catch (error: any) {
            console.error('❌ [CREATE_EVENT] Failed:', {
                status: error.response?.status,
                url: error.config?.url,
                baseURL: error.config?.baseURL,
                data: error.response?.data,
                message: error.message,
            });
            const backendMsg =
                error.response?.data?.message ||
                error.response?.data?.error ||
                (Array.isArray(error.response?.data?.errors) ? error.response.data.errors.map((e: any) => e.message || e).join(', ') : null) ||
                error.message ||
                'Failed to create event';
            throw new Error(backendMsg);
        }
    }

    static async getAllEvents(page = 1, pageSize = 10): Promise<any> {
        const endpoint = config.NEXT_PUBLIC_COMPANY_EVENTS_GET_ALL_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_EVENTS_GET_ALL_ENDPOINT || '/company/events/get-all-events';
        try {
            console.log('🚀 [GET_ALL_EVENTS] Requesting GET:', endpoint, { baseURL: api.defaults.baseURL });
            const { data } = await api.get(endpoint, {
                params: { page, pageSize },
            });
            console.log("all events here ->>", data);
            return data;
        } catch (error: any) {
            console.error('❌ [GET_ALL_EVENTS] Error:', {
                status: error.response?.status,
                url: error.config?.url,
                baseURL: error.config?.baseURL,
                data: error.response?.data,
                message: error.message,
            });
            throw new Error(error.response?.data?.message || 'Failed to fetch events');
        }
    }

    static async deleteEvent(eventId: string): Promise<any> {
        try {
            console.log('🗑️ [DELETE_EVENT] Requesting DELETE for event:', eventId);
            const { data } = await api.delete(`/company/events/${eventId}`);
            console.log('✅ [DELETE_EVENT] Event deleted successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ [DELETE_EVENT] Error deleting event:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });
            throw new Error(error.response?.data?.message || 'Failed to delete event. Please try again.');
        }
    }

    static async getEventById(eventId: string): Promise<any> {
        try {
            const { data } = await api.get(`/company/events/${eventId}`);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch event details');
        }
    }

    static async updateEvent(eventId: string, formData: FormData | Record<string, any>): Promise<any> {
        try {
            const isFormData = typeof FormData !== 'undefined' && formData instanceof FormData;
            const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
            const { data } = await api.put(`/company/events/${eventId}`, formData, { headers });
            return data;
        } catch (error: any) {
            const backendMsg =
                error.response?.data?.message ||
                (Array.isArray(error.response?.data?.errors) ? error.response.data.errors.map((e: any) => e.message || e).join(', ') : null) ||
                error.message ||
                'Failed to update event';
            throw new Error(backendMsg);
        }
    }

    static async updateEventStatus(eventId: string, status: string): Promise<any> {
        try {
            const { data } = await api.patch(`/company/events/${eventId}/status`, { status });
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update event status');
        }
    }

    static async getEventAttendees(eventId: string, page = 1, pageSize = 20): Promise<any> {
        try {
            const { data } = await api.get(`/company/events/${eventId}/attendees`, {
                params: { page, pageSize },
            });
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch attendees');
        }
    }

    static async getEventStatistics(companyId?: string): Promise<any> {
        try {
            const { data } = await api.get('/company/events/stats', {
                params: companyId ? { companyId } : {},
            });
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch event statistics');
        }
    }

    static async getAboutIdentity(companyId: string): Promise<any> {
        try {
            const { data } = await api.get(`${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/about/identity`);
            console.log('Fetched about identity:', data); // Debug log
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch about identity');
        }
    }

    static async updateAboutIdentity(companyId: string, payload: {
        story?: string;
        mission?: string;
        vision?: string;
        promises?: string[];
        impacts?: { title: string; metric: string; description: string }[];
    }): Promise<any> {
        try {
            const { data } = await api.put(`${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/about/identity`, payload);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update about identity');
        }
    }

    static async getTimeline(companyId: string, page = 1, pageSize = 20): Promise<any> {
        try {
            const { data } = await api.get(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/about/timeline`,
                { params: { page, pageSize } }
            );
            console.log("company timeline => ", data);
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch timeline');
        }
    }

    static async addTimelineEntry(companyId: string, entry: {
        year: number;
        month: number;
        title: string;
        description: string;
        type: string;
        icon: string;
        isPublished: boolean;
    }): Promise<any> {
        try {
            const { data } = await api.post(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/about/timeline`,
                entry
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to add timeline entry');
        }
    }

    static async getTestimonials(companyId: string, params?: { isPublished?: boolean; isFeatured?: boolean }): Promise<any> {
        try {
            const { data } = await api.get(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/about/testimonials`,
                { params }
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch testimonials');
        }
    }

    static async addTestimonial(companyId: string, payload: {
        authorName: string;
        authorTitle: string;
        authorCompany: string;
        authorAvatar?: string;
        message: string;
        rating: number;
        source: 'User' | 'Client';
        isPublished: boolean;
        isFeatured: boolean;
    }): Promise<any> {
        try {
            const { data } = await api.post(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/about/testimonials`,
                payload
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to add testimonial');
        }
    }

    static async getProduct(companyId: string): Promise<any> {
        try {
            const { data } = await api.get(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/about/product`
            );
            console.log('Fetched product info:', data); // Debug log    
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch product');
        }
    }

    static async updateProduct(companyId: string, payload: {
        name: string;
        tagline: string;
        description: string;
        features: { title: string; description: string; icon: string; category: string }[];
        screenshots?: string[];
        demoLink?: string;
        isPublished: boolean;
    }): Promise<any> {
        try {
            const { data } = await api.put(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/about/product`,
                payload
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update product');
        }
    }

    // updateProduct ke baad add karo

    static async getLife(companyId: string): Promise<any> {
        try {
            const { data } = await api.get(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/about/life`
            );
            console.log('Fetched life info:', data); // Debug log
            return data;
        } catch (error: any) {
            console.error('Error fetching life info:', error); // Debug log
            throw new Error(error.response?.data?.message || 'Failed to fetch life');
        }
    }

    static async updateLife(companyId: string, payload: {
        values?: { title: string; description: string; icon: string }[];
        perks?: { title: string; description: string; icon: string; category: string }[];
        teamMembers?: { name: string; designation: string; bio: string; avatar?: string; linkedinUrl: string; order: number }[];
        gallery?: { url?: string; caption: string; type: string; order: number }[];
    }): Promise<any> {
        try {
            console.log('Updating life info with payload:', payload, companyId); // Debug log
            const { data } = await api.put(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT}/${companyId}/about/life`,
                payload
            );
            console.log('Updated life info:', data); // Debug log
            return data;
        } catch (error: any) {
            console.error('Error updating life info:', error); // Debug log
            throw new Error(error.response?.data?.message || 'Failed to update life');
        }
    }

    // Company analytics track karo
    static async trackCompanyEvent(payload: {
        companyId: string;
        eventType: 'search_appearance' | 'page_view' | 'post_impression' | 'follower_gained' | 'follower_lost';
        postId?: string;
        searchQuery?: string;
    }): Promise<any> {
        try {
            const { data } = await api.post(
                `${config.NEXT_PUBLIC_COMPANY_ANALYTICS_TRACK_USER_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_ANALYTICS_TRACK_USER_ENDPOINT}`,
                payload
            );
            return data;
        } catch (error: any) {
            // Silently fail - tracking should never break UX
            console.warn('⚠️ [ANALYTICS] Tracking failed:', error?.response?.data?.message);
        }
    }


    // Follow a company
    static async followCompany(companyId: string): Promise<any> {
        try {
            const { data } = await api.post(
                `${config.NEXT_PUBLIC_COMPANY_CONNECTIONS_FOLLOW_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_CONNECTIONS_FOLLOW_ENDPOINT}/${companyId}`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to follow company');
        }
    }

    // Unfollow a company
    static async unfollowCompany(companyId: string): Promise<any> {
        try {
            const { data } = await api.delete(
                `${config.NEXT_PUBLIC_COMPANY_CONNECTIONS_FOLLOW_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_CONNECTIONS_FOLLOW_ENDPOINT}/${companyId}`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to unfollow company');
        }
    }

    // Check follow status
    static async getCompanyFollowStatus(companyId: string): Promise<any> {
        try {
            const { data } = await api.get(
                `${config.NEXT_PUBLIC_COMPANY_CONNECTIONS_FOLLOW_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_CONNECTIONS_FOLLOW_ENDPOINT}/${companyId}/status`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get follow status');
        }
    }

    // Get company followers count
    static async getCompanyFollowersCount(companyId: string): Promise<any> {
        try {
            const { data } = await api.get(
                `${config.NEXT_PUBLIC_COMPANY_CONNECTIONS_FOLLOW_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_CONNECTIONS_FOLLOW_ENDPOINT}/${companyId}/followers/count`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get followers count');
        }
    }

    // Update company details (partial update)
    static async updateCompany(companyId: string, payload: any): Promise<any> {
        try {
            const { data } = await api.patch(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || '/company/companies'}/${companyId}`,
                payload
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update company profile');
        }
    }

    // Request or toggle company verification
    static async verifyCompany(companyId: string): Promise<any> {
        try {
            const { data } = await api.patch(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || '/company/companies'}/${companyId}/verify`
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update verification status');
        }
    }

    // Update company social links specifically
    static async updateCompanySocialLinks(companyId: string, socialLinks: any): Promise<any> {
        try {
            const { data } = await api.patch(
                `${config.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || process.env.NEXT_PUBLIC_COMPANY_COMPANIES_ENDPOINT || '/company/companies'}/${companyId}/social`,
                { socialLinks }
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update social links');
        }
    }
}

export default CompanyService;