import { backgroundUpdate, DEFAULT_EVENT_COUNT, DEFAULT_SEED, idle } from './profiles.js';
import { motionSequence, runSession } from './simulator.js';
import type { Condition, Gate, Metrics, OrchestrationResult, ReleaseProfile, Report, SessionResult } from './types.js';

type Rule = { metric: keyof Metrics; test: (candidate: number, baseline: number) => boolean; reason: string };

// Version-controlled thresholds (ADR-002). Changing these is a reviewed code change.
export const rules: Rule[] = [
  { metric: 'medianInputLatencyMs', test: (v, b) => v - b <= 15, reason: 'Latency increase must not exceed 15 ms' },
  { metric: 'droppedMotionEvents', test: (v, b) => v - b <= 15, reason: 'Dropped events must not increase by more than 15' },
  { metric: 'averageFps', test: (v) => v >= 55, reason: 'Average FPS must remain at least 55' },
  { metric: 'crashCount', test: (v, b) => v <= b, reason: 'No new crashes are allowed' },
  { metric: 'motionRecognitionRate', test: (v) => v >= 0.97, reason: 'Recognition rate must remain at least 97%' },
  { metric: 'startupMs', test: (v, b) => v - b <= 1000, reason: 'Startup increase must not exceed 1,000 ms' },
];

export const CAVEAT =
  'Synthetic simulator output. Not measured on Nex hardware and not evidence of an actual Nex release defect.';

/** Applies the release gates to two sessions run under the same condition. */
export function compare(b: SessionResult, c: SessionResult, condition: Condition): Report {
  const gates: Gate[] = rules.map((r) => {
    const before = b.metrics[r.metric];
    const after = c.metrics[r.metric];
    return {
      metric: r.metric,
      baseline: before,
      candidate: after,
      delta: Number((after - before).toFixed(3)),
      status: r.test(after, before) ? 'PASS' : 'BLOCK',
      reason: r.reason,
    };
  });
  return {
    condition: condition.id,
    conditionLabel: condition.label,
    baselineVersion: b.releaseVersion,
    candidateVersion: c.releaseVersion,
    overall: gates.some((g) => g.status === 'BLOCK') ? 'BLOCK' : 'PASS',
    gates,
  };
}

function findings(reports: Report[], sessions: SessionResult[], candidateVersion: string): string[] {
  const out: string[] = [];
  const idleReport = reports.find((r) => r.condition === 'idle');
  const updateReport = reports.find((r) => r.condition === 'background-update');

  if (idleReport?.overall === 'PASS' && updateReport?.overall === 'BLOCK') {
    const blocked = updateReport.gates.filter((g) => g.status === 'BLOCK').map((g) => g.metric).join(', ');
    out.push(
      `${candidateVersion} passes every gate with no update running but blocks while a background update is active (${blocked}). ` +
        'The regression is in how the build handles update contention, not in its idle gameplay performance.',
    );
  } else if (idleReport?.overall === 'BLOCK') {
    out.push(`${candidateVersion} blocks even with no update running, so the regression is in the build itself.`);
  }

  const cand = sessions.find((s) => s.releaseVersion === candidateVersion && s.condition === 'background-update');
  if (cand && cand.window.inside.medianLatencyMs !== null && cand.window.outside.medianLatencyMs !== null) {
    out.push(
      `Within the same ${candidateVersion} session, median latency was ${cand.window.outside.medianLatencyMs} ms outside the update window ` +
        `and ${cand.window.inside.medianLatencyMs} ms inside it; ${cand.window.inside.dropped} of ${cand.window.inside.events} motions were dropped inside ` +
        `versus ${cand.window.outside.dropped} of ${cand.window.outside.events} outside.`,
    );
  }
  for (const r of reports) {
    for (const g of r.gates.filter((x) => x.status === 'BLOCK')) {
      out.push(`[${r.condition}] ${g.metric}: ${g.baseline} -> ${g.candidate} (delta ${g.delta > 0 ? '+' : ''}${g.delta}). ${g.reason}.`);
    }
  }
  return out;
}

/**
 * Update-to-gameplay regression investigation:
 * replay one motion sequence against both builds, with and without a background update.
 */
export function orchestrate(
  b: ReleaseProfile,
  c: ReleaseProfile,
  options: { seed?: number; events?: number; conditions?: Condition[] } = {},
): OrchestrationResult {
  const seed = options.seed ?? DEFAULT_SEED;
  const conditions = options.conditions ?? [idle, backgroundUpdate];
  const events = motionSequence(seed, options.events ?? DEFAULT_EVENT_COUNT);

  const sessions: SessionResult[] = [];
  const comparisons = conditions.map((condition) => {
    const bs = runSession(b, condition, events, seed);
    const cs = runSession(c, condition, events, seed);
    sessions.push(bs, cs);
    return compare(bs, cs, condition);
  });

  return {
    plan: {
      title: 'Update-to-gameplay regression detection',
      hypothesis: 'A background update may degrade motion responsiveness, game performance, or stability.',
      steps: [
        'Generate a deterministic motion-event sequence from a fixed seed',
        'Replay it against the baseline build with no update running',
        'Replay it against the baseline build with a background update active',
        'Repeat both runs against the candidate build',
        'Evaluate version-controlled release gates per condition',
        'Attribute regressions to the build or to update contention, and hand off for human review',
      ],
    },
    seed,
    sessions,
    comparisons,
    overall: comparisons.some((r) => r.overall === 'BLOCK') ? 'BLOCK' : 'PASS',
    findings: findings(comparisons, sessions, c.version),
    caveat: CAVEAT,
  };
}
