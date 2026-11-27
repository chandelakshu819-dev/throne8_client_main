// src/app/studyGroup/study/my-groups/[id]/chat/page.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/core/store/store.hooks';
import StudyGroupService from '@/lib/api/studyGroup.service';
import GroupChat from '../../../../../../features/study-group/components/my-groups/GroupChat';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GroupChatPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch group details from Redux store first
  const myGroups = useAppSelector(state => (state as any).groups?.myGroups ?? []);
  const reduxGroupDetails = Array.isArray(myGroups)
    ? myGroups.find((g: any) => g.groupId === resolvedParams.id)
    : undefined;

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setIsLoading(true);
        // If found in Redux, use it
        if (reduxGroupDetails) {
          setGroupDetails(reduxGroupDetails);
          setIsLoading(false);
          return;
        }

        // Otherwise fetch from API
        const details = await StudyGroupService.getGroupById(resolvedParams.id);
        setGroupDetails(details);
      } catch (err) {
        console.error('Error fetching group details:', err);
        setError('Failed to load group details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupDetails();
  }, [resolvedParams.id, reduxGroupDetails]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#f6ede8] via-[#ede4db] to-[#e0d8cf]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8b7355]" />
          <p className="text-[#6b5847] font-medium">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#f6ede8] via-[#ede4db] to-[#e0d8cf]">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-[#6b5847] text-sm mt-2">Please try again</p>
        </div>
      </div>
    );
  }

  return <GroupChat key={resolvedParams.id} groupId={resolvedParams.id} groupDetails={groupDetails} />;
}



