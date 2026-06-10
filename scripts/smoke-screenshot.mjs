// Visual smoke screenshot — used during the warm-earthy redesign to capture
// light + dark renders of any route. Run with the dev server already on :3000.
//
//   node scripts/smoke-screenshot.mjs <url> <out.png> [--dark]
//
// Default viewport: 1440x900, full page.
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:3000/';
const out = process.argv[3] || 'scripts/smoke-light.png';
const dark = process.argv.includes('--dark');

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
if (dark) {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
  });
}
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: true });
console.log('saved', out);
await browser.close();
