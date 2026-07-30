import config from "@/config/env.config";
import api from "./api.intance";

interface SendConnectionRequestPayload {
    toUserId: string;
    message?: string;
    priority?: 'low' | 'medium' | 'high';
    templateId?: string;
}

class ConnectionService {
    /**
     * 🔗 SEND CONNECTION REQUEST
     */
    static async sendConnectionRequest(payload: SendConnectionRequestPayload) {
        try {
            // console.log('🔗 [SEND_REQUEST] Sending connection request...', payload);

            const requestData = {
                toUserId: payload.toUserId,
                message: payload.message || "Hi! I'd like to connect with you.",
                priority: payload.priority || 'medium',
                templateId: payload.templateId || 'welcome-template',
            };

            const { data } = await api.post(`${config.NEXT_PUBLIC_CONNECTIONS_REQUESTS_ENDPOINT || process.env.NEXT_PUBLIC_CONNECTIONS_REQUESTS_ENDPOINT }`, requestData);

            // console.log('✅ [SEND_REQUEST] Request sent successfully:', data.data);
            return data;

        } catch (error: any) {
            console.error('❌ [SEND_REQUEST] Failed:', error);

            if (error.response?.status === 409) {
                throw new Error('Connection request already exists');
            }
            if (error.response?.status === 400) {
                throw new Error(error.response?.data?.message || 'Invalid request data');
            }

            throw new Error(error.response?.data?.message || 'Failed to send request');
        }
    }

    /**
     * ✅ ACCEPT CONNECTION REQUEST
     */
    static async acceptConnectionRequest(requestId: string) {
        try {
            // console.log('✅ [ACCEPT_REQUEST] Accepting request:', requestId);

            const { data } = await api.post(`${config.NEXT_PUBLIC_CONNECTIONS_REQUESTS_ENDPOINT || process.env.NEXT_PUBLIC_CONNECTIONS_REQUESTS_ENDPOINT}/${requestId}/accept`);

            // console.log('✅ [ACCEPT_REQUEST] Request accepted:', data.data);
            return data;

        } catch (error: any) {
            console.error('❌ [ACCEPT_REQUEST] Failed:', error);

            if (error.response?.status === 404) {
                throw new Error('Connection request not found');
            }
            if (error.response?.status === 403) {
                throw new Error('Not authorized to accept this request');
            }

            throw new Error(error.response?.data?.message || 'Failed to accept request');
        }
    }

    /**
     * ❌ DECLINE CONNECTION REQUEST
     */
    static async declineConnectionRequest(requestId: string) {
        try {
            // console.log('❌ [DECLINE_REQUEST] Declining request:', requestId);

            const { data } = await api.post(`${config.NEXT_PUBLIC_CONNECTIONS_REQUESTS_ENDPOINT || process.env.NEXT_PUBLIC_CONNECTIONS_REQUESTS_ENDPOINT}/${requestId}/decline`);

            // console.log('✅ [DECLINE_REQUEST] Request declined:', data.data);
            return data;

        } catch (error: any) {
            console.error('❌ [DECLINE_REQUEST] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to decline request');
        }
    }

    /**
     * 📤 GET OUTGOING REQUESTS (Sent by user)
    */
    static async getOutgoingRequests(userId: string) {
        try {
            // console.log('📤 [GET_OUTGOING] Fetching for userId:', userId);

            const { data } = await api.get(`${config.NEXT_PUBLIC_CONNECTIONS_REQUESTS_USER_ENDPOINT || process.env.NEXT_PUBLIC_CONNECTIONS_REQUESTS_USER_ENDPOINT}/${userId}/outgoing?status=pending`);

            // console.log('✅ [GET_OUTGOING] Received:', data.data);
            return data;
        } catch (error: any) {
            console.error('❌ [GET_OUTGOING] Failed:', error);
            throw new Error('Failed to fetch outgoing requests');
        }
    }

