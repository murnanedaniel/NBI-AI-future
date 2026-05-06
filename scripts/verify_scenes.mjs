import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
page.on('pageerror', e => errs.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errs.push(`console: ${m.text()}`); });
try {
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/stage_title.png' });
  console.log('OK · loaded localhost:3001');
  if (errs.length) {
    console.log('CONSOLE/PAGE ERRORS:');
    errs.forEach(e => console.log('  ' + e));
  } else {
    console.log('NO console/page errors');
  }
} catch (e) {
  console.error('FAIL', e.message);
  console.log(errs.join('\n'));
}
await browser.close();
