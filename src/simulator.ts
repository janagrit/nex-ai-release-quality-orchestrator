import type { Condition, EventTelemetry, Metrics, MotionEvent, ReleaseProfile, SessionResult } from './types.js';

const MOVES = ['jump', 'squat', 'punch-left', 'punch-right', 'lean-left', 'lean-right', 'raise-arms', 'step-forward'];

/** mulberry32: small deterministic PRNG so every run is reproducible. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The scripted player input. Same seed gives the same sequence for every build. */
export function motionSequence(seed: number, count: number): MotionEvent[] {
  const rand = prng(seed);
  let t = 0;
  return Array.from({ length: count }, (_, index) => {
    t += 400 + Math.floor(rand() * 400);
    return { index, move: MOVES[Math.floor(rand() * MOVES.length)], timestampMs: t };
  });
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const round = (v: number, digits = 1) => Number(v.toFixed(digits));

/**
 * Replays the motion sequence against one build under one condition.
 * Random draws come from a per-event stream seeded by (seed, index), so the
 * baseline and candidate see identical noise and differences come only from
 * the build model and the condition (a paired comparison).
 */
export function runSession(release: ReleaseProfile, condition: Condition, events: MotionEvent[], seed: number): SessionResult {
  const telemetry: EventTelemetry[] = events.map((e) => {
    const rand = prng(seed ^ Math.imul(e.index + 1, 0x9e3779b1));
    const inWindow = condition.updateWindow !== null && e.index >= condition.updateWindow[0] && e.index < condition.updateWindow[1];
    const load = inWindow ? condition.backgroundCpuLoad : 0;

    const dropRate = release.baseDropRate + load * release.contentionDropRate;
    const missRate = release.baseMisrecognitionRate + load * release.contentionMisrecognitionRate;
    const dropped = rand() < dropRate;
    const recognized = !dropped && rand() >= missRate;
    const jitter = (rand() * 2 - 1) * release.latencyJitterMs;
    const latencyMs = dropped ? null : release.baseLatencyMs + load * release.contentionLatencyMs + jitter;
    const frameMs = release.baseFrameMs * (1 + load * release.contentionFrameFactor) * (1 + (rand() - 0.5) * 0.02);

    return { index: e.index, move: e.move, inUpdateWindow: inWindow, dropped, recognized, latencyMs, frameMs };
  });

  const latencies = (rows: EventTelemetry[]) => rows.flatMap((r) => (r.latencyMs === null ? [] : [r.latencyMs]));
  const inside = telemetry.filter((r) => r.inUpdateWindow);
  const outside = telemetry.filter((r) => !r.inUpdateWindow);
  const meanFrameMs = telemetry.reduce((sum, r) => sum + r.frameMs, 0) / telemetry.length;
  const contentionActive = condition.updateWindow !== null && condition.backgroundCpuLoad > 0;

  const metrics: Metrics = {
    startupMs: release.startupMs,
    medianInputLatencyMs: round(median(latencies(telemetry)) ?? 0),
    droppedMotionEvents: telemetry.filter((r) => r.dropped).length,
    totalMotionEvents: telemetry.length,
    averageFps: round(1000 / meanFrameMs),
    crashCount: contentionActive ? release.crashesUnderContention : 0,
    motionRecognitionRate: round(telemetry.filter((r) => r.recognized).length / telemetry.length, 3),
  };

  const summarize = (rows: EventTelemetry[]) => {
    const m = median(latencies(rows));
    return { events: rows.length, medianLatencyMs: m === null ? null : round(m), dropped: rows.filter((r) => r.dropped).length };
  };

  return {
    releaseVersion: release.version,
    condition: condition.id,
    seed,
    metrics,
    window: { inside: summarize(inside), outside: summarize(outside) },
  };
}
