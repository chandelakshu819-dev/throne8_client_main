import React from 'react';
import { ConnectionRequest, SentRequest, RequestTabType } from '@/features/networks/types';
import { ConnectionRequestCard } from './ConnectionRequestCard';
import { RequestsModal } from './RequestsModal';

interface ConnectionRequestsListProps {
    requests: ConnectionRequest[];
    sentRequests: SentRequest[];
    isLoading?: boolean;
    showRequestsPanel: boolean;
    activeReqTab: RequestTabType;
    setActiveReqTab: (tab: RequestTabType) => void;
    onTogglePanel: () => void;
    onAccept: (id: string) => void; // ✅ CHANGE: number → string
    onIgnore: (id: string) => void;
    onWithdraw: (id: string) => void;
}

export const ConnectionRequestsList: React.FC<ConnectionRequestsListProps> = ({
    requests,
    sentRequests,
    isLoading = false,
    showRequestsPanel,
    activeReqTab,
    setActiveReqTab,
    onTogglePanel,
    onAccept,
    onIgnore,
    onWithdraw
}) => {
    // ✅ ADD LOADING STATE (Line ~30):
    if (isLoading) {
        return (
            <div className="rounded-3xl shadow-2xl p-8 border-2 mb-10" style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}>
                <p className="text-center text-[#4a3728] py-8">Loading requests...</p>
            </div>
        );
    }

    return (
        <>
            <div
                className="rounded-3xl shadow-2xl p-8 border-2"
                style={{ backgroundColor: '#e0d8cf', borderColor: '#4a3728' }}
            >
                <div className="flex items-center gap-4 mb-6">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: '#f6ede8', color: '#4a3728' }}
                    >
                        <i className="ri-user-received-2-fill"></i>
                    </div>
                    <h3 className="text-3xl font-black" style={{ color: '#4a3728' }}>
                        Connection Requests
                    </h3>
                    <button
                        onClick={onTogglePanel}
                        className="ml-auto text-sm font-bold px-4 py-2 rounded-xl transition"
                        style={{ backgroundColor: '#f6ede8', color: '#4a3728' }}
                    >
                        {showRequestsPanel ? "Hide ▲" : "Show more →"}
                    </button>
                </div>

                <div className="space-y-4">
                    {requests.length === 0 ? (
                        <div className="text-center">
                            <div className="flex justify-center items-center gap-8">
                                <div
                                    className="w-4 h-4 rounded-full flex items-center justify-center text-3xl"
                                    style={{ backgroundColor: '#f6ede8', color: '#4a3728' }}
                                >
                                    <i className="ri-mail-check-line"></i>
                                </div>
                                <div className="text-lg font-semibold" style={{ color: '#4a3728' }}>
                                    No Pending Requests
                                </div>
                            </div>
                            <p className="text-sm opacity-70 mt-2" style={{ color: '#4a3728' }}>
                                You're all caught up! Check back later for new connection requests.
                            </p>
                        </div>
                    ) : (
                        requests.map((user) => (
                            <ConnectionRequestCard
                                key={user.id}
                                user={user}
                                onAccept={onAccept}
                                onIgnore={onIgnore}
                            />
                        ))
                    )}
                </div>
            </div>

            <RequestsModal
                show={showRequestsPanel}
                activeTab={activeReqTab}
                setActiveTab={setActiveReqTab}
                receivedRequests={requests}
                sentRequests={sentRequests}
                onAccept={onAccept}
                onIgnore={onIgnore}
                onWithdraw={onWithdraw}
            />
        </>
    );
};