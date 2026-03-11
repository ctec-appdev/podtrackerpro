import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { NextResponse } from "next/server"

const { auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
})

export default auth(async function middleware(req) {
  const session = req.auth
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard")

  if (isProtected && !session) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin)
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}