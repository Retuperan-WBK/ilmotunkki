import { NextRequest, NextResponse } from "next/server";


// From: https://nextjs.org/docs/app/building-your-application/routing/internationalization
export const middleware = async (request: NextRequest) => {
  const locales = ['fi', 'en'];
  const defaultLocale = "fi";

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/admin')) {
    return; 
  }

  if (pathname.startsWith('/public')) {
    return;
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return;
  }

  return NextResponse.redirect(
    new URL(`/${defaultLocale}${pathname}`, request.url)
  );
};

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    "/((?!api|_next|favicon.ico).*)",
    // Optional: only run on root (/) URL
    // '/'
  ],
};
