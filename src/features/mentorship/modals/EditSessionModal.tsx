'use client';

import React from 'react';
import OneToOneEditSessionModal from './OneToOneEditSessionModal';
import GroupSessionEditModal from './GroupSessionEditModal';
import SessionDetailsModal from './SessionDetailsModal';

interface EditSessionModalProps {
    isOpen: boolean;
    initialMode?: 'view' | 'edit';
    onClose: () => void;
    session: any;
    onStatusChange?: (sessionId: string, newStatus: string, bookingId?: string) => Promise<void>;
    onRefresh?: () => void;
}

export default function EditSessionModal(props: EditSessionModalProps) {
    if (!props.isOpen || !props.session) return null;

    // If they explicitly want to view the booking information (like in BookingsPage)
    if (props.initialMode === 'view') {
        return <SessionDetailsModal {...props} />;
    }

    // Otherwise, they clicked "Edit Session" on the Services Page.
    const isGroupSession = props.session?.type === 'group_session' || props.session?.sessionType === 'group_session' || props.session?.isGroupSession;

    // Force required props to trick TypeScript compiler since we know they're not undefined when Edit Form is invoked
    const editProps = {
        ...props,
        onStatusChange: props.onStatusChange || (async () => {}),
        onRefresh: props.onRefresh || (() => {})
    };

    if (isGroupSession) {
        return <GroupSessionEditModal {...editProps} />;
    }

    return <OneToOneEditSessionModal {...editProps} />;
}