import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => jar.getAll().map((c) => ({ name: c.name, value: c.value })),
      setAll: (toSet) => {
        // Server Components can't write cookies - only Route Handlers and
        // Server Actions can. Supabase's auth-js may try to refresh the
        // session mid-render; swallow the resulting error. Middleware
        // handles the actual cookie refresh on the next request.
        try {
          for (const c of toSet) jar.set(c.name, c.value, c.options);
        } catch {
          // ignore - read-only cookie context
        }
      },
    },
  });
}
