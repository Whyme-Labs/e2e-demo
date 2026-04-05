import type { TimingEntry, ErrorLogEntry } from "../templates/remotion/src/types.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

interface WaitOptions {
  step: number;
  step_id: string;
  description: string;
  selector: string;
  screenshot?: { dir: string };
}

interface ClickOptions extends WaitOptions {
  wait_for: string;
}

interface FillOptions extends ClickOptions {
  value: string;
}

export interface TimingCollector {
  timedWait(opts: WaitOptions): Promise<void>;
  timedClick(opts: ClickOptions): Promise<void>;
  timedFill(opts: FillOptions): Promise<void>;
  getTimingEntries(): TimingEntry[];
  getErrorEntries(): ErrorLogEntry[];
  flushToFiles(timingPath: string, errorLogPath: string): void;
}

export function createTimingCollector(
  page: any,
  scenario: string,
  videoFile: string
): TimingCollector {
  const timingEntries: TimingEntry[] = [];
  const errorEntries: ErrorLogEntry[] = [];
  const scenarioStart = Date.now();
  let currentStep = 0;

  // Set up error listeners
  page.on("console", (msg: any) => {
    const type = typeof msg.type === "function" ? msg.type() : msg.type;
    const text = typeof msg.text === "function" ? msg.text() : msg.text;
    if (type === "error") {
      errorEntries.push({
        timestamp: new Date().toISOString(),
        type: "console-error",
        message: text,
        scenario,
        step: currentStep,
      });
    }
  });

  page.on("pageerror", (error: Error) => {
    errorEntries.push({
      timestamp: new Date().toISOString(),
      type: "page-error",
      message: error.message,
      stack: error.stack,
      scenario,
      step: currentStep,
    });
  });

  page.on("response", (response: any) => {
    const status = typeof response.status === "function" ? response.status() : response.status;
    const url = typeof response.url === "function" ? response.url() : response.url;
    if (status >= 400) {
      errorEntries.push({
        timestamp: new Date().toISOString(),
        type: "network-error",
        message: `HTTP ${status}`,
        url,
        status_code: status,
        scenario,
        step: currentStep,
      });
    }
  });

  function formatScreenshotName(step: number, stepId: string): string {
    return `${scenario}-${String(step).padStart(2, "0")}-${stepId}.png`;
  }

  async function recordTiming(
    step: number,
    stepId: string,
    description: string,
    waitFn: () => Promise<void>,
    screenshotOpts?: { dir: string }
  ): Promise<void> {
    currentStep = step;
    const beforeWait = Date.now();
    await waitFn();
    const afterWait = Date.now();

    const screenshotName = formatScreenshotName(step, stepId);

    if (screenshotOpts) {
      mkdirSync(screenshotOpts.dir, { recursive: true });
      await page.screenshot({
        path: join(screenshotOpts.dir, screenshotName),
      });
    }

    timingEntries.push({
      scenario,
      step,
      step_id: stepId,
      description,
      timestamp_ms: beforeWait - scenarioStart,
      wait_duration_ms: afterWait - beforeWait,
      screenshot: screenshotName,
      video_file: videoFile,
    });
  }

  return {
    async timedWait(opts: WaitOptions) {
      await recordTiming(
        opts.step,
        opts.step_id,
        opts.description,
        () => page.waitForSelector(opts.selector).then(() => {}),
        opts.screenshot
      );
    },

    async timedClick(opts: ClickOptions) {
      await recordTiming(
        opts.step,
        opts.step_id,
        opts.description,
        async () => {
          await page.click(opts.selector);
          await page.waitForSelector(opts.wait_for).then(() => {});
        },
        opts.screenshot
      );
    },

    async timedFill(opts: FillOptions) {
      await recordTiming(
        opts.step,
        opts.step_id,
        opts.description,
        async () => {
          await page.fill(opts.selector, opts.value);
          await page.waitForSelector(opts.wait_for).then(() => {});
        },
        opts.screenshot
      );
    },

    getTimingEntries() {
      return [...timingEntries];
    },

    getErrorEntries() {
      return [...errorEntries];
    },

    flushToFiles(timingPath: string, errorLogPath: string) {
      mkdirSync(dirname(timingPath), { recursive: true });
      mkdirSync(dirname(errorLogPath), { recursive: true });
      writeFileSync(timingPath, JSON.stringify(timingEntries, null, 2));
      writeFileSync(errorLogPath, JSON.stringify(errorEntries, null, 2));
    },
  };
}
