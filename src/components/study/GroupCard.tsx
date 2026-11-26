type GroupCardProps = {
  name: string;
  category: string;
  description?: string;
  members: { initials: string }[];
  memberCount: number;
  goal: string; // e.g. "8h"
  attendance?: string | null; // e.g. "75%"; null = "Not required"
  joined: number;
  capacity: number; // e.g. 20
  isMember: boolean;
  onAction: () => void;
};

const avatarColors = ["bg-[#c9a27a]", "bg-[#a9795a]", "bg-[#6b4a36]"];

export default function GroupCard(p: GroupCardProps) {
  const left = p.capacity - p.joined;
  const full = left <= 0;
  const almostFull = left > 0 && left <= 5;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-[#4a3426] to-[#8a6244] px-5 pb-4 pt-5">
        <h3 className="mb-2 text-xl font-bold text-white">{p.name}</h3>
        <span className="inline-block rounded-full bg-[#f3e6d8] px-3 py-1 text-xs font-semibold text-[#4a3426]">
          {p.category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-4">
        {p.description && (
          <p className="line-clamp-2 text-sm text-[#6b5648]">{p.description}</p>
        )}

        {/* Avatars */}
        <div className="flex items-center">
          <div className="flex -space-x-2.5">
            {p.members.slice(0, 3).map((m, i) => (
              <div
                key={i}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white ${avatarColors[i % 3]}`}
              >
                {m.initials}
              </div>
            ))}
          </div>
          <span className="ml-3 text-sm font-semibold text-[#3a281c]">
            {p.memberCount} members
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-[#faf5ef] p-3">
            <div className="text-xs text-[#6b5648]">Goal</div>
            <div className="text-2xl font-bold text-[#3a281c]">{p.goal}</div>
          </div>
          <div className="rounded-xl bg-[#faf5ef] p-3">
            <div className="text-xs text-[#6b5648]">Attendance</div>
            {p.attendance ? (
              <div className="text-2xl font-bold text-[#3a281c]">{p.attendance}</div>
            ) : (
              <div className="pt-1.5 text-sm text-[#8a7667]">Not required</div>
            )}
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-[#6b5648]">
            <span>
              {p.joined}/{p.capacity} joined
            </span>
            <span
              className={`font-bold ${
                full ? "text-red-700" : almostFull ? "text-orange-700" : "text-emerald-800"
              }`}
            >
              {full ? "Full" : `${left} spots left`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#eadfd3]">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#4a3426] to-[#c9a27a]"
              style={{ width: `${Math.min((p.joined / p.capacity) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Action */}
        <button
          onClick={p.onAction}
          disabled={full && !p.isMember}
          className={
            p.isMember
              ? "mt-auto rounded-xl border-2 border-[#4a3426] bg-white py-3 font-bold text-[#4a3426] transition hover:bg-[#4a3426] hover:text-white"
              : "mt-auto rounded-xl bg-[#4a3426] py-3 font-bold text-white transition hover:bg-[#3a281c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          }
        >
          {p.isMember ? "Open Group" : full ? "Group Full" : "Join Group"}
        </button>
      </div>
    </div>
  );
}
