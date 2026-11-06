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
   if (scrollWidth > config.viewport.width + 3) {
     const offenders = await page.evaluate(() => [...document.querySelectorAll("body *")].map(el => ({el,rect:el.getBoundingClientRect()})).filter(({el,rect}) => rect.width>0 && rect.left < innerWidth && rect.right > innerWidth+3 && getComputedStyle(el).position!=="fixed").slice(0,15).map(({el,rect})=>({tag:el.tagName,cls:el.className?.toString().slice(0,80),right:Math.round(rect.right),left:Math.round(rect.left),text:el.textContent?.trim().slice(0,30)})));
     console.log("OVERFLOW ELEMENTS "+config.name+": "+JSON.stringify(offenders));
   }
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
 const motion = await browser.newPage({ viewport:{width:1440,height:900}, reducedMotion:"no-preference" });
 await motion.goto("http://127.0.0.1:4173/",{waitUntil:"domcontentloaded"});
 await motion.locator("#eventTrack .episode").first().waitFor({timeout:15000});
 await motion.waitForTimeout(180);
 const initial = await motion.locator("#yearPin").evaluate(el=>el.getBoundingClientRect().top+window.scrollY);
 const railRange = await motion.locator("#eventTrack").evaluate(el=>el.scrollWidth-el.clientWidth);
 assert.ok(railRange>100,"rail too short for cinematographic movement");
 await motion.evaluate(y=>window.scrollTo({top:y+550,behavior:"instant"}),initial);
 await motion.waitForTimeout(300);
 const railPosition = await motion.locator("#eventTrack").evaluate(el=>el.scrollLeft);
 assert.ok(railPosition>80,"scroll-driven travelling did not advance: "+railPosition);
 await motion.screenshot({path:"visual-snapshots/desktop-travelling.png"});
 await motion.close();
 console.log("Visual smoke: desktop, iPad and iPhone passed");
} finally { await browser.close(); }
