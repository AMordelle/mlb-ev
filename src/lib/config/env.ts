const getRequiredEnv = (key: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`[env] Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const;
