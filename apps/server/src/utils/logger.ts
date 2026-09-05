import { Request, Response, NextFunction } from 'express';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

// Sensitive field names to redact from logs
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'jwt',
  'secret',
  'apiKey',
  'api_key',
  'gemini_api_key',
  'GEMINI_API_KEY',
  'authorization',
  'imageBase64',
  'base64',
]);

function sanitizeData(data: any, depth = 0): any {
  if (depth > 4) return '[Max Depth]';
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.slice(0, 20).map((item) => sanitizeData(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = typeof val === 'string' ? `[REDACTED (${val.length} chars)]` : '[REDACTED]';
    } else if (typeof val === 'string' && val.length > 500) {
      sanitized[key] = `${val.slice(0, 100)}... [truncated ${val.length} chars]`;
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeData(val, depth + 1);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

class Logger {
  private get currentLevel(): LogLevel {
    const envLevel = (process.env.LOG_LEVEL || '').toLowerCase() as LogLevel;
    if (envLevel in LOG_LEVEL_PRIORITY) {
      return envLevel;
    }
    return this.isProduction ? 'info' : 'debug';
  }

  private get isProduction(): boolean {
    return (process.env.NODE_ENV || 'development').toLowerCase() === 'production';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.currentLevel];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    meta?: Record<string, any>,
    context?: string
  ): string {
    const timestamp = new Date().toISOString();
    const safeMeta = meta ? sanitizeData(meta) : undefined;

    if (this.isProduction) {
      // Structured JSON logging in production
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        context: context || 'Server',
        message,
        ...(safeMeta ? { meta: safeMeta } : {}),
      });
    }

    // Human-readable colored/badge logging in development
    const contextTag = context ? `[${context}]` : '[Server]';
    const levelTag = level.toUpperCase().padEnd(5);
    const metaStr = safeMeta && Object.keys(safeMeta).length > 0 ? `\n  ${JSON.stringify(safeMeta)}` : '';
    return `[${timestamp}] ${levelTag} ${contextTag} ${message}${metaStr}`;
  }

  public debug(message: string, meta?: Record<string, any>, context?: string): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta, context));
    }
  }

  public info(message: string, meta?: Record<string, any>, context?: string): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, meta, context));
    }
  }

  public warn(message: string, meta?: Record<string, any>, context?: string): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta, context));
    }
  }

  public error(
    message: string,
    error?: any,
    meta?: Record<string, any>,
    context?: string
  ): void {
    if (this.shouldLog('error')) {
      const errDetails: Record<string, any> = {
        ...meta,
      };
      if (error) {
        if (error instanceof Error) {
          errDetails.errorMessage = error.message;
          errDetails.stack = this.isProduction ? undefined : error.stack;
        } else if (typeof error === 'object') {
          errDetails.error = sanitizeData(error);
        } else {
          errDetails.error = String(error);
        }
      }
      console.error(this.formatMessage('error', message, errDetails, context));
    }
  }

  public http(
    method: string,
    url: string,
    statusCode: number,
    durationMs: number,
    meta?: Record<string, any>
  ): void {
    if (!this.shouldLog('info')) return;

    const message = `${method} ${url} ${statusCode} - ${durationMs.toFixed(1)}ms`;
    const httpMeta = {
      method,
      url,
      statusCode,
      durationMs: Number(durationMs.toFixed(1)),
      ...meta,
    };

    if (statusCode >= 500) {
      console.error(this.formatMessage('error', message, httpMeta, 'HTTP'));
    } else if (statusCode >= 400) {
      console.warn(this.formatMessage('warn', message, httpMeta, 'HTTP'));
    } else {
      console.info(this.formatMessage('info', message, httpMeta, 'HTTP'));
    }
  }
}

export const logger = new Logger();

/**
 * Express HTTP Request Logger Middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  const { method, originalUrl, ip } = req;

  // Log on response completion
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationMs = seconds * 1000 + nanoseconds / 1e6;

    // Filter out noisier health checks in production if desirable, or log at debug
    if (originalUrl === '/health' && process.env.NODE_ENV === 'production') {
      logger.debug(`Health check passed from ${ip}`, { ip }, 'Health');
      return;
    }

    logger.http(method, originalUrl, res.statusCode, durationMs, {
      ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};
