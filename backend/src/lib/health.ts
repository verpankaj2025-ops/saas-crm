import { redis } from "../config/redis";
import { db } from "../config/supabase";
import { whatsappQueue, emailQueue } from "../queues";

// ── Types ─────────────────────────────────────────────────────

type CheckStatus = "ok" | "fail";

interface CheckResult {
  status:    CheckStatus;
  latencyMs: number;
  error?:    string;
}

interface QueueCheckResult extends CheckResult {
  counts?: Record<string, number>;
}

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthReport {
  status:        HealthStatus;
  timestamp:     string;
  uptimeSeconds: number;
  checks: {
    redis:    CheckResult;
    supabase: CheckResult;
    queues:   QueueCheckResult;
  };
}

// ── Helpers ───────────────────────────────────────────────────

const TIMEOUT_MS = 3_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout after " + ms + "ms")), ms),
    ),
  ]);
}

// ── Individual probes ─────────────────────────────────────────

async function checkRedis(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const reply = await withTimeout(redis.ping(), TIMEOUT_MS);
    if (reply !== "PONG") throw new Error("Unexpected PING reply");
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status:    "fail",
      latencyMs: Date.now() - start,
      error:     err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await withTimeout(
      (async () => {
        const { error } = await db.from("channels").select("id").limit(1);
        if (error) throw new Error(error.message);
      })(),
      TIMEOUT_MS,
    );
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status:    "fail",
      latencyMs: Date.now() - start,
      error:     err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkQueues(): Promise<QueueCheckResult> {
  const start = Date.now();
  try {
    const [wa, email] = await withTimeout(
      Promise.all([
        whatsappQueue.getJobCounts("waiting", "active", "failed"),
        emailQueue.getJobCounts("waiting", "active", "failed"),
      ]),
      TIMEOUT_MS,
    );
    return {
      status:    "ok",
      latencyMs: Date.now() - start,
      counts: {
        "whatsapp:waiting": wa.waiting,
        "whatsapp:active":  wa.active,
        "whatsapp:failed":  wa.failed,
        "email:waiting":    email.waiting,
        "email:active":     email.active,
        "email:failed":     email.failed,
      },
    };
  } catch (err) {
    return {
      status:    "fail",
      latencyMs: Date.now() - start,
      error:     err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ── Aggregator ────────────────────────────────────────────────

export async function getHealthReport(): Promise<HealthReport> {
  const [redisResult, supabaseResult, queuesResult] = await Promise.all([
    checkRedis(),
    checkSupabase(),
    checkQueues(),
  ]);

  const criticalOk = redisResult.status === "ok" && supabaseResult.status === "ok";
  const allOk      = criticalOk && queuesResult.status === "ok";

  const status: HealthStatus = allOk
    ? "healthy"
    : criticalOk
      ? "degraded"   // queues unreachable but core infra up
      : "unhealthy"; // Redis or Supabase down

  return {
    status,
    timestamp:     new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    checks: {
      redis:    redisResult,
      supabase: supabaseResult,
      queues:   queuesResult,
    },
  };
}
