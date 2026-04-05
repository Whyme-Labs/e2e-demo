import React from "react";
import { Composition } from "remotion";
import { TestVideo } from "./TestVideo";
import type { TimingEntry } from "./types";

const FPS = 30;
const TITLE_CARD_FRAMES = 60;

function computeTotalFrames(timingData: TimingEntry[]): number {
  if (timingData.length === 0) return 300; // 10s default for empty/preview

  const scenarios = new Map<string, TimingEntry[]>();
  for (const entry of timingData) {
    if (!scenarios.has(entry.scenario)) {
      scenarios.set(entry.scenario, []);
    }
    scenarios.get(entry.scenario)!.push(entry);
  }

  let totalFrames = 0;
  for (const [, entries] of scenarios) {
    totalFrames += TITLE_CARD_FRAMES; // title card per scenario
    const lastEntry = entries[entries.length - 1];
    const scenarioDurationMs = lastEntry.timestamp_ms + lastEntry.wait_duration_ms + 1000;
    totalFrames += Math.ceil((scenarioDurationMs / 1000) * FPS);
  }

  return Math.max(totalFrames, 1);
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TestVideo"
        component={TestVideo}
        fps={FPS}
        width={1280}
        height={720}
        defaultProps={{
          timingData: [] as TimingEntry[],
        }}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: computeTotalFrames(props.timingData),
          };
        }}
      />
    </>
  );
};
