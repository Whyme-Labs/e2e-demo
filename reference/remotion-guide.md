# Remotion Guide for E2E Demo

## Project Structure

The Remotion project lives at `e2e/video/` in the user's project (scaffolded by `scaffold-remotion.sh`).

```
e2e/video/
├── src/
│   ├── Root.tsx          # Registers compositions
│   ├── TestVideo.tsx     # Main composition: clips + captions + title cards
│   ├── Caption.tsx       # Caption overlay component
│   └── types.ts          # Shared types
├── public/               # Created at render time
│   ├── recordings/       # Symlinked from e2e/recordings/
│   └── timing-data.json  # Copied from e2e/timing-data.json
├── package.json
├── remotion.config.ts
└── tsconfig.json
```

## Pre-Render Setup

Before rendering, symlink recordings and copy timing data into the Remotion public directory:

```bash
cd e2e/video
mkdir -p public/recordings
ln -sf ../../recordings/*.webm public/recordings/
cp ../../timing-data.json public/timing-data.json
```

## Rendering

```bash
cd e2e/video
npx remotion render TestVideo ../../output/demo-full.mp4 \
  --props="$(node -e "
    const data = JSON.parse(require('fs').readFileSync('public/timing-data.json','utf8'));
    console.log(JSON.stringify({ timingData: data }));
  ")" \
  --concurrency=1
```

## Caption Timing

Captions are overlaid on each video clip using the timing data:

- `timestamp_ms` -> caption start frame: `Math.floor((timestamp_ms / 1000) * 30)`
- `wait_duration_ms` -> caption display duration, minimum 2 seconds (60 frames)
- Captions fade in over 5 frames and fade out over 5 frames

## Title Cards

A 2-second (60 frames) title card is inserted before each scenario:

- Dark background (#1a1a2e)
- Scenario name in large white text
- Description in smaller gray text
- Fades in/out

## Voiceover Integration (Opt-In)

When voiceover is enabled:

### 1. Generate Narration Script

From the timing data, compose a natural-sounding narration:

```
"First, we navigate to the application homepage. After the page loads,
we click the login button to open the authentication form. We enter
our credentials and submit the form. The dashboard loads, showing..."
```

Write as continuous prose, not a list of steps.

### 2. Generate Audio with Qwen TTS

```bash
python -c "
from transformers import AutoModelForCausalLM, AutoTokenizer
import soundfile as sf

model = AutoModelForCausalLM.from_pretrained('Qwen/Qwen-TTS-1.7B')
tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen-TTS-1.7B')

script = open('e2e/voiceover-script.txt').read()
audio = model.generate_speech(tokenizer(script, return_tensors='pt'))
sf.write('e2e/voiceover-raw.wav', audio.numpy(), 24000)
"
```

Trim silence:
```bash
ffmpeg -i e2e/voiceover-raw.wav -af silenceremove=1:0:-50dB:1:0:-50dB e2e/voiceover.wav
```

### 3. Sync Audio to Video

Compare voiceover segment durations against video clip durations:

```
For each scenario:
  voice_duration = duration of voiceover segment for this scenario
  clip_duration  = total scenario duration from timing data

  If voice_duration > clip_duration:
    -> Re-record this scenario with longer dwell times
    -> Do NOT pad with static frames
    -> Re-run the test executor for this scenario with extended waits
```

### 4. Re-Recording for Duration Match

When re-recording, the test executor adds natural dwell time:
- Longer pauses between actions (let page settle)
- Hover over key UI elements
- Let animations fully complete
- Scroll through content areas slowly

### 5. Add Audio to Remotion Composition

```tsx
import { Audio, staticFile } from "remotion";

// In TestVideo.tsx, add audio track:
<Audio src={staticFile("voiceover.wav")} />
```
