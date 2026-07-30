import api from './api.intance';

class DobService {
    /**
     * 🎂 Update the logged-in user's date of birth
     */
    static async updateDateOfBirth(dateOfBirth: string) {
        try {
            const { data } = await api.patch('/auth/date-of-birth', { dateOfBirth });
            return data;
        } catch (error: any) {
            console.error('❌ [UPDATE_DOB] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to update date of birth');
        }
    }
}

export default DobService;