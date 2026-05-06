// Drive into easter5Dispatch step 1, hold for ~10s, screenshot, then advance to step 3 and capture again.
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

async function getSceneAndStep() {
  return await page.evaluate(() => {
    const t = document.body.innerText;
    const sc = t.match(/\[(\d+)\/\d+\]/);
    const st = t.match(/step\s+(\d+)\/(\d+)/);
    return { scene: sc ? +sc[1] : -1, step: st ? +st[1] : -1, total: st ? +st[2] : -1 };
  });
}

async function bodyText() {
  return await page.evaluate(() => document.body.innerText);
}

// Walk forward by space until we hit easter5Dispatch (the only 4-step Easter scene)
let dispatchScene = -1;
for (let i = 0; i < 60; i++) {
  const { scene, total } = await getSceneAndStep();
  if (total === 4) { dispatchScene = scene; break; }
  await page.keyboard.press('Space');
  await page.waitForTimeout(80);
}
console.log(`dispatch scene index: ${dispatchScene}`);

// Step into 1 (advance once from current 1/4 → 2/4 means: we're at 1/4 first, press space once)
const enter = await getSceneAndStep();
console.log(`entered: scene=${enter.scene} step=${enter.step}/${enter.total}`);
// We're at step 1/4. Advance to step 2/4 (the side-by-side).
await page.keyboard.press('Space');
await page.waitForTimeout(2000);
const t1a = await bodyText();
await page.screenshot({ path: '/tmp/dispatch_step1_t0.png' });

await page.waitForTimeout(8000);
const t1b = await bodyText();
await page.screenshot({ path: '/tmp/dispatch_step1_t10.png' });

// Detect drift in event count area
function eventsCount(t) {
  const m = t.match(/events\s+(\d+)\s*\/\s*(\d+)/);
  return m ? { cur: +m[1], total: +m[2] } : null;
}
const c1 = eventsCount(t1a);
const c2 = eventsCount(t1b);
console.log(`events at +0s: ${c1?.cur}/${c1?.total}`);
console.log(`events at +10s: ${c2?.cur}/${c2?.total}`);
console.log(`advanced ${(c2?.cur ?? 0) - (c1?.cur ?? 0)} events in 10s`);

// Now advance through resources step (step 3) to rapid (step 4)
await page.keyboard.press('Space');
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/dispatch_step3.png' });
await page.keyboard.press('Space');
await page.waitForTimeout(2000);
const tRapidA = await bodyText();
await page.screenshot({ path: '/tmp/dispatch_step4_t0.png' });
await page.waitForTimeout(8000);
const tRapidB = await bodyText();
await page.screenshot({ path: '/tmp/dispatch_step4_t8.png' });
const r1 = eventsCount(tRapidA);
const r2 = eventsCount(tRapidB);
console.log(`rapid events at +0s: ${r1?.cur}/${r1?.total}`);
console.log(`rapid events at +8s: ${r2?.cur}/${r2?.total}`);
console.log(`rapid advanced ${(r2?.cur ?? 0) - (r1?.cur ?? 0)} events in 8s`);

console.log(`errors: ${errs.length}`);
errs.slice(0, 5).forEach(e => console.log('  ' + e));
await browser.close();
