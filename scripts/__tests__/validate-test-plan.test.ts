import { describe, it, expect } from "vitest";
import { validateTestPlan } from "../validate-test-plan.js";

const validPlan = {
  scenarios: [
    {
      id: "auth-flow",
      name: "Authentication Flow",
      description: "Login with debug user",
      steps: [
        {
          action: "navigate" as const,
          target: "http://localhost:3000",
          wait_for: "[data-testid='login-button']",
          screenshot: true,
          description: "Navigate to homepage",
        },
        {
          action: "click" as const,
          target: "[data-testid='login-button']",
          wait_for: "[data-testid='login-form']",
          screenshot: true,
          description: "Click login button",
        },
      ],
    },
  ],
  config: {
    base_url: "http://localhost:3000",
    viewport: { width: 1280, height: 720 },
    video: true,
    voiceover: false,
  },
};

describe("validateTestPlan", () => {
  it("returns no errors for a valid plan", () => {
    const result = validateTestPlan(validPlan);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects empty scenarios array", () => {
    const plan = { ...validPlan, scenarios: [] };
    const result = validateTestPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("at least one scenario") })
    );
  });

  it("rejects duplicate scenario IDs", () => {
    const plan = {
      ...validPlan,
      scenarios: [validPlan.scenarios[0], { ...validPlan.scenarios[0] }],
    };
    const result = validateTestPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("Duplicate scenario ID") })
    );
  });

  it("rejects scenario with no steps", () => {
    const plan = {
      ...validPlan,
      scenarios: [{ ...validPlan.scenarios[0], steps: [] }],
    };
    const result = validateTestPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("at least one step") })
    );
  });

  it("rejects invalid action type", () => {
    const plan = {
      ...validPlan,
      scenarios: [
        {
          ...validPlan.scenarios[0],
          steps: [{ ...validPlan.scenarios[0].steps[0], action: "teleport" }],
        },
      ],
    };
    const result = validateTestPlan(plan as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("Invalid action") })
    );
  });

  it("rejects step with empty wait_for", () => {
    const plan = {
      ...validPlan,
      scenarios: [
        {
          ...validPlan.scenarios[0],
          steps: [{ ...validPlan.scenarios[0].steps[0], wait_for: "" }],
        },
      ],
    };
    const result = validateTestPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("wait_for") })
    );
  });

  it("rejects step with empty description", () => {
    const plan = {
      ...validPlan,
      scenarios: [
        {
          ...validPlan.scenarios[0],
          steps: [{ ...validPlan.scenarios[0].steps[0], description: "" }],
        },
      ],
    };
    const result = validateTestPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("description") })
    );
  });

  it("rejects fill action without value", () => {
    const plan = {
      ...validPlan,
      scenarios: [
        {
          ...validPlan.scenarios[0],
          steps: [
            {
              action: "fill" as const,
              target: "#email",
              wait_for: "#email",
              screenshot: false,
              description: "Fill email",
            },
          ],
        },
      ],
    };
    const result = validateTestPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("value") })
    );
  });

  it("rejects missing config fields", () => {
    const plan = { ...validPlan, config: { base_url: "" } as any };
    const result = validateTestPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("base_url") })
    );
  });
});
