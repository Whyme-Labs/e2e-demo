import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { Caption } from "./Caption";
import type { TimingEntry } from "./types";

const FPS = 30;

/** Title card shown between scenarios */
const TitleCard: React.FC<{ name: string; description: string }> = ({
  name,
  description,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, 50, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a2e",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <h1
        style={{
          color: "#ffffff",
          fontSize: 48,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 700,
          margin: 0,
        }}
      >
        {name}
      </h1>
      <p
        style={{
          color: "#a0a0b0",
          fontSize: 24,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 400,
          marginTop: 16,
        }}
      >
        {description}
      </p>
    </AbsoluteFill>
  );
};

interface TestVideoProps {
  timingData: TimingEntry[];
}

export const TestVideo: React.FC<TestVideoProps> = ({ timingData }) => {
  const TITLE_CARD_FRAMES = 60; // 2 seconds at 30fps

  // Group timing entries by scenario
  const scenarios = new Map<string, TimingEntry[]>();
  for (const entry of timingData) {
    if (!scenarios.has(entry.scenario)) {
      scenarios.set(entry.scenario, []);
    }
    scenarios.get(entry.scenario)!.push(entry);
  }

  let currentFrame = 0;
  const sequences: React.ReactNode[] = [];

  for (const [scenarioId, entries] of scenarios) {
    const firstEntry = entries[0];
    const lastEntry = entries[entries.length - 1];

    // Title card
    sequences.push(
      <Sequence
        key={`title-${scenarioId}`}
        from={currentFrame}
        durationInFrames={TITLE_CARD_FRAMES}
      >
        <TitleCard
          name={scenarioId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          description={firstEntry.description}
        />
      </Sequence>
    );
    currentFrame += TITLE_CARD_FRAMES;

    // Video clip for this scenario
    const scenarioDurationMs =
      lastEntry.timestamp_ms + lastEntry.wait_duration_ms + 1000; // +1s buffer
    const scenarioDurationFrames = Math.ceil((scenarioDurationMs / 1000) * FPS);

    sequences.push(
      <Sequence
        key={`video-${scenarioId}`}
        from={currentFrame}
        durationInFrames={scenarioDurationFrames}
      >
        <AbsoluteFill>
          <OffthreadVideo
            src={staticFile(`recordings/${firstEntry.video_file}`)}
            style={{ width: "100%", height: "100%" }}
          />
          {entries.map((entry) => {
            const captionStartFrame = Math.floor(
              (entry.timestamp_ms / 1000) * FPS
            );
            const captionDuration = Math.max(
              Math.ceil((entry.wait_duration_ms / 1000) * FPS),
              FPS * 2 // minimum 2 seconds
            );
            return (
              <Caption
                key={`caption-${entry.scenario}-${entry.step}`}
                text={entry.description}
                startFrame={captionStartFrame}
                durationFrames={captionDuration}
              />
            );
          })}
        </AbsoluteFill>
      </Sequence>
    );

    currentFrame += scenarioDurationFrames;
  }

  return <AbsoluteFill>{sequences}</AbsoluteFill>;
};
