import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
try {
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/sciencedash_main.png', fullPage: false });
  await page.screenshot({ path: '/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/sciencedash_fullpage.png', fullPage: true });
  console.log('OK · main + fullpage saved');
} catch (e) {
  console.error('FAIL', e.message);
}
await browser.close();
