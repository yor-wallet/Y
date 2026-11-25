// Rasterises HTML pages with the pre-installed Chromium (Playwright): the brand artwork, lockups, splash and share images.
// Usage: NODE_PATH=$(npm root -g) node brand/render.cjs jobs.json
//   jobs.json = [{ "html": "/path/page.html", "out": "/path/out.png", "width": 512, "height": 512, "scale": 2, "transparent": true }, ...]
'use strict';
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const browser = await chromium.launch();
  try {
    for (const j of jobs) {
      const page = await browser.newPage({ viewport: { width: j.width, height: j.height }, deviceScaleFactor: j.scale || 1 });
      await page.setContent(fs.readFileSync(j.html, 'utf8'), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: j.out, type: 'png', omitBackground: !!j.transparent, clip: { x: 0, y: 0, width: j.width, height: j.height } });
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
