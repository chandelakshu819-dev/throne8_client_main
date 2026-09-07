'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Star, Loader2, X } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import MentorService from '@/lib/api/mentorship.service';

// ⚠️ Not present in src/config/routes.ts yet — add these there and import
// from `routes` instead once that file is updated. Keeping them local for
// now so this component works out of the box.
const mentorshipRoutes = {
  findMentor: '/mentorship',
  becomeMentorApply: '/mentorship/become-mentor',
  becomeSeniorMentorApply: '/mentorship/become-senior-mentor',
  mentorDashboard: (userId: string) => `/mentorship/dashboard/${userId}`,
};

interface CardConfig {
  key: 'find' | 'become' | 'senior';
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
}

const CARDS: CardConfig[] = [
  {
    key: 'find',
    icon: <Search className="w-5 h-5" />,
    title: 'Find Mentor',
    description:
      'Connect with 500+ industry experts from top tech companies. Get personalized 1:1 guidance.',
    ctaLabel: 'Explore Mentors',
  },
  {
    key: 'become',
    icon: <Users className="w-5 h-5" />,
    title: 'Become Mentor',
    description:
      'Share your expertise with aspiring professionals. Build your personal brand and earn.',
    ctaLabel: 'Apply Now',
  },
  {
    key: 'senior',
    icon: <Star className="w-5 h-5" />,
    title: 'Become Senior Mentor',
    description:
      'Share your industry experience, guide aspiring professionals, and help shape the next generation of talent.',
    ctaLabel: 'Apply Now',
  },
];

export default function BecomeMentorCards() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Which card is currently mid-flow (drives the "Checking your profile..." modal)
  const [checkingKey, setCheckingKey] = useState<CardConfig['key'] | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const closeModal = () => {
    setCheckingKey(null);
    setCheckError(null);
  };

  const handleFindMentor = () => {
    router.push(mentorshipRoutes.findMentor);
  };

  const handleBecomeMentor = async (key: 'become' | 'senior') => {
    if (!isAuthenticated || !user?.userId) {
      router.push('/login');
      return;
    }

    setCheckingKey(key);
    setCheckError(null);

    try {
      // If this resolves, a mentor profile already exists for this user.
      const existing = await MentorService.getMentorByUserId(user.userId);
      const mentorId = existing?.data?.mentorId;

      // Already a mentor → send them to their dashboard instead of the
      // application form.
      router.push(mentorshipRoutes.mentorDashboard(mentorId || user.userId));
    } catch (err: any) {
      // MentorService.getMentorByUserId throws on a 404 with the message
      // 'Mentor profile not found.' — that's the EXPECTED path for anyone
      // applying for the first time, not a real failure. Only surface an
      // error state for anything else (network issues, 401, 500, etc).
      const message: string = err?.message || '';
      const noProfileYet = message.includes('not found');

      if (noProfileYet) {
        const target =
          key === 'senior'
            ? mentorshipRoutes.becomeSeniorMentorApply
            : mentorshipRoutes.becomeMentorApply;
        router.push(target);
        return;
      }

      // Genuine error — let the user see it and retry instead of silently
      // hanging on the "Checking your profile..." modal.
      setCheckError('Something went wrong while checking your profile. Please try again.');
    } finally {
      // Guarantees the modal never gets stuck open, regardless of which
      // branch above ran.
      setCheckingKey(null);
    }
  };

  const onCardClick = (key: CardConfig['key']) => {
    if (key === 'find') {
      handleFindMentor();
      return;
    }
    handleBecomeMentor(key);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {CARDS.map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
          >
            <div className="w-11 h-11 rounded-xl bg-[#6b5842] text-white flex items-center justify-center mb-4">
              {card.icon}
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">{card.title}</h3>
            <p className="text-sm text-neutral-500 mb-4 leading-relaxed">
              {card.description}
            </p>
            <button
              type="button"
              onClick={() => onCardClick(card.key)}
              disabled={checkingKey === card.key}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6b5842] hover:text-[#4f4130] transition-colors disabled:opacity-60"
            >
              {checkingKey === card.key ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  {card.ctaLabel}
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* "Checking your profile..." modal — only shown while a check is
          in flight, and always closed via the finally{} block above so it
          can never hang indefinitely. */}
      {checkingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-xl">
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-[#6b5842]" />
            <p className="text-sm font-medium text-neutral-700">Checking your profile...</p>
          </div>
        </div>
      )}

      {checkError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-xl">
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-sm font-medium text-red-600 mb-4">{checkError}</p>
            <button
              type="button"
              onClick={closeModal}
              className="text-sm font-semibold text-[#6b5842] hover:text-[#4f4130]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}