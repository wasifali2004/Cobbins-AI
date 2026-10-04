import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const artifactDir = path.join(projectRoot, "artifacts");
await mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.addInitScript(() => {
  try { localStorage.setItem("cobbins-theme", "dark"); } catch { /* first navigation has no origin */ }
  try { sessionStorage.removeItem("cobbins-generation-draft"); } catch { /* first navigation has no origin */ }
});

const consoleErrors = [];
const pageErrors = [];
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("pageerror", (error) => pageErrors.push(error.message));

const results = {};

try {
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  results.dark = await page.evaluate(() => {
    const heading = document.querySelector(".dash2-generation-content h1");
    const prompt = document.querySelector(".dash2-generation-form textarea");
    const beam = document.querySelector(".dash2-generation-beam");
    return {
      heading: heading?.textContent,
      headingSize: heading ? Number.parseFloat(getComputedStyle(heading).fontSize) : null,
      promptVisible: prompt?.getBoundingClientRect().height > 0,
      promptHeight: prompt?.getBoundingClientRect().height,
      generationPageHeight: document.querySelector(".dash2-generation-page")?.getBoundingClientRect().height,
      viewportHeight: window.innerHeight,
      verticalOverflow: document.documentElement.scrollHeight > window.innerHeight + 1,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      dashboardActive: document.querySelector('.dash2-nav button[data-active="true"] span')?.textContent,
      beamCount: document.querySelectorAll(".dash2-generation-beam").length,
      beamStyle: beam?.getAttribute("style"),
      beamBackground: beam ? getComputedStyle(beam, "::after").backgroundImage : null,
      upgradeButtons: document.querySelectorAll(".dash2-upgrade-button").length,
      theme: document.documentElement.dataset.theme,
    };
  });
  await page.screenshot({ path: path.join(artifactDir, "dashboard-create-dark.png"), fullPage: true });

  const upgradeButton = page.getByRole("button", { name: "Upgrade to Pro", exact: true });
  if (await upgradeButton.count() !== 1) throw new Error("Expected one Upgrade to Pro button");
  await upgradeButton.click();
  await page.waitForTimeout(250);
  results.upgrade = await page.evaluate(() => ({
    activeNavigation: document.querySelector('.dash2-nav button[data-active="true"] span')?.textContent,
    billingVisible: document.getElementById("billing")?.getBoundingClientRect().top < window.innerHeight,
  }));
  const dashboardButton = page.getByRole("button", { name: "Dashboard", exact: true });
  if (await dashboardButton.count() !== 1) throw new Error("Expected one Dashboard navigation button");
  await dashboardButton.click();
  await page.waitForTimeout(350);

  const themeToggle = page.getByRole("button", { name: "Switch to light theme", exact: true });
  if (await themeToggle.count() !== 1) throw new Error("Expected one dark-to-light theme toggle");
  await themeToggle.click();
  await page.waitForTimeout(400);
  results.light = await page.evaluate(() => {
    const beam = document.querySelector(".dash2-generation-beam");
    return {
      theme: document.documentElement.dataset.theme,
      pageBackground: getComputedStyle(document.querySelector(".dash2-shell")).backgroundColor,
      promptBackground: getComputedStyle(document.querySelector(".dash2-generation-form")).backgroundColor,
      beamStyle: beam?.getAttribute("style"),
      beamBackground: beam ? getComputedStyle(beam, "::after").backgroundImage : null,
      promptVisible: document.querySelector(".dash2-generation-form textarea")?.getBoundingClientRect().height > 0,
      verticalOverflow: document.documentElement.scrollHeight > window.innerHeight + 1,
    };
  });
  await page.screenshot({ path: path.join(artifactDir, "dashboard-create-light.png"), fullPage: true });

  const promptText = "Design a responsive analytics dashboard with a compact sidebar and accessible data tables.";
  const promptInput = page.getByLabel("Describe what you want to generate", { exact: true });
  if (await promptInput.count() !== 1) throw new Error("Expected one prompt input");
  await promptInput.fill(promptText);
  const submit = page.getByRole("button", { name: "Generate interface", exact: true });
  if (await submit.count() !== 1) throw new Error("Expected one generation submit button");
  await submit.click();
  await page.waitForURL(/\/generate\/cob-/, { timeout: 10000 });

  results.loading = await page.evaluate(() => ({
    loader: document.querySelectorAll(".ai-loader").length,
    letters: document.querySelectorAll(".loader-letter").length,
    skeleton: document.querySelectorAll(".generation-result-skeleton").length,
    canvasBusy: document.querySelector(".generation-result-canvas")?.getAttribute("aria-busy"),
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  }));
  await page.screenshot({ path: path.join(artifactDir, "dashboard-generation-loading.png"), fullPage: true });

  await page.locator(".ai-loader").waitFor({ state: "detached", timeout: 6000 });
  results.result = await page.evaluate(() => ({
    loader: document.querySelectorAll(".ai-loader").length,
    emptyOutput: document.querySelectorAll(".generation-result-empty").length,
    iframe: document.querySelectorAll(".generation-result-canvas iframe").length,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  }));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  results.mobile = await page.evaluate(() => ({
    promptVisible: document.querySelector(".dash2-generation-form textarea")?.getBoundingClientRect().height > 0,
    promptHeight: document.querySelector(".dash2-generation-form textarea")?.getBoundingClientRect().height,
    headingSize: Number.parseFloat(getComputedStyle(document.querySelector(".dash2-generation-content h1")).fontSize),
    verticalOverflow: document.documentElement.scrollHeight > window.innerHeight + 1,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    upgradeButtonInSidebar: document.querySelectorAll(".dash2-upgrade-button").length,
  }));
  await page.screenshot({ path: path.join(artifactDir, "dashboard-create-mobile.png"), fullPage: true });

  results.consoleErrors = consoleErrors;
  results.pageErrors = pageErrors;
  await writeFile(path.join(artifactDir, "dashboard-entry-qa-results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
