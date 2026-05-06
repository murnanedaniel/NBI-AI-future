// Press space many times and capture the closing arc.
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

for (let i = 1; i <= 80; i++) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(60);
  if (i >= 56 && i % 2 === 0) {
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/tmp/end_${String(i).padStart(2, '0')}.png` });
    console.log(`captured: end_${i}`);
  }
}
console.log(`errors: ${errs.length}`);
errs.slice(0, 5).forEach(e => console.log('  ' + e));
await browser.close();
