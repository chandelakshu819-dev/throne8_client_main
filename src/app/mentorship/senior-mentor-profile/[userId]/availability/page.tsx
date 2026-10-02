import SeniorMentorLayout from "@/features/mentorship/components/senior-mentor/SeniorMentorLayout";

export default async function SeniorAvailabilityPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <SeniorMentorLayout userId={userId} activeTab="availability" />;
}
