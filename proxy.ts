import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server"


const isProtected = createRouteMatcher([
  "/chat(.*)",
  "/settings(.*)",
  "/files(.*)",
  "/",
])


export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authed = await convexAuth.isAuthenticated()
  const pathname = request.nextUrl.pathname


  // 已登录用户访问登录/注册页 -> 首页
  if (
    (pathname === "/login" || pathname === "/signup") &&
    authed
  ) {
    return nextjsMiddlewareRedirect(request, "/")
  }


  // 未登录访问受保护页面 -> 登录
  if (
    isProtected(request) &&
    !authed
  ) {
    return nextjsMiddlewareRedirect(request, "/login")
  }
})


export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
}