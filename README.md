# Nex AI Release Quality Orchestrator

[![Quality Lab](https://github.com/janagrit/nex-ai-release-quality-orchestrator/actions/workflows/quality.yml/badge.svg?branch=master)](https://github.com/janagrit/nex-ai-release-quality-orchestrator/actions/workflows/quality.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Independent QA engineering portfolio project: **detecting update-related gameplay regressions in a motion-controlled gaming system before release.**

## Evidence boundary
This is not affiliated with Nex. No Nex device, firmware, private telemetry, source code, or internal test data is used. Device metrics and release profiles are simulated. Public user reports are signals to investigate, not verified root causes. See [`quality/evidence-register.md`](quality/evidence-register.md).

## The problem
Nex's help center says a background software update can reduce game performance, because the CPU can't dedicate its full resources to gameplay. Initial downloads can take 30–45 minutes. Public bug reports after updates describe missed movements, launch failures, and FPS drops. These may or may not share a cause, but they raise one engineering question:

> How can a release be shown **not** to degrade gameplay, both on its own and while an update runs in the background, before it reaches players?

## What it does
1. Generates a deterministic motion-event sequence (1,000 moves) from a fixed seed.
2. Replays that same sequence against the baseline and candidate builds under two conditions:
   - **idle**: no update running
   - **background-update**: 85% background CPU during events 200–799
3. Measures input latency, dropped motions, recognition rate, FPS, startup, and crashes.
4. Applies version-controlled release gates per condition.
5. Attributes the regression to the build itself or to update contention, using telemetry from inside and outside the update window.
6. Produces a report for human release review. It recommends; it does not decide.

The random draws for each event are paired across builds, so any differences come only from the build model and the condition.

### Sample result (synthetic)
> **Every number in this section is synthetic.** The values come from the seeded simulator in this repository (seed `20261106`), not from a Nex device, real gameplay, or a real release. They show how the gates behave and say nothing about actual Nex performance.

`1.8.3-sim` passes every gate with no update running. With a background update active, it is blocked against baseline `1.8.2-sim` on five gates:

| Gate | Baseline `1.8.2-sim` | Candidate `1.8.3-sim` | Limit |
|---|---|---|---|
| Median input latency | 88.5 ms | 134.7 ms (+46.2 ms) | Increase of at most 15 ms |
| Dropped motions | 7 of 1,000 | 55 of 1,000 (+48) | Increase of at most 15 |
| Average frame rate | 58.1 FPS | 53.5 FPS | At least 55 FPS |
| Motion recognition rate | 98.4% | 90.9% | At least 97% |
| Crashes | 0 | 1 | No new crashes |

Within the same candidate session, median input latency is 79.6 ms outside the update window and 139.1 ms inside it.

## Architecture
Public signal → hypothesis → seeded motion sequence → simulator (build × condition) → paired telemetry comparison → deterministic gates → attribution findings → evidence report → human release review.

| File | Role |
|---|---|
| `src/simulator.ts` | Seeded motion sequence and session replay |
| `src/profiles.ts` | Synthetic build models and test conditions |
| `src/quality.ts` | Release gates, comparison, attribution, orchestration |
| `src/report.ts` | Writes `comparison-report.json` |
| `demo/` | Local web UI for the report |
| `quality/` | Evidence register, test catalog, architecture decisions |

## Run
Requires Node.js 20+.

```bash
npm install
npx playwright install chromium
npm run typecheck
npm test
npm run report
npm run demo     # http://127.0.0.1:4173
```

## How it was built
The project was built in one focused working session in November 2026 and first committed as a single snapshot. The history was later reorganized into logical commits (tooling, simulator, gates, demo, tests, docs) to make it easier to review, so commit dates don't show how long each part took.

## License
[MIT](LICENSE)

## Limits
The simulator validates test design, orchestration, metric comparison, attribution logic, and release-gate behavior. It can't validate real camera recognition, physical lighting, thermal behavior, real firmware installation, hardware revisions, or actual device latency. Those require device access and approved diagnostics. Multi-player tracking scenarios are designed in the test catalog but not simulated, for this reason.
