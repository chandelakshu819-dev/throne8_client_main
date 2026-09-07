// app/mentorship/mentor-card/[mentorname]/[mentorid]/page.tsx
import MentorProfile from '@/features/mentorship/components/MentorProfile';
import { Metadata } from 'next';
import React from 'react'

interface PageProps {
  params: Promise<{
    mentorname: string;
    mentorid: string;
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { mentorname } = await params;

  const displayName = decodeURIComponent(mentorname)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${displayName} – Mentor Profile`,
    description: "Book 1:1 sessions, download resources, and get career guidance.",
  };
}

const page = async ({ params }: PageProps) => {
  const { mentorname, mentorid } = await params;

  return (
    <MentorProfile mentorId={mentorid} />
  )
}

export default page