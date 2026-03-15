import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import appConfig from "@/config"

export default async function middleware(req) {
  const session = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard")

  if (isProtected && !session) {
    const signInUrl = new URL(appConfig.auth.loginUrl, req.nextUrl.origin)
    signInUrl.searchParams.set(
      "callbackUrl",
      `${req.nextUrl.pathname}${req.nextUrl.search}`
    )
    return NextResponse.redirect(signInUrl)
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
