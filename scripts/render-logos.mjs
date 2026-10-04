import { chromium } from "playwright-core";
import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(projectRoot, "frontend", "public");
const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});

try {
  const page = await browser.newPage({ viewport: { width: 96, height: 96 }, deviceScaleFactor: 2 });
  for (const [source, output] of [
    ["logo-white.svg", "white logo.png"],
    ["logo-black.svg", "black logo.png"],
  ]) {
    const svg = await readFile(path.join(publicDir, source), "utf8");
    await page.setContent(`<style>html,body{margin:0;width:64px;height:64px;background:transparent}svg{width:64px;height:64px;display:block}</style>${svg}`);
    const image = page.locator("svg");
    await image.screenshot({ path: path.join(publicDir, output), omitBackground: true });
  }
} finally {
  await browser.close();
}
