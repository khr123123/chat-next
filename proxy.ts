 import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server"

const isPublic = createRouteMatcher(["/login", "/signup", "/", "/api/(.*)"])
const isProtected = createRouteMatcher(["/chat(.*)", "/settings(.*)"])

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authed = await convexAuth.isAuthenticated()

  if (isProtected(request) && !authed) {
    return nextjsMiddlewareRedirect(request, "/login")
  }
  if ((request.nextUrl.pathname === "/login" ||
       request.nextUrl.pathname === "/signup") && authed) {
    return nextjsMiddlewareRedirect(request, "/chat")
  }
})


export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};