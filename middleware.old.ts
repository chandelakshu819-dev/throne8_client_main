// // middleware.ts (Root level)

// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

// export function middleware(request: NextRequest) {
//     const { pathname } = request.nextUrl;

//     // Get token from cookies (more secure than localStorage in middleware)
//     const token = request.cookies.get('accessToken')?.value;
//     console.log('Middleware triggered for path:', pathname, 'with token:', token);

//     // Define protected routes
//     const protectedRoutes = ['/profile', '/dashboard', '/settings'];
//     const authRoutes = ['/login', '/register'];

//     // Check if current path is protected
//     const isProtectedRoute = protectedRoutes.some((route) =>
//         pathname.startsWith(route)
//     );

//     // Check if current path is auth route
//     const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

//     // Redirect to login if accessing protected route without token
//     if (isProtectedRoute && !token) {
//         const loginUrl = new URL('/login', request.url);
//         loginUrl.searchParams.set('redirect', pathname);
//         return NextResponse.redirect(loginUrl);
//     }

//     // Redirect to profile if accessing auth routes with valid token
//     if (isAuthRoute && token) {
//         return NextResponse.redirect(new URL('/profile', request.url));
//     }

//     return NextResponse.next();
// }

// // Configure which routes to run middleware on
// export const config = {
//     matcher: [
//         /*
//          * Match all request paths except:
//          * - _next/static (static files)
//          * - _next/image (image optimization files)
//          * - favicon.ico (favicon file)
//          * - public folder
//          */
//         '/((?!_next/static|_next/image|favicon.ico|public).*)',
//     ],
// };

export function middleware() {}