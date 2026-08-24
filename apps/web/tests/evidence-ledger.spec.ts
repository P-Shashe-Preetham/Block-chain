/** Evidence Ledger checks: visible authority boundaries, keyboard navigation, unavailable API state, and axe analysis without test data. */
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("renders a keyboard-reachable evidence workspace with an explicit unavailable audit state", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Review what the projection can prove." })).toBeVisible();
  await expect(page.getByText("The audit projection is unavailable until a configured backend and approved authentication boundary are present.")).toBeVisible();
  await expect(page.getByText("No browser secret storage")).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to evidence workspace" })).toBeFocused();
  await page.getByRole("button", { name: "Audit projection" }).click();
  await expect(page.getByText("Operational record").locator("..")).toContainText("Audit projection");

  const browserStorage = await page.evaluate(() => ({
    local: Object.keys(window.localStorage),
    session: Object.keys(window.sessionStorage),
  }));
  expect(browserStorage).toEqual({ local: [], session: [] });
});

test("@a11y exposes no automated axe violations in the Evidence Ledger workspace", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).include("#main-content").analyze();
  expect(results.violations).toEqual([]);
});

test("reflows the constrained evidence workspace without horizontal overflow on mobile and desktop viewports", async ({ page }) => {
  for (const viewport of [{ width: 375, height: 812 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Review what the projection can prove." })).toBeVisible();
    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  }
});
