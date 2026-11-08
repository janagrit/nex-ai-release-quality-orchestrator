import type { Condition, ReleaseProfile } from './types.js';

// Synthetic build models. The candidate is deliberately modelled as handling
// background-update contention worse than the baseline, while behaving almost
// identically when no update is running. That is the regression class this
// project is designed to catch.

export const baseline: ReleaseProfile = {
  id: 'baseline',
  version: '1.8.2-sim',
  startupMs: 4200,
  baseLatencyMs: 76,
  latencyJitterMs: 6,
  contentionLatencyMs: 20,
  baseDropRate: 0.006,
  contentionDropRate: 0.01,
  baseMisrecognitionRate: 0.008,
  contentionMisrecognitionRate: 0.006,
  baseFrameMs: 16.7,
  contentionFrameFactor: 0.06,
  crashesUnderContention: 0,
};

export const candidate: ReleaseProfile = {
  id: 'candidate',
  version: '1.8.3-sim',
  startupMs: 4500,
  baseLatencyMs: 80,
  latencyJitterMs: 6,
  contentionLatencyMs: 70,
  baseDropRate: 0.007,
  contentionDropRate: 0.08,
  baseMisrecognitionRate: 0.009,
  contentionMisrecognitionRate: 0.06,
  baseFrameMs: 16.8,
  contentionFrameFactor: 0.22,
  crashesUnderContention: 1,
};

export const idle: Condition = {
  id: 'idle',
  label: 'No background update',
  backgroundCpuLoad: 0,
  updateWindow: null,
};

// Nex's help center notes that a background update can take 30-45 minutes and
// can reduce game performance. Here it overlaps 60% of the play session.
export const backgroundUpdate: Condition = {
  id: 'background-update',
  label: 'Background update during gameplay (85% CPU, events 200-799)',
  backgroundCpuLoad: 0.85,
  updateWindow: [200, 800],
};

export const DEFAULT_SEED = 20261106;
export const DEFAULT_EVENT_COUNT = 1000;
