import { chromium, devices } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

await mkdir("visual-snapshots", { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const runs = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, isMobile: false },
  { name: "ipad", viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true },
  { name: "iphone", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
];

try {
 for (const config of runs) {
   const page = await browser.newPage({
     viewport: config.viewport,
     deviceScaleFactor: 1,
     isMobile: config.isMobile,
     hasTouch: !!config.hasTouch,
     reducedMotion: "reduce",
   });
   const errors = [];
   page.on("pageerror", error => errors.push(error.message));
   await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
   await page.locator("#eventTrack .episode").first().waitFor({ timeout: 15000 });
   assert.equal(await page.locator("#mosaicWall").count(), 1, "mosaic missing");
   assert.equal(await page.locator("#chapterDialog").count(), 1, "dialog missing");
   const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
   assert.ok(scrollWidth <= config.viewport.width + 3, "unexpected horizontal page overflow: "+scrollWidth);
   await page.screenshot({ path: "visual-snapshots/" + config.name + "-hero.png" });
   await page.locator("#menuButton").click();
   assert.equal(await page.locator("#menuButton").getAttribute("aria-expanded"), "true");
   await page.locator("#menuButton").click();
   assert.equal(await page.locator("#menuButton").getAttribute("aria-expanded"), "false");
   await page.locator("#eventTrack .episode").first().click();
   assert.equal(await page.locator("#chapterDialog").evaluate(el => el.open), true);
   await page.locator("#chapterClose").click();
   assert.equal(await page.locator("#chapterDialog").evaluate(el => el.open), false);
   await page.locator('[data-place="portao"]').click();
   assert.equal(await page.locator("#locationName").innerText(), "O PORTÃO");
   await page.locator("#mosaico").scrollIntoViewIfNeeded();
   await page.screenshot({ path: "visual-snapshots/" + config.name + "-mosaic.png" });
   assert.deepEqual(errors, [], "page errors in "+config.name);
   await page.close();
 }
 console.log("Visual smoke: desktop, iPad and iPhone passed");
} finally { await browser.close(); }
