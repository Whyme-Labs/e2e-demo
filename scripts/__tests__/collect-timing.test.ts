import { describe, it, expect, vi } from "vitest";
import {
  createTimingCollector,
  type TimingCollector,
} from "../collect-timing.js";

// Mock a minimal Playwright page-like object
function createMockPage() {
  const listeners: Record<string, Function[]> = {};
  return {
    waitForSelector: vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return {};
    }),
    click: vi.fn(async () => {}),
    fill: vi.fn(async () => {}),
    screenshot: vi.fn(async () => Buffer.from("png")),
    on: vi.fn((event: string, handler: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    _emit: (event: string, ...args: any[]) => {
      listeners[event]?.forEach((h) => h(...args));
    },
  };
}

describe("createTimingCollector", () => {
  it("creates a collector with empty initial state", () => {
    const page = createMockPage();
    const collector = createTimingCollector(page as any, "auth-flow", "auth-flow.webm");
    expect(collector.getTimingEntries()).toHaveLength(0);
    expect(collector.getErrorEntries()).toHaveLength(0);
  });

  it("records timing for a wait action", async () => {
    const page = createMockPage();
    const collector = createTimingCollector(page as any, "auth-flow", "auth-flow.webm");

    await collector.timedWait({
      step: 1,
      step_id: "wait-for-login",
      description: "Wait for login button",
      selector: "[data-testid='login-button']",
    });

    const entries = collector.getTimingEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].scenario).toBe("auth-flow");
    expect(entries[0].step).toBe(1);
    expect(entries[0].step_id).toBe("wait-for-login");
    expect(entries[0].wait_duration_ms).toBeGreaterThanOrEqual(0);
    expect(entries[0].video_file).toBe("auth-flow.webm");
  });

  it("records timing for a click action with wait", async () => {
    const page = createMockPage();
    const collector = createTimingCollector(page as any, "auth-flow", "auth-flow.webm");

    await collector.timedClick({
      step: 2,
      step_id: "click-login",
      description: "Click login button",
      selector: "[data-testid='login-button']",
      wait_for: "[data-testid='login-form']",
    });

    expect(page.click).toHaveBeenCalledWith("[data-testid='login-button']");
    expect(page.waitForSelector).toHaveBeenCalledWith("[data-testid='login-form']");

    const entries = collector.getTimingEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].step_id).toBe("click-login");
  });

  it("captures screenshot and records filename", async () => {
    const page = createMockPage();
    const collector = createTimingCollector(page as any, "auth-flow", "auth-flow.webm");

    await collector.timedWait({
      step: 1,
      step_id: "homepage",
      description: "Navigate to homepage",
      selector: "body",
      screenshot: { dir: "/tmp/screenshots" },
    });

    expect(page.screenshot).toHaveBeenCalled();
    const entries = collector.getTimingEntries();
    expect(entries[0].screenshot).toBe("auth-flow-01-homepage.png");
  });

  it("accumulates timestamps relative to scenario start", async () => {
    const page = createMockPage();
    const collector = createTimingCollector(page as any, "auth-flow", "auth-flow.webm");

    await collector.timedWait({
      step: 1,
      step_id: "step-one",
      description: "First step",
      selector: "body",
    });
    await collector.timedWait({
      step: 2,
      step_id: "step-two",
      description: "Second step",
      selector: "#next",
    });

    const entries = collector.getTimingEntries();
    expect(entries[1].timestamp_ms).toBeGreaterThanOrEqual(entries[0].timestamp_ms);
  });

  it("captures console errors to error log", () => {
    const page = createMockPage();
    const collector = createTimingCollector(page as any, "auth-flow", "auth-flow.webm");

    // Simulate a console error event
    const consoleHandler = page.on.mock.calls.find((c) => c[0] === "console")?.[1];
    expect(consoleHandler).toBeDefined();

    consoleHandler!({ type: () => "error", text: () => "Uncaught TypeError: foo" });

    const errors = collector.getErrorEntries();
    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe("console-error");
    expect(errors[0].message).toBe("Uncaught TypeError: foo");
    expect(errors[0].scenario).toBe("auth-flow");
  });

  it("captures page errors to error log", () => {
    const page = createMockPage();
    const collector = createTimingCollector(page as any, "auth-flow", "auth-flow.webm");

    const pageErrorHandler = page.on.mock.calls.find((c) => c[0] === "pageerror")?.[1];
    expect(pageErrorHandler).toBeDefined();

    pageErrorHandler!(new Error("Unhandled rejection"));

    const errors = collector.getErrorEntries();
    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe("page-error");
    expect(errors[0].message).toBe("Unhandled rejection");
  });
});
