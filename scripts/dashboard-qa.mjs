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
const consoleErrors = [];
const pageErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  await page.addInitScript(() => localStorage.setItem("cobbins-theme", "dark"));
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await page.locator(".dash2-prompt-sparkles canvas").waitFor({ state: "visible", timeout: 15000 });

  const dark = await page.evaluate(() => {
    const sidebar = document.querySelector(".dash2-sidebar");
    const main = document.querySelector(".dash2-main");
    const prompt = document.querySelector(".dash2-generation-beam");
    const sparkles = document.querySelector(".dash2-prompt-sparkles");
    const promptRect = prompt?.getBoundingClientRect();
    const sparkleRect = sparkles?.getBoundingClientRect();
    return {
      theme: document.documentElement.dataset.theme,
      topbarCount: document.querySelectorAll(".dash2-topbar").length,
      workspaceCount: document.querySelectorAll(".dash2-workspace").length,
      sidebarLabels: Array.from(document.querySelectorAll(".dash2-nav button span")).map((node) => node.textContent?.trim()),
      backgroundsMatch: sidebar && main ? getComputedStyle(sidebar).backgroundColor === getComputedStyle(main).backgroundColor : false,
      sparklesBelowPrompt: Boolean(promptRect && sparkleRect && sparkleRect.top >= promptRect.bottom - 2),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  await page.screenshot({ path: path.join(artifactDir, "dashboard-sparkles-dark.png"), fullPage: true });

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.waitForTimeout(450);
  const light = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    savedTheme: localStorage.getItem("cobbins-theme"),
    sparkleOpacity: getComputedStyle(document.querySelector(".dash2-prompt-sparkles")).opacity,
  }));
  await page.screenshot({ path: path.join(artifactDir, "dashboard-sparkles-light.png"), fullPage: true });

  await page.getByRole("button", { name: "Upgrade to Pro" }).click();
  await page.getByRole("dialog", { name: "Give every idea room to become real." }).waitFor({ state: "visible" });
  const pricingDesktop = await page.evaluate(() => {
    const dialog = document.querySelector(".dash2-pricing-dialog");
    const rect = dialog?.getBoundingClientRect();
    return {
      cards: document.querySelectorAll(".dash2-pricing-card").length,
      fullyInViewport: Boolean(rect && rect.top >= 0 && rect.bottom <= window.innerHeight),
      dialogScrolls: Boolean(dialog && dialog.scrollHeight > dialog.clientHeight),
      bodyLocked: document.body.style.overflow === "hidden",
    };
  });
  await page.screenshot({ path: path.join(artifactDir, "dashboard-pricing-light.png") });
  await page.getByRole("button", { name: "Close pricing" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open navigation" }).click();
  const mobileNavigation = await page.evaluate(() => ({
    menuVisible: getComputedStyle(document.querySelector(".dash2-menu-floating")).display,
    sidebarOpen: document.querySelector(".dash2-sidebar")?.getAttribute("data-open"),
    aiBuilderCount: Array.from(document.querySelectorAll(".dash2-nav button")).filter((button) => button.textContent?.includes("AI builder")).length,
    workspaceCount: document.querySelectorAll(".dash2-workspace").length,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  }));
  await page.screenshot({ path: path.join(artifactDir, "dashboard-mobile-navigation.png") });
  await page.getByRole("button", { name: "Upgrade to Pro" }).click();
  await page.getByRole("dialog", { name: "Give every idea room to become real." }).waitFor({ state: "visible" });
  const pricingMobile = await page.evaluate(() => {
    const dialog = document.querySelector(".dash2-pricing-dialog");
    const rect = dialog?.getBoundingClientRect();
    return {
      cards: document.querySelectorAll(".dash2-pricing-card").length,
      fullyInViewport: Boolean(rect && rect.top >= 0 && rect.bottom <= window.innerHeight),
      dialogScrolls: Boolean(dialog && dialog.scrollHeight > dialog.clientHeight),
      sidebarClosed: document.querySelector(".dash2-sidebar")?.getAttribute("data-open") === "false",
    };
  });
  await page.screenshot({ path: path.join(artifactDir, "dashboard-pricing-mobile.png") });
  await page.getByRole("button", { name: "Close pricing" }).click();

  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  const settings = await page.evaluate(() => ({
    heading: document.querySelector(".dash2-page-header h1")?.textContent?.trim(),
    workspaceSections: Array.from(document.querySelectorAll(".dash2-settings-heading h2")).filter((heading) => heading.textContent?.trim() === "Workspace").length,
  }));

  const results = { dark, light, pricingDesktop, mobileNavigation, pricingMobile, settings, consoleErrors, pageErrors };
  await writeFile(path.join(artifactDir, "dashboard-qa-results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
