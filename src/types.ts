/** Aggregated session metrics that the release gates evaluate. */
export type Metrics = {
  startupMs: number;
  medianInputLatencyMs: number;
  droppedMotionEvents: number;
  totalMotionEvents: number;
  averageFps: number;
  crashCount: number;
  motionRecognitionRate: number;
};

/**
 * Simulated behaviour of one build. These are model parameters, not measurements:
 * they describe how the build responds when a background update competes for CPU.
 */
export type ReleaseProfile = {
  id: string;
  version: string;
  startupMs: number;
  baseLatencyMs: number;
  latencyJitterMs: number;
  /** Extra latency at 100% background CPU load. */
  contentionLatencyMs: number;
  baseDropRate: number;
  /** Extra drop probability at 100% background CPU load. */
  contentionDropRate: number;
  baseMisrecognitionRate: number;
  contentionMisrecognitionRate: number;
  baseFrameMs: number;
  /** Relative frame-time increase at 100% background CPU load. */
  contentionFrameFactor: number;
  /** Crashes observed in a session where contention is active. */
  crashesUnderContention: number;
};

export type MotionEvent = { index: number; move: string; timestampMs: number };

export type Condition = {
  id: 'idle' | 'background-update';
  label: string;
  /** Background CPU load while the update window is active, 0..1. */
  backgroundCpuLoad: number;
  /** Motion-event index range [start, end) during which the update runs. */
  updateWindow: [number, number] | null;
};

export type EventTelemetry = {
  index: number;
  move: string;
  inUpdateWindow: boolean;
  dropped: boolean;
  recognized: boolean;
  latencyMs: number | null;
  frameMs: number;
};

export type WindowEvidence = {
  inside: { events: number; medianLatencyMs: number | null; dropped: number };
  outside: { events: number; medianLatencyMs: number | null; dropped: number };
};

export type SessionResult = {
  releaseVersion: string;
  condition: Condition['id'];
  seed: number;
  metrics: Metrics;
  window: WindowEvidence;
};

export type Gate = {
  metric: keyof Metrics;
  baseline: number;
  candidate: number;
  delta: number;
  status: 'PASS' | 'BLOCK';
  reason: string;
};

export type Report = {
  condition: Condition['id'];
  conditionLabel: string;
  baselineVersion: string;
  candidateVersion: string;
  overall: 'PASS' | 'BLOCK';
  gates: Gate[];
};

export type OrchestrationResult = {
  plan: { title: string; hypothesis: string; steps: string[] };
  seed: number;
  sessions: SessionResult[];
  comparisons: Report[];
  overall: 'PASS' | 'BLOCK';
  findings: string[];
  caveat: string;
};
