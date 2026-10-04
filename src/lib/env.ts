export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required but was not provided.`);
  }
  return value;
}

export const env = {
  get MONGODB_URI(): string {
    return process.env.MONGODB_URI || "mongodb://localhost:27017/ai-news";
  },
  get GEMINI_API_KEY(): string | undefined {
    return process.env.GEMINI_API_KEY;
  },
  get GEMINI_MODEL(): string {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash";
  },
  get CRON_SECRET(): string | undefined {
    return process.env.CRON_SECRET;
  },
  get isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  },
};
