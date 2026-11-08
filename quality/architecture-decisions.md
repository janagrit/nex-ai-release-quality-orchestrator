# Architecture decisions

## ADR-001: Simulator-first
Start without a physical device or internal diagnostics. This validates scenario design, orchestration, telemetry comparison and release gates. It does not validate real camera, firmware, thermal, sensor or hardware behavior.

## ADR-002: Deterministic release gates
Use version-controlled thresholds. The LLM may plan scenarios and summarize evidence, but cannot silently change thresholds or override a BLOCK.

## ADR-003: Human approval
The orchestrator recommends; a human owns the final release decision. No autonomous deployment or production modification.
