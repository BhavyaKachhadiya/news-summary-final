type LogLevel = "INFO" | "WARN" | "ERROR";

function formatLog(level: LogLevel, context: string, message: string, meta?: unknown) {
  const timestamp = new Date().toISOString();
  const logObj = {
    timestamp,
    level,
    context,
    message,
    ...(meta !== undefined ? { data: sanitizeMeta(meta) } : {}),
  };
  return JSON.stringify(logObj);
}

/**
 * Sanitizes metadata to prevent logging sensitive keys like API tokens, secrets, etc.
 */
function sanitizeMeta(meta: unknown): unknown {
  if (typeof meta !== "object" || meta === null) {
    return meta;
  }

  if (Array.isArray(meta)) {
    return meta.map(sanitizeMeta);
  }

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("secret") ||
      lowerKey.includes("key") ||
      lowerKey.includes("token") ||
      lowerKey.includes("password") ||
      lowerKey.includes("auth")
    ) {
      safe[key] = "[REDACTED]";
    } else if (value instanceof Error) {
      safe[key] = {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    } else {
      safe[key] = sanitizeMeta(value);
    }
  }
  return safe;
}

export const logger = {
  info(context: string, message: string, meta?: unknown) {
    console.log(formatLog("INFO", context, message, meta));
  },
  warn(context: string, message: string, meta?: unknown) {
    console.warn(formatLog("WARN", context, message, meta));
  },
  error(context: string, message: string, meta?: unknown) {
    console.error(formatLog("ERROR", context, message, meta));
  },
};
