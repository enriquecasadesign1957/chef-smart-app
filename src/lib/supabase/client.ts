import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

let browserClient: SupabaseClient<Database> | null = null;

function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
}

/** Publishable (sb_publishable_…) o anon JWT legacy. */
function supabasePublicKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

export function isSupabaseConfigured(): boolean {
  const url = supabaseUrl();
  const key = supabasePublicKey();
  return Boolean(url && key && !url.includes("YOUR_PROJECT"));
}

/** Cliente browser. Proyecto Mi Menú Smart (chef_smart) — no Senior Safe. */
export function getSupabaseBrowser(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null;
  if (browserClient) return browserClient;
  browserClient = createClient<Database>(supabaseUrl()!, supabasePublicKey()!);
  return browserClient;
}
