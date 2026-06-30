export const prerender = false;
import type { APIRoute } from "astro";
import { signSession, COOKIE_NAME, COOKIE_MAX_AGE } from "~/lib/admin-auth";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const user = form.get("user")?.toString().trim();
  const pass = form.get("pass")?.toString();

  const validUser = import.meta.env.ADMIN_USER;
  const validPass = import.meta.env.ADMIN_PASS;
  const secret = import.meta.env.ADMIN_SECRET;

  if (!user || !pass || user !== validUser || pass !== validPass) {
    return redirect("/admin?error=1");
  }

  const token = signSession(secret);
  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return redirect("/admin/dashboard");
};
