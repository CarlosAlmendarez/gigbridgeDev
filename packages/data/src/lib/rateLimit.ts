/**
 * Port literal de v1 (GigBridge/gigbridge/src/lib/rateLimit.ts), solo
 * cambia el tipo del parámetro de `clientIp` de `NextRequest` a una
 * interfaz mínima estructural — `NextRequest`/`Request` la cumplen tal
 * cual, y así este módulo no depende de Next.
 *
 * Rate limiter en memoria: el estado vive en el proceso, así que en un
 * despliegue serverless/multi-instancia cada instancia lleva su propio
 * contador y el límite efectivo es (limit × instancias). Sigue subiendo
 * el costo de abuso/fuerza bruta de forma significativa. Para un límite
 * global estricto, respaldar con Redis (ej. Upstash).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count++;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

export interface HeaderSource {
  headers: { get(name: string): string | null };
}

export function clientIp(req: HeaderSource): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
