# e2e-demo

A Claude Code skill that runs E2E tests on web apps using Playwright and produces demo videos and user manuals as byproducts.

## What It Does

1. **Plans** — explores your codebase, proposes a debug auth bypass, generates a test plan
2. **Executes** — runs Playwright tests with video recording, screenshots, and timing capture
3. **Produces** — compiles recordings into a demo video (Remotion) and writes a markdown user manual
4. **Cleans up** — reverts auth bypass, restores production security

## Usage

Tell Claude to test your web app:

```
Run E2E tests on this app and produce a demo video
```

```
Test the checkout flow end-to-end and create a user manual
```

The skill will guide you through approval gates for auth changes and the test plan before executing.

## Outputs

| File | Description |
|------|-------------|
| `e2e/test-report.md` | Human-readable test execution report |
| `e2e/output/demo-full.mp4` | Compiled demo video with captions |
| `e2e/output/user-manual.md` | Markdown user manual with screenshots |
| `e2e/recordings/` | Raw Playwright .webm recordings |
| `e2e/screenshots/` | Step-by-step PNG screenshots |
| `e2e/timing-data.json` | Structured timing data for video sync |

## Requirements

- Node.js 18+
- A web app running on localhost (React/Next.js optimized, any framework supported)
- Chromium (installed automatically by Playwright)

## Optional: Voiceover

Enable voiceover in the test plan config to generate narrated videos using Qwen TTS 1.7b. Requires Python 3.10+ and the `transformers` library.

## Tech Stack

- **Playwright** — E2E testing and video recording
- **Remotion** — React-based video compilation
- **Qwen TTS 1.7b** — voiceover generation (opt-in)
