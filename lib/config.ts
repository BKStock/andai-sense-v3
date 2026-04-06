/**
 * Application configuration constants
 * Override via environment variables for production deployments
 */

export const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8002';

export const OLLAMA_BASE =
  process.env.OLLAMA_HOST ?? 'http://localhost:11434';

export const CRAWLER_POLL_INTERVAL_MS = 30_000;
