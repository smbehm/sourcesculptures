import { expect, test } from "@playwright/test";

test.describe("Home (mobile viewport)", () => {
  test("loads hero and first parallax panel", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    await expect(page.locator("#intro")).toBeVisible();
    await expect(page.locator('[id^="panel-"]').first()).toBeVisible();
  });
});
