import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

page.on("console", (msg) => {
  const txt = msg.text();
  if (txt.includes("TitleSlide") || msg.type() === "error") {
    console.log(`[log ${Date.now()}] ${msg.type()}: ${txt}`);
  }
});
page.on("pageerror", (e) => console.log(`[pageerror ${Date.now()}]`, e.message));

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
console.log(`[${Date.now()}] press Space`);
await page.keyboard.press("Space");
await page.waitForTimeout(800);
console.log(`[${Date.now()}] screenshot at t+800`);
await page.screenshot({ path: "/tmp/title_single_800.png" });
// dom check at same moment
const dom = await page.evaluate(() => {
  const canvases = Array.from(document.querySelectorAll("canvas")).map((c) => ({
    w: c.width, h: c.height,
    rectW: Math.round(c.getBoundingClientRect().width),
    rectH: Math.round(c.getBoundingClientRect().height),
    opacity: getComputedStyle(c.parentElement).opacity,
    displayed: c.offsetParent !== null,
    z: getComputedStyle(c.parentElement).zIndex,
  }));
  return canvases;
});
console.log(`[${Date.now()}] DOM: ${JSON.stringify(dom)}`);
await browser.close();
