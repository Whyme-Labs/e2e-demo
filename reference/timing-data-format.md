# Timing Data & Test Report Format

## timing-data.json

Array of `TimingEntry` objects. One entry per test step executed.

```json
[
  {
    "scenario": "auth-flow",
    "step": 1,
    "step_id": "navigate-homepage",
    "description": "Navigate to homepage",
    "timestamp_ms": 0,
    "wait_duration_ms": 450,
    "screenshot": "auth-flow-01-navigate-homepage.png",
    "video_file": "auth-flow.webm"
  }
]
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `scenario` | string | Scenario ID from test plan (kebab-case) |
| `step` | number | 1-based step index within scenario |
| `step_id` | string | Kebab-case step identifier |
| `description` | string | Human-readable caption text |
| `timestamp_ms` | number | Milliseconds from scenario recording start |
| `wait_duration_ms` | number | Actual element-based wait duration (ms) |
| `screenshot` | string | Filename in `e2e/screenshots/` |
| `video_file` | string | Filename in `e2e/recordings/` |

### Key Rules

- `timestamp_ms` is **relative to the scenario start**, not global
- `wait_duration_ms` comes from real element-based waits (never static)
- Screenshot naming: `{scenario}-{step:02d}-{step_id}.png`
- One video file per scenario

## error-log.json

Array of `ErrorLogEntry` objects. Written by the test executor's event listeners, monitored by the error watcher subagent.

```json
[
  {
    "timestamp": "2026-04-05T10:30:45.123Z",
    "type": "console-error",
    "message": "Uncaught TypeError: Cannot read property 'price' of undefined",
    "stack": "at Checkout (components/Checkout.tsx:42)",
    "scenario": "checkout-flow",
    "step": 3
  }
]
```

### Error Types

| Type | Source | Critical |
|------|--------|----------|
| `console-error` | `page.on('console')` where type is `error` | Yes |
| `page-error` | `page.on('pageerror')` — unhandled exceptions | Yes |
| `network-error` | HTTP responses with status >= 400 | 5xx = Yes, 4xx = evaluate |

## test-report.md

Human-readable markdown report generated after test execution.

```markdown
# E2E Test Report
**Date:** YYYY-MM-DD
**App:** app-name (base_url)
**Total scenarios:** N | **Passed:** N | **Failed:** N

## Scenario Name [PASS|FAIL]
| # | Step | Wait (ms) | Status |
|---|------|-----------|--------|
| 1 | Step description | 450 | PASS |
| 2 | Step description | 320 | FAIL |
**Error:** error message
**Stack:** stack trace location
```
