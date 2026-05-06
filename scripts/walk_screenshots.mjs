// Step through the talk and screenshot at landmark positions.
// Each click advances one step (or one scene if the last step is reached).
import { chromium } from 'playwright';

const LANDMARKS = {
  // click count after which to capture a screenshot, and label
  // Cumulative clicks = sum of steps in earlier scenes + step within current scene
  // title(1) + rateRamp(6) + gnnSolution(4) + speedJourney(4) + aiForAi(2) = 17
  // + innerLoopHistory(4) = 21
  // + easter1(1) + easter2(1) = 23
  // + rorvigRunPhone(3) = 26
  // + easter5Dispatch(2) = 28
  // + remoteControlPhone(3) = 31
  // + easter3(1) + easter4(1) + easter6(1) = 34
  // + easter8Reveal(1) = 35
  // + easter9Thesis(1) = 36
  // + act3Preamble(1) = 37
  // + easter10WhyPossible(1) = 38
  // + statsFeint(4) = 42
  // + scienceDashToday(5) = 47
  // + faculty2031Morning(1) = 48
  // + nbiGraph(3) + matchmaking(1) = 52
  // + faculty2031Teaching(3) + reverseLectureEvidence(2) = 57
  // + phdPedagogy(4) = 61
  // + nbiAINativeCallToAction(2) = 63
  // + claudeFinalSlide(2) = 65
  17: 'aiForAi',
  21: 'innerLoopHistory',
  26: 'rorvigRunPhone',
  31: 'remoteControlPhone',
  42: 'statsFeint',
  47: 'scienceDashToday',
  52: 'matchmaking',
  57: 'reverseLectureEvidence',
  61: 'phdPedagogy',
  63: 'nbiAINativeCallToAction',
  65: 'claudeFinalSlide',
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
page.on('pageerror', e => errs.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errs.push(`console: ${m.text()}`); });

await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(1500);

let clicks = 0;
const TOTAL = 66;

const stage = page.locator('div[role="button"]').first();

for (let i = 1; i <= TOTAL; i++) {
  await stage.click({ position: { x: 800, y: 500 } });
  clicks = i;
  await page.waitForTimeout(80);
  if (LANDMARKS[clicks]) {
    // Wait a bit more for animations to settle
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/tmp/walk_${String(clicks).padStart(2, '0')}_${LANDMARKS[clicks]}.png` });
    console.log(`screenshot: ${clicks} ${LANDMARKS[clicks]}`);
  }
}

console.log(`\nTotal clicks: ${clicks}`);
if (errs.length) {
  console.log(`\nERRORS (${errs.length}):`);
  errs.slice(0, 10).forEach(e => console.log('  ' + e));
} else {
  console.log('\nNO console/page errors');
}
await browser.close();
