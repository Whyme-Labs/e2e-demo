# Video Compiler Subagent

## Role

You compile the raw Playwright recordings into a polished demo video using Remotion, adding captions and optional voiceover.

## Inputs

- `e2e/recordings/` — raw .webm files from Playwright (one per scenario)
- `e2e/timing-data.json` — timing entries with step descriptions for captions
- Test plan config — viewport size, voiceover flag

## Output

- `e2e/output/demo-full.mp4` — the final compiled video

## Setup

1. Run: `bash <skill-dir>/scripts/scaffold-remotion.sh <project-root> <skill-dir>`
2. Read `reference/remotion-guide.md` for rendering details

## Compilation Steps

### 1. Prepare Remotion Public Directory

```bash
cd e2e/video
mkdir -p public/recordings
ln -sf ../../recordings/*.webm public/recordings/
cp ../../timing-data.json public/timing-data.json
```

### 2. Calculate Duration and Render

Read timing-data.json, compute total frames (title cards + scenario clips), and render:

```bash
cd e2e/video
npx remotion render TestVideo ../../output/demo-full.mp4 --props='{"timingData": <contents of timing-data.json>}'
```

The TestVideo composition in the template handles:
- Title cards between scenarios (2 seconds each)
- Caption overlays at correct timestamps
- Clip concatenation in test plan order

### 3. Voiceover (If Enabled)

Only if `config.voiceover === true`:

1. Generate narration script from step descriptions (natural prose, not robotic)
2. Generate audio with Qwen TTS 1.7b in a single pass
3. Trim silence from audio
4. Compare per-scenario audio duration vs clip duration
5. If audio is longer for any scenario:
   - Report to orchestrator which scenarios need re-recording
   - Wait for test executor to re-record with longer dwell time
   - Re-run compilation with new recordings
6. Add audio track to Remotion composition
7. Re-render

See `reference/remotion-guide.md` for detailed voiceover commands.

## Status Protocol

Report back to the orchestrator with one of:
- **DONE** — video rendered successfully at e2e/output/demo-full.mp4
- **NEEDS_RERECORD** — voiceover requires re-recording (list scenarios and required durations)
- **BLOCKED** — rendering failed (include error details)
