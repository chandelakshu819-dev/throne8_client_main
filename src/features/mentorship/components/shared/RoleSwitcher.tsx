"use client";
// src/features/mentorship/components/shared/RoleSwitcher.tsx
import { useState, useRef, useEffect } from "react";
import { ChevronDown, GraduationCap, Users } from "lucide-react";
import type { MentorshipRole } from "../../hooks/useMentorRole";

interface RoleSwitcherProps {
  activeRole: MentorshipRole;
  onSwitch: (role: MentorshipRole) => void;
  isMentor: boolean;
}

export default function RoleSwitcher({ activeRole, onSwitch, isMentor }: RoleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // User is not a mentor yet — nothing to switch to, so render nothing.
  if (!isMentor) return null;

  const roles: { key: MentorshipRole; label: string; icon: React.FC<any> }[] = [
    { key: "mentee", label: "Mentee view", icon: GraduationCap },
    { key: "mentor", label: "Mentor view", icon: Users },
  ];

  const current = roles.find((r) => r.key === activeRole) || roles[0];
  const CurrentIcon = current.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
        style={{ background: "#4a3728", color: "white" }}
      >
        <CurrentIcon size={16} />
        {current.label}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 rounded-xl shadow-lg overflow-hidden z-50"
          style={{ background: "white", border: "1px solid #e5dcd3" }}
        >
          {roles.map((role) => {
            const Icon = role.icon;
            const active = role.key === activeRole;
            return (
              <button
                key={role.key}
                onClick={() => {
                  onSwitch(role.key);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left hover:bg-[#f6ede8]"
                style={{
                  color: active ? "#4a3728" : "#6b5b4f",
                  fontWeight: active ? 700 : 500,
                }}
              >
                <Icon size={15} />
                {role.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}