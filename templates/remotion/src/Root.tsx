import React from "react";
import { Composition } from "remotion";
import { TestVideo } from "./TestVideo";
import type { TimingEntry } from "./types";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TestVideo"
        component={TestVideo}
        durationInFrames={900}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          timingData: [] as TimingEntry[],
        }}
      />
    </>
  );
};
