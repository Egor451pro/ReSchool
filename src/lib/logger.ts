type LogLevel = "info" | "warn" | "error";

type LogFields = {
  action?: string;
  userId?: string | null;
  durationMs?: number;
  error?: string;
  [key: string]: unknown;
};

function write(level: LogLevel, message: string, fields: LogFields = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};

export async function withAction<T>(
  action: string,
  userId: string | null | undefined,
  run: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  try {
    const result = await run();
    logger.info("action.ok", {
      action,
      userId: userId ?? null,
      durationMs: Date.now() - started,
    });
    return result;
  } catch (error) {
    logger.error("action.fail", {
      action,
      userId: userId ?? null,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}
