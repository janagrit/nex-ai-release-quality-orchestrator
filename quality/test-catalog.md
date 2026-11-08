# Test catalog

## Primary: update-to-gameplay regression (simulated, automated)

Every RG-001..RG-006 check runs under two conditions with the same seeded motion sequence: `idle` (no update running) and `background-update` (85% background CPU during motion events 200–799 of 1,000).

| ID | Scenario | Purpose | Expected result | Evidence | Actual (simulated, seed 20261106) |
|---|---|---|---|---|---|
| RG-001 | Compare motion recognition rate | Detect recognition regression | Candidate ≥ 97% | E-01, E-02 | idle PASS (0.988); update BLOCK (0.909) |
| RG-002 | Compare median input latency | Detect slower response | Increase ≤ 15 ms | E-01 | idle PASS (+4.1); update BLOCK (+46.2) |
| RG-003 | Compare dropped motion events | Detect lost player input | Increase ≤ 15 events | E-01, E-02 | idle PASS (+1); update BLOCK (+48) |
| RG-004 | Compare average FPS | Detect rendering degradation | Average ≥ 55 FPS | E-01, E-05 | idle PASS (59.5 FPS); update BLOCK (53.5 FPS) |
| RG-005 | Compare startup time | Detect slower launch | Increase ≤ 1,000 ms | E-03 | PASS in both (+300) |
| RG-006 | Compare crash count | Detect stability regression | No new crashes | E-03 | idle PASS; update BLOCK (0 → 1) |
| RG-007 | Update-to-gameplay release journey (E2E) | Validate the release evaluation flow in the demo UI | Idle PASS and background-update BLOCK both shown | — | PASS |
| RG-008 | Attribution: inside vs outside update window | Separate update contention from build regression | Degradation concentrated inside the window | E-01 | Candidate median latency 79.6 ms outside, 139.1 ms inside; 52/600 drops inside vs 3/400 outside |

The "Actual" column is simulator output from `npm test` / `npm run report`. It shows the gates and orchestration work as designed. It is not a measurement of any Nex build.

## Planned scenarios (not yet automated)

| ID | Scenario | Why |
|---|---|---|
| RG-009 | Update interrupted mid-download (power loss / network drop), then gameplay | OTA robustness (E-07) |
| RG-010 | Update completes during an active session (restart prompt, state retention) | OTA and gameplay interaction |
| RG-011 | Game build N+1 on platform build N, and the reverse | Release compatibility (E-03) |

## Secondary: multi-player motion-tracking reliability (designed only)

These need a device, camera, and controlled lighting. A simulator can't produce meaningful results for them, so they are listed as test designs, not results.

| ID | Scenario | Measure |
|---|---|---|
| MP-001 | Two players cross paths | Identity swaps per crossing; time to re-acquire |
| MP-002 | Two to four players move simultaneously | Per-player dropped events; per-player latency vs single-player baseline |
| MP-003 | Player distance and lighting matrix | Recognition rate per cell (distance × lux) |
| MP-004 | Four players vs one player, same moves | Latency and FPS scaling with player count |
| MP-005 | Per-player settings (e.g. difficulty) persist after an update | Functional: P2 setting matches selection (E-04) |
| MP-006 | Any of MP-001..MP-004, baseline vs candidate build | Tracking-accuracy regression across updates |
