import { NextResponse } from "next/server"
import { auth } from "@/libs/auth"
import config from "@/config"

export default auth(async function middleware(req) {
  const session = req.auth
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard")

  if (isProtected && !session) {
    const signInUrl = new URL(config.auth.loginUrl, req.nextUrl.origin)
    signInUrl.searchParams.set(
      "callbackUrl",
      `${req.nextUrl.pathname}${req.nextUrl.search}`
    )
    return NextResponse.redirect(signInUrl)
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
