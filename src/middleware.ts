
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public paths
  const isPublicPath = path === '/login' || path === '/register' || path === '/forgot-password';

  // Get token to check authentication and role
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const isAuthenticated = !!token;

  // 1. Redirect to dashboard if logged in and trying to access public auth pages
  if (isPublicPath && isAuthenticated) {
    const role = (token as { role?: string })?.role || 'employee';
    const isAdminAreaRole = role === 'admin' || role === 'manager' || role === 'lead_technician' || role.startsWith('lead_');
    const targetUrl = isAdminAreaRole 
        ? '/dashboard/admin' 
        : '/dashboard/employee';
    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  // 2. Redirect to login if not logged in and trying to access protected routes
  if (!isPublicPath && !isAuthenticated && path !== '/') {
    // Check if path starts with /dashboard or /api potentially (optional strictness)
    if (path.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. Role-Based Access Control (RBAC) for specific dashboard paths
  if (isAuthenticated && path.startsWith('/dashboard')) {
    const role = (token as { role?: string })?.role || 'employee';
    
    // Admin Area Protection
    if (path.startsWith('/dashboard/admin')) {
       const isAdminAreaRole = role === 'admin' || role === 'manager' || role === 'lead_technician' || role.startsWith('lead_');
       if (!isAdminAreaRole) {
          // If employee tries to access admin area, redirect to employee dashboard
          return NextResponse.redirect(new URL('/dashboard/employee', request.url));
       }
    }

    // Employee Area Redirect (Optional: Admins can access everything, or restrict them?)
    // Usually Admins might want to see Employee view too, so we might not restrict 
    // admins from /dashboard/employee, but let's keep it loose for now.
  }

  // 4. Root Path Redirect
  if (path === '/' || path === '/dashboard') {
    if (isAuthenticated) {
        const role = (token as { role?: string })?.role || 'employee';
        const isAdminAreaRole = role === 'admin' || role === 'manager' || role === 'lead_technician' || role.startsWith('lead_');
        const targetUrl = isAdminAreaRole 
            ? '/dashboard/admin' 
            : '/dashboard/employee';
        return NextResponse.redirect(new URL(targetUrl, request.url));
    } else {
        return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/dashboard/:path*',
  ],
};
