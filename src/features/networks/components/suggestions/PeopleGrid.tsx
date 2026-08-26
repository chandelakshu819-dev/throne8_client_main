import React from 'react';
import { Person } from '@/features/networks/types';
import { PersonCard } from './PersonCard';

interface PeopleGridProps {
    people: Person[];
    connectedUsers: Set<string>;
    loadingUsers?: Set<string>;
    onConnect: (userId: string) => void;
}

export const PeopleGrid: React.FC<PeopleGridProps> = ({
    people,
    connectedUsers,
    loadingUsers,
    onConnect
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {people.map((person) => (
                <PersonCard
                    key={person.id}
                    person={person}
                    isConnected={connectedUsers.has(person.id)}
                    isLoading={loadingUsers?.has(person.id)}
                    onConnect={onConnect}
                />
            ))}
        </div>
    );
};