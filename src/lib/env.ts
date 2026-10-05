import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().default("mongodb://localhost:27017/ai-news"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  CRON_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsedEnv = envSchema.parse({
  MONGODB_URI: process.env.MONGODB_URI,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  CRON_SECRET: process.env.CRON_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

export const env = {
  get MONGODB_URI(): string {
    return parsedEnv.MONGODB_URI;
  },
  get GEMINI_API_KEY(): string | undefined {
    return parsedEnv.GEMINI_API_KEY;
  },
  get GEMINI_MODEL(): string {
    return parsedEnv.GEMINI_MODEL;
  },
  get CRON_SECRET(): string | undefined {
    return parsedEnv.CRON_SECRET;
  },
  get isProduction(): boolean {
    return parsedEnv.NODE_ENV === "production";
  },
};
