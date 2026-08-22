import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Yeh function export kar rahe hain – named export
export function proxy(request: NextRequest) {
  // Example: Protected routes ke liye auth check
  // const pathname = request.nextUrl.pathname;

  // // Agar user dashboard ya auth routes pe ja raha hai bina login ke
  // const protectedPaths = ['/dashboard', '/profile', '/feed', '/jobs', '/messages', '/notifications', '/settings'];
  // const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  // // Simple token check (real mein tum cookie ya header se check karoge)
  // const token = request.cookies.get('auth_token')?.value;

  // if (isProtected && !token) {
  //   // Login page pe redirect kar do
  //   const loginUrl = new URL('/login', request.url);
  //   loginUrl.searchParams.set('redirect', pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  // Baaki sab routes allow kar do
  return NextResponse.next();
}

// Optional: Matcher – sirf in routes pe middleware chalega (performance better)
// export const config = {
//   matcher: [
//     '/dashboard/:path*',
//     '/profile/:path*',
//     '/feed/:path*',
//     '/jobs/:path*',
//     '/messages/:path*',
//     '/notifications/:path*',
//     '/settings/:path*',
//   ],
// };