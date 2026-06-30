import { defineMiddleware } from "astro:middleware";
import { verifySession, COOKIE_NAME } from "~/lib/admin-auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin/");
  const isLoginPage = pathname === "/admin" || pathname === "/admin/";
  const isLoginApi = pathname.startsWith("/api/admin/login");

  if (isAdminRoute && !isLoginPage && !isLoginApi) {
    const session = context.cookies.get(COOKIE_NAME)?.value;
    const secret = import.meta.env.ADMIN_SECRET;

    if (!verifySession(session, secret)) {
      const isApi = pathname.startsWith("/api/");
      if (isApi) {
        return new Response(JSON.stringify({ error: "No autenticado" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return context.redirect("/admin");
    }
  }

  return next();
});
