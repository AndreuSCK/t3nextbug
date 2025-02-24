import { authMiddleware } from "@clerk/nextjs";

// See https://clerk.com/docs/references/nextjs/auth-middleware
// for more information about configuring your Middleware
export default authMiddleware({
  // Allow signed out users to access the specified routes:
  // publicRoutes: ["/", "/api/webhooks(.*)"],
    publicRoutes: ["/", "/(.*)"],
  // Redirect signed out users to the sign in page:
  // signInRoute: '/sign-in',
  // Redirect signed in users to the specified route:
  // signedInRoute: '/dashboard',
  // ignoredRoutes:["/api/(.*)"]
  // ignoredRoutes:[""]
});

export const config = {
  matcher: [
    // Exclude files with a "." followed by an extension, which are typically static files.
    // Exclude files in the _next directory, which are Next.js internals.
    "/((?!.+\\.[\\w]+$|_next).*)",
    // Re-include any files in the api or trpc folders that might have an extension
    "/(api|trpc)(.*)",
  ],
};
