import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/config/env";

const getServiceRoleKey = () => {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return key;
};

export const getSupabaseServiceRoleClient = () =>
  createClient(env.NEXT_PUBLIC_SUPABASE_URL, getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
