# Playwright Patterns for E2E Demo

## Recording Setup

```typescript
const context = await browser.newContext({
  recordVideo: { dir: "e2e/recordings/", size: { width: 1280, height: 720 } },
  viewport: { width: 1280, height: 720 },
});
const page = await context.newPage();
```

After each scenario, close the page to finalize the video:
```typescript
await page.close(); // Finalizes the .webm recording
const videoPath = await page.video()?.path();
```

## Element-Based Waits (No Static Waits)

**Never use `page.waitForTimeout()` or `setTimeout`.** Always wait for a DOM condition.

### Wait Patterns

```typescript
// Wait for element to appear
await page.waitForSelector("[data-testid='dashboard']");

// Wait for element to be visible (not just in DOM)
await page.locator("[data-testid='modal']").waitFor({ state: "visible" });

// Wait for navigation to complete after click
await Promise.all([
  page.waitForURL("**/dashboard"),
  page.click("[data-testid='login-submit']"),
]);

// Wait for network response after action
await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/user") && r.status() === 200),
  page.click("[data-testid='save-button']"),
]);

// Wait for element to disappear (loading spinner)
await page.locator(".loading-spinner").waitFor({ state: "hidden" });
```

### Why Non-Blocking

Playwright waits poll the DOM from the Node.js process via CDP (Chrome DevTools Protocol). The browser's JS thread continues running normally — animations play, timers fire, network requests complete. The wait resolves when the condition is met, not by freezing execution.

## UI-Only Navigation

**Never use `page.goto()` after the initial URL.** All subsequent navigation must happen through UI interactions.

```typescript
// GOOD: Initial navigation only
await page.goto(config.base_url);

// GOOD: Navigate via UI
await page.click("nav a[href='/settings']");
await page.waitForSelector("[data-testid='settings-page']");

// BAD: Programmatic navigation
await page.goto("/settings"); // Don't do this
```

### Common UI Navigation Patterns

```typescript
// Click a nav link
await page.click("nav >> text=Settings");

// Click a sidebar item
await page.click("[data-testid='sidebar'] >> text=Users");

// Submit a form (navigates to next page)
await page.click("button[type='submit']");

// Use breadcrumbs
await page.click(".breadcrumb >> text=Home");
```

## Error Event Listeners

Set these up at the start of each scenario. The `collect-timing.ts` helper handles this automatically.

```typescript
// These are set up by createTimingCollector()
page.on("console", (msg) => { /* logged to error-log.json */ });
page.on("pageerror", (error) => { /* logged to error-log.json */ });
page.on("response", (response) => { /* 4xx/5xx logged to error-log.json */ });
```

## Screenshot Capture

```typescript
await page.screenshot({
  path: `e2e/screenshots/${scenario}-${step.toString().padStart(2, "0")}-${stepId}.png`,
  fullPage: false, // Capture viewport only (matches video)
});
```

## Action Patterns

```typescript
// Click
await page.click(selector);

// Fill input
await page.fill(selector, value);

// Select dropdown
await page.selectOption(selector, value);

// Hover
await page.hover(selector);

// Scroll element into view
await page.locator(selector).scrollIntoViewIfNeeded();

// Press key
await page.press(selector, key);
```
