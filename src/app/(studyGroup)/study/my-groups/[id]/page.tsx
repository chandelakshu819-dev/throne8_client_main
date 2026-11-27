// src/app/studyGroup/study/my-groups/[id]/page.tsx
'use client';

import { use } from 'react';
import GroupRoom from '@/features/studyGroup/components/GroupRoom';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GroupRoomPage({ params }: PageProps) {
  const resolvedParams = use(params);

  return <GroupRoom key={resolvedParams.id} groupId={resolvedParams.id} />;
}

