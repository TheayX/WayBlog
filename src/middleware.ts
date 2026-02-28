import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // /admin/login 不需要认证
  if (pathname === '/admin/login') {
    // 已登录的用户访问登录页 → 重定向到仪表盘
    if (req.auth) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // /admin/* 下的其他路由需要认证
  if (pathname.startsWith('/admin')) {
    if (!req.auth) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};

