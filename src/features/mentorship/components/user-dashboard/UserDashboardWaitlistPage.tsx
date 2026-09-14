import { Clock } from "lucide-react";

export default function UserDashboardWaitlistPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold" style={{ color: '#4a3728' }}>Waitlist</h1>
        <p className="text-sm font-medium" style={{ color: '#7a5c3e' }}>
          Manage the sessions you are waiting for.
        </p>
      </div>

      <div 
        className="flex flex-col items-center justify-center p-12 text-center rounded-2xl h-[400px]"
        style={{ backgroundColor: '#fff', border: '1px solid #e0d8cf' }}
      >
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ backgroundColor: '#fbf7f3', border: '1px solid #e0d8cf' }}
        >
          <Clock className="w-8 h-8" style={{ color: '#c0b0a0' }} />
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: '#4a3728' }}>
          You're not on any waitlists
        </h3>
        <p className="text-sm max-w-md" style={{ color: '#7a5c3e' }}>
          When you join a waitlist for a full session, it will appear here so you can keep track of your position.
        </p>
      </div>
    </div>
  );
}
