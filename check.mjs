import {chromium} from '/home/xianzhen-tan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const browser = await chromium.launch({headless:true, executablePath:'/usr/bin/google-chrome', args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
const errors = [];
const desktop = await browser.newPage({viewport:{width:1600,height:1000}});
desktop.on('pageerror', error => errors.push(error.message));
desktop.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text()); });
await desktop.goto('http://127.0.0.1:8766/#1',{waitUntil:'networkidle'});
await desktop.waitForSelector('#event3d-cover canvas',{timeout:15000});
await desktop.waitForTimeout(500);
const count = await desktop.locator('.slide').count();
const blankMath = await desktop.locator('.math:not(:has(.katex))').count();
const diagram = await desktop.locator('.architecture img').evaluate(img => ({width:img.naturalWidth,height:img.naturalHeight}));
const reports = [];
for (let i = 1; i <= count; i++) {
  await desktop.evaluate(i => location.hash = String(i),i);
  await desktop.waitForTimeout(100);
  reports.push(await desktop.evaluate(() => {
    const slide = document.querySelector('.slide.active');
    const bounds = slide.getBoundingClientRect();
    const footer = slide.querySelector('footer');
    const items = [...slide.children].filter(el => !el.classList.contains('speaker') && el.tagName !== 'FOOTER' && !el.classList.contains('cover-ink') && !el.classList.contains('scene'));
    return {slide:Number(location.hash.slice(1)), scroll:slide.scrollHeight, client:slide.clientHeight,
      overflow:items.filter(el => el.getBoundingClientRect().bottom > (footer?.getBoundingClientRect().top || bounds.bottom) - 8 || el.getBoundingClientRect().right > bounds.right + 2).map(el => el.className || el.tagName)};
  }));
  if ([1,2,4,6,9,12,13,14].includes(i)) await desktop.screenshot({path:`output/kineticslot_story/build/desktop-${String(i).padStart(2,'0')}.png`});
}
await desktop.evaluate(() => location.hash='2');
await desktop.waitForTimeout(150);
const canvas = desktop.locator('#event3d-demo canvas');
const before = await canvas.screenshot();
await desktop.locator('#event-time').fill('6900');
await desktop.waitForTimeout(250);
const after = await canvas.screenshot();
const interaction = {time:await desktop.locator('#event-time-label').textContent(),changed:!before.equals(after)};
await desktop.locator('#event-time').evaluate(element => element.blur());
await desktop.keyboard.press('n');
interaction.notes = await desktop.locator('#notes').isVisible();
await desktop.keyboard.press('n');
await desktop.keyboard.press('o');
interaction.overview = await desktop.locator('#overview').isVisible();
await desktop.locator('#overview-close').click();
await desktop.locator('#event-play').click();
interaction.play = await desktop.locator('#event-play').textContent();
await desktop.locator('#event-play').click();

const mobile = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
mobile.on('pageerror', error => errors.push(`mobile: ${error.message}`));
await mobile.goto('http://127.0.0.1:8766/#1',{waitUntil:'networkidle'});
await mobile.waitForSelector('#event3d-cover canvas',{timeout:15000});
const mobileReports = [];
for (let i = 1; i <= count; i++) {
  await mobile.evaluate(i => location.hash = String(i),i);
  await mobile.waitForTimeout(80);
  mobileReports.push(await mobile.evaluate(() => ({slide:Number(location.hash.slice(1)), doc:document.documentElement.scrollWidth, active:document.querySelector('.slide.active').scrollWidth, view:innerWidth})));
  if ([1,2,6,12,14].includes(i)) await mobile.screenshot({path:`output/kineticslot_story/build/mobile-${String(i).padStart(2,'0')}.png`});
}
console.log(JSON.stringify({count,blankMath,diagram,interaction,desktopOverflow:reports.filter(r => r.scroll > r.client + 2 || r.overflow.length), mobileOverflow:mobileReports.filter(r => r.doc > r.view || r.active > r.view),errors},null,2));
await browser.close();
