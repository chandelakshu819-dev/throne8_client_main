import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-bl from-amber-50 to-white flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden relative">

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '65%',
        height: '120%',
        background: 'linear-gradient(to bottom right, #4a3728, #745842, #8b7355)',
        borderBottomRightRadius: '60% 50%',
        zIndex: 1,
        overflow: 'hidden'
      }}>
        {/* Network image sits inside the brown shape */}
        <img
          src="/assets/throne8-login-network.svg"
          alt="Throne8 professional networking"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.9
          }}
        />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg lg:max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row ml-auto mr-8 sm:mr-12 lg:mr-16" style={{ marginRight: '8%' }}>
        {children}
      </div>
    </div>
  );
}