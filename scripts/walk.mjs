#!/usr/bin/env node
// Playwright walk-through: drives localhost:3000 through every scene/step,
// saving one 1920x1080 PNG per step under artifacts/walkthrough/.

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const SCENES = [
  { id: "title",               steps: 3 },
  { id: "rateRamp",            steps: 4 },
  { id: "trackingProblem",     steps: 3 },
  { id: "gnnSolution",         steps: 4 },
  { id: "speedJourney",        steps: 3 },
  { id: "aiForAi",             steps: 2 },
  { id: "easter1Release",      steps: 1 },
  { id: "easter2Bug",          steps: 1 },
  { id: "easter3SmokingGun",   steps: 1 },
  { id: "easter4CrossEval",    steps: 1 },
  { id: "easter5Dispatch",     steps: 1 },
  { id: "easter6Architecture", steps: 1 },
  { id: "easter7Discovery",    steps: 1 },
  { id: "easter8Reveal",       steps: 1 },
  { id: "easter9Thesis",       steps: 1 },
  { id: "easter10WhyPossible", steps: 1 },
  { id: "statsFeint",          steps: 1 },
  { id: "matchmaking",         steps: 1 },
  { id: "act3Preamble",        steps: 1 },
  { id: "faculty2031Morning",  steps: 1 },
  { id: "faculty2031Teaching", steps: 1 },
  { id: "wordcloud",           steps: 1 },
  { id: "mondayMorning",       steps: 1 },
  { id: "close3Papers",        steps: 3 },
  { id: "closeQuestion",       steps: 2 },
];

const OUT_DIR = "/home/murnanedaniel/Research/conferences/faculty_retreat/artifacts/walkthrough";
const URL = process.env.WALK_URL ?? "http://localhost:3000";
const SCENE_SETTLE_MS = Number(process.env.WALK_SETTLE_MS ?? 2500);
const STEP_SETTLE_MS = Number(process.env.WALK_STEP_MS ?? 1500);

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

console.log(`→ ${URL}`);
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(SCENE_SETTLE_MS);

let idx = 0;
for (let sIdx = 0; sIdx < SCENES.length; sIdx++) {
  const scene = SCENES[sIdx];
  for (let step = 0; step < scene.steps; step++) {
    const wait = step === 0 ? SCENE_SETTLE_MS : STEP_SETTLE_MS;
    await page.waitForTimeout(wait);
    const label = `${String(idx).padStart(3, "0")}_${scene.id}_s${step}`;
    const file = path.join(OUT_DIR, `${label}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`  ${label}`);
    idx++;
    const lastStepOfLastScene = sIdx === SCENES.length - 1 && step === scene.steps - 1;
    if (!lastStepOfLastScene) {
      await page.keyboard.press("Space");
    }
  }
}

await browser.close();
console.log(`\n${idx} screenshots saved → ${OUT_DIR}`);
