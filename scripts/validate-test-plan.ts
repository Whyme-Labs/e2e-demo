const VALID_ACTIONS = ["navigate", "click", "fill", "select", "hover", "scroll", "press"] as const;

interface ValidationError {
  path: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateTestPlan(plan: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate scenarios array
  if (!Array.isArray(plan?.scenarios) || plan.scenarios.length === 0) {
    errors.push({ path: "scenarios", message: "Test plan must have at least one scenario" });
  } else {
    // Check for duplicate IDs
    const ids = new Set<string>();
    for (const scenario of plan.scenarios) {
      if (ids.has(scenario.id)) {
        errors.push({
          path: `scenarios[${scenario.id}]`,
          message: `Duplicate scenario ID: "${scenario.id}"`,
        });
      }
      ids.add(scenario.id);

      // Validate steps
      if (!Array.isArray(scenario.steps) || scenario.steps.length === 0) {
        errors.push({
          path: `scenarios[${scenario.id}].steps`,
          message: `Scenario "${scenario.id}" must have at least one step`,
        });
      } else {
        scenario.steps.forEach((step: any, i: number) => {
          const stepPath = `scenarios[${scenario.id}].steps[${i}]`;

          if (!VALID_ACTIONS.includes(step.action)) {
            errors.push({
              path: `${stepPath}.action`,
              message: `Invalid action "${step.action}". Must be one of: ${VALID_ACTIONS.join(", ")}`,
            });
          }

          if (!step.wait_for || step.wait_for.trim() === "") {
            errors.push({
              path: `${stepPath}.wait_for`,
              message: `Step ${i + 1} in "${scenario.id}" must have a non-empty wait_for selector`,
            });
          }

          if (!step.description || step.description.trim() === "") {
            errors.push({
              path: `${stepPath}.description`,
              message: `Step ${i + 1} in "${scenario.id}" must have a non-empty description`,
            });
          }

          if (step.action === "fill" && (!step.value || step.value.trim() === "")) {
            errors.push({
              path: `${stepPath}.value`,
              message: `Fill action in step ${i + 1} of "${scenario.id}" requires a value`,
            });
          }

          if (step.action === "select" && (!step.value || step.value.trim() === "")) {
            errors.push({
              path: `${stepPath}.value`,
              message: `Select action in step ${i + 1} of "${scenario.id}" requires a value`,
            });
          }

          if (step.action === "press" && (!step.key || step.key.trim() === "")) {
            errors.push({
              path: `${stepPath}.key`,
              message: `Press action in step ${i + 1} of "${scenario.id}" requires a key`,
            });
          }
        });
      }
    }
  }

  // Validate config
  if (!plan?.config?.base_url || plan.config.base_url.trim() === "") {
    errors.push({ path: "config.base_url", message: "Config must have a non-empty base_url" });
  }
  if (!plan?.config?.viewport?.width || !plan?.config?.viewport?.height) {
    errors.push({ path: "config.viewport", message: "Config must have viewport with width and height" });
  }

  return { valid: errors.length === 0, errors };
}

// CLI entrypoint: validate a JSON file
const isDirectRun = process.argv[1]?.endsWith("validate-test-plan.ts") || process.argv[1]?.endsWith("validate-test-plan.js");
if (isDirectRun) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx validate-test-plan.ts <test-plan.json>");
    process.exit(1);
  }

  const fs = await import("node:fs");
  const raw = fs.readFileSync(filePath, "utf-8");
  const plan = JSON.parse(raw);
  const result = validateTestPlan(plan);

  if (result.valid) {
    console.log("Test plan is valid.");
    console.log(`  ${plan.scenarios.length} scenario(s), ${plan.scenarios.reduce((n: number, s: any) => n + s.steps.length, 0)} total step(s)`);
  } else {
    console.error("Test plan validation failed:");
    for (const err of result.errors) {
      console.error(`  [${err.path}] ${err.message}`);
    }
    process.exit(1);
  }
}
