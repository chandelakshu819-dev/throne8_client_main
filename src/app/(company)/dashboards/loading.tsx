  export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-[#e0d8cf] rounded-xl" />
          <div className="h-4 w-56 bg-[#e0d8cf]/60 rounded-lg" />
        </div>
        <div className="h-9 w-28 bg-[#e0d8cf] rounded-xl" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#e0d8cf]/50 rounded-2xl h-28" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#e0d8cf]/50 rounded-2xl h-64" />
        <div className="bg-[#e0d8cf]/50 rounded-2xl h-64" />
      </div>
    </div>
  );
} 