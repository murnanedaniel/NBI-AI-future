// Capture scenes 5, 6, 7 — the inner-loop region
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

async function getSceneIdx() {
  return await page.evaluate(() => {
    const m = document.body.innerText.match(/\[(\d+)\/\d+\]/);
    return m ? parseInt(m[1], 10) : -1;
  });
}

const targets = { 5: 'loopsViz', 6: 'quirksAside', 7: 'innerLoopHistory' };
const seen = new Set();
let lastIdx = -1;
for (let i = 0; i < 80; i++) {
  const idx = await getSceneIdx();
  if (idx !== lastIdx && targets[idx] && !seen.has(idx)) {
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `/tmp/p3_${idx}_${targets[idx]}_a.png` });
    // also press space once and capture again to see step 1 / 2 of innerLoopHistory
    if (idx === 7) {
      for (let k = 1; k < 4; k++) {
        await page.keyboard.press('Space');
        await page.waitForTimeout(900);
        await page.screenshot({ path: `/tmp/p3_${idx}_${targets[idx]}_step${k}.png` });
      }
    }
    console.log(`captured ${idx}: ${targets[idx]}`);
    seen.add(idx);
  }
  lastIdx = idx;
  if (idx === 8) break;
  await page.keyboard.press('Space');
  await page.waitForTimeout(70);
}
console.log(`errors: ${errs.length}`);
errs.slice(0, 5).forEach(e => console.log('  ' + e));
await browser.close();
