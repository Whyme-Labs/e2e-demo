import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface CaptionProps {
  text: string;
  startFrame: number;
  durationFrames: number;
}

export const Caption: React.FC<CaptionProps> = ({
  text,
  startFrame,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0 || relativeFrame >= durationFrames) {
    return null;
  }

  // Fade in over first 5 frames, fade out over last 5 frames
  const opacity = interpolate(
    relativeFrame,
    [0, 5, durationFrames - 5, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: 8,
          fontSize: 24,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 500,
          maxWidth: "80%",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        {text}
      </div>
    </div>
  );
};
