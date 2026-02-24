import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  INTERNAL_API_SECRET: z.string().min(1),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const missing = parsedEnv.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ");
    throw new Error(
      `Invalid environment configuration: ${missing}. Copy .env.example to .env.local and set all required values.`
    );
  }

export const env = parsedEnv.data;