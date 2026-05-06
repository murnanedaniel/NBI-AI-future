import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE ERR:", msg.text());
});

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(500);

const before = await page.evaluate(() => {
  const canvases = Array.from(document.querySelectorAll("canvas")).map((c) => ({
    w: c.width, h: c.height,
    rectW: c.getBoundingClientRect().width,
    rectH: c.getBoundingClientRect().height,
    parentDisplay: getComputedStyle(c.parentElement).display,
    parentOpacity: getComputedStyle(c.parentElement).opacity,
    visible: c.offsetParent !== null,
  }));
  return { canvases };
});
console.log("BEFORE space:", JSON.stringify(before, null, 2));

await page.keyboard.press("Space");

for (const delay of [100, 300, 600, 1000, 1400]) {
  await page.waitForTimeout(delay === 100 ? 100 : (delay - (delay === 300 ? 100 : delay === 600 ? 300 : delay === 1000 ? 600 : 1000)));
  const state = await page.evaluate(() => {
    const canvases = Array.from(document.querySelectorAll("canvas")).map((c) => ({
      w: c.width, h: c.height,
      rectW: Math.round(c.getBoundingClientRect().width),
      rectH: Math.round(c.getBoundingClientRect().height),
      parentDisplay: getComputedStyle(c.parentElement).display,
      parentOpacity: getComputedStyle(c.parentElement).opacity,
      offsetParent: c.offsetParent ? c.offsetParent.tagName : "NULL",
    }));
    // check DOM structure
    const rollDiv = document.querySelector('[class*="z-20"]');
    return {
      canvases,
      rollDivDisplay: rollDiv ? getComputedStyle(rollDiv).display : "NOT-FOUND",
      rollDivChildren: rollDiv ? rollDiv.children.length : 0,
    };
  });
  console.log(`AT ${delay}ms:`, JSON.stringify(state, null, 2));
}

await browser.close();