    /**
     * ❌ CANCEL/WITHDRAW SENT REQUEST
     */
    static async cancelConnectionRequest(requestId: string) {
        try {
            // console.log('❌ [CANCEL_REQUEST] Cancelling request:', requestId);

            const { data } = await api.post(`${config.NEXT_PUBLIC_CONNECTIONS_REQUESTS_ENDPOINT || process.env.NEXT_PUBLIC_CONNECTIONS_REQUESTS_ENDPOINT}/${requestId}/cancel`);

            // console.log('✅ [CANCEL_REQUEST] Request cancelled:', data.data);
            return data;
        } catch (error: any) {
            console.error('❌ [CANCEL_REQUEST] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to cancel request');
        }
    }


    /**
     * 📋 GET INCOMING REQUESTS
     */
    static async getIncomingRequests(userId: string) {
        try {
            // console.log('📥 [GET_INCOMING] Fetching for userId:', userId);

            // ✅ FIXED: Dynamic userId in URL
            const { data } = await api.get(`${config.NEXT_PUBLIC_CONNECTIONS_REQUESTS_USER_ENDPOINT || process.env.NEXT_PUBLIC_CONNECTIONS_REQUESTS_USER_ENDPOINT}/${userId}/incoming?status=pending`);

            // console.log('✅ [GET_INCOMING] Received:', data.data);
            return data;
        } catch (error: any) {
            console.error('❌ [GET_INCOMING] Failed:', error);
            throw new Error('Failed to fetch incoming requests');
        }
    }

    /**
    * 📋 GET ALL CONNECTIONS FOR A USER
    */
    static async getUserConnections(userId: string) {
        try {
            // console.log('🔗 [GET_CONNECTIONS] Fetching for userId:', userId);

            // ✅ FIXED URL - added "/connection" before "/user"
            const { data } = await api.get(`${config.NEXT_PUBLIC_CONNECTIONS_CONNECTION_USER_ENDPOINT || process.env.NEXT_PUBLIC_CONNECTIONS_CONNECTION_USER_ENDPOINT}/${userId}`);

            // console.log('✅ [GET_CONNECTIONS] Received connections:', data.data?.data?.length || 0);
            return data;
        } catch (error: any) {
            console.error('❌ [GET_CONNECTIONS] Failed:', error);
            throw new Error('Failed to fetch connections');
        }
    }

    /**
     * 📊 GET CONNECTION STATS FOR A USER
     */
    static async getConnectionStats(userId: string) {
        try {
            // console.log('📊 [GET_STATS] Fetching stats for userId:', userId);

            const { data } = await api.get(`${config.NEXT_PUBLIC_CONNECTIONS_USER_ENDPOINT || process.env.NEXT_PUBLIC_CONNECTIONS_USER_ENDPOINT}/${userId}/stats`);

            // console.log('✅ [GET_STATS] Received:', data.data);
            return data;
        } catch (error: any) {
            console.error('❌ [GET_STATS] Failed:', error);
            throw new Error('Failed to fetch connection stats');
        }
    }

    /**
     * ❌ DELETE CONNECTION
     */
    static async deleteConnection(connectionId: string) {
        try {
            // console.log('❌ [DELETE_CONNECTION] Deleting connection:', connectionId);
            const { data } = await api.delete(`/connections/connection/${connectionId}`);
            return data;
        } catch (error: any) {
            console.error('❌ [DELETE_CONNECTION] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to delete connection');
        }
    }

    /**
     * 🎉 GET CATCH UP FEED (job changes, work anniversaries, birthdays)
     * NOTE: adjust the path below (`/connections/catchup`) if your backend
     * mounts the catchup router under a different prefix.
     */
    static async getCatchUpFeed(userId: string) {
        try {
            const { data } = await api.get(`/connections/catchup/${userId}`);
            return data;
        } catch (error: any) {
            console.error('❌ [GET_CATCHUP] Failed:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch catch up feed');
        }
    }
}

export default ConnectionService;