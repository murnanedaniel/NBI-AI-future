// Press space until we hit a target scene index, then screenshot.
// Reads the presenter HUD which contains "[N/28]" to know current scene.
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

async function getSceneIdx() {
  // PresenterClock renders something like "scene name [N/28]"
  return await page.evaluate(() => {
    const txt = document.body.innerText;
    const m = txt.match(/\[(\d+)\/\d+\]/);
    return m ? parseInt(m[1], 10) : -1;
  });
}

const targets = {
  9: 'rorvigRunPhone', // 9th scene
  12: 'remoteControlPhone',
  19: 'statsFeint',
  20: 'scienceDashToday',
  24: 'faculty2031Teaching',
  25: 'reverseLectureEvidence',
  26: 'phdPedagogy',
  27: 'nbiAINativeCallToAction',
  28: 'claudeFinalSlide',
};

let lastIdx = -1;
for (let i = 0; i < 100; i++) {
  const idx = await getSceneIdx();
  if (idx !== lastIdx) {
    if (targets[idx]) {
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `/tmp/scene_${String(idx).padStart(2, '0')}_${targets[idx]}.png` });
      console.log(`captured scene ${idx}: ${targets[idx]}`);
    }
    lastIdx = idx;
  }
  if (idx === 28) break;
  await page.keyboard.press('Space');
  await page.waitForTimeout(70);
}

console.log(`errors: ${errs.length}`);
errs.slice(0, 5).forEach(e => console.log('  ' + e));
await browser.close();
