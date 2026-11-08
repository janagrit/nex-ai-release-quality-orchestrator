import { test, expect } from '@playwright/test';
import { backgroundUpdate, baseline, candidate, idle } from '../../src/profiles.js';
import { compare, orchestrate } from '../../src/quality.js';
import { motionSequence, runSession } from '../../src/simulator.js';

const SEED = 42;
const events = motionSequence(SEED, 1000);
const session = (release = baseline, condition = idle) => runSession(release, condition, events, SEED);

test('motion sequence and sessions are deterministic for a given seed', () => {
  expect(motionSequence(SEED, 50)).toEqual(motionSequence(SEED, 50));
  expect(session(candidate, backgroundUpdate)).toEqual(session(candidate, backgroundUpdate));
  expect(orchestrate(baseline, candidate)).toEqual(orchestrate(baseline, candidate));
});

test('passes when the candidate is identical to the baseline', () => {
  const same = { ...baseline, id: 'same', version: 'same-sim' };
  for (const condition of [idle, backgroundUpdate]) {
    expect(compare(session(baseline, condition), session(same, condition), condition).overall).toBe('PASS');
  }
});

test('candidate passes with no update running', () => {
  const r = compare(session(baseline, idle), session(candidate, idle), idle);
  expect(r.overall).toBe('PASS');
});

test('candidate blocks on latency, dropped motions, FPS, recognition and crash during a background update', () => {
  const r = compare(session(baseline, backgroundUpdate), session(candidate, backgroundUpdate), backgroundUpdate);
  expect(r.overall).toBe('BLOCK');
  const blocked = r.gates.filter((g) => g.status === 'BLOCK').map((g) => g.metric).sort();
  expect(blocked).toEqual(['averageFps', 'crashCount', 'droppedMotionEvents', 'medianInputLatencyMs', 'motionRecognitionRate']);
  expect(r.gates.find((g) => g.metric === 'startupMs')?.status).toBe('PASS');
});

test('degradation is concentrated inside the update window', () => {
  const s = session(candidate, backgroundUpdate);
  expect(s.window.inside.medianLatencyMs!).toBeGreaterThan(s.window.outside.medianLatencyMs! + 40);
  expect(s.window.inside.dropped / s.window.inside.events).toBeGreaterThan(s.window.outside.dropped / s.window.outside.events);
});

test('blocks a newly introduced crash even when other metrics are unchanged', () => {
  const crashy = { ...baseline, id: 'crashy', version: 'crashy-sim', crashesUnderContention: 1 };
  const r = compare(session(baseline, backgroundUpdate), session(crashy, backgroundUpdate), backgroundUpdate);
  expect(r.gates.find((g) => g.metric === 'crashCount')?.status).toBe('BLOCK');
});

test('orchestration attributes the regression to update contention', () => {
  const result = orchestrate(baseline, candidate);
  expect(result.overall).toBe('BLOCK');
  expect(result.comparisons.map((c) => [c.condition, c.overall])).toEqual([['idle', 'PASS'], ['background-update', 'BLOCK']]);
  expect(result.findings[0]).toContain('passes every gate with no update running');
  expect(result.caveat).toContain('Synthetic');
});
