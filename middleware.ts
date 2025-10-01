import { stackServerApp } from "./stack"

export async function middleware(request: any) {
  return await stackServerApp.middleware(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
