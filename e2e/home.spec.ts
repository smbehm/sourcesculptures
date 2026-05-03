import { expect, test } from "@playwright/test";

test.describe("Home (mobile viewport)", () => {
  test("loads hero and first parallax panel", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("sourcesculptures:playback:mute", "0");
      } catch {
        /* noop */
      }
    });

    await page.goto("/", { waitUntil: "load" });

    await expect(page.locator("#intro")).toBeVisible();
    await expect(page.locator('[id^="panel-"]').first()).toBeVisible();

    await expect(
      page.getByRole("region", { name: /site audio/i }),
    ).toBeVisible();
  });
});
