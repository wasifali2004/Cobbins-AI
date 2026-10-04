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

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
await page.addInitScript(() => {
  if (!localStorage.getItem("cobbins-theme")) localStorage.setItem("cobbins-theme", "dark");
});
const consoleErrors = [];
const pageErrors = [];
const failedResponses = [];
page.on("console", (message) => {
  if (message.type() === "error") {
    const location = message.location();
    consoleErrors.push(`${message.text()}${location.url ? ` @ ${location.url}` : ""}`);
  }
});
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
});

const results = {};

async function revealLandingSections(captureScreenshots = true) {
  for (const selector of ["#workflow", "#gallery", "#community", "#testimonials", "#faq", "#start"]) {
    if (selector === "#workflow") {
      await page.evaluate(() => {
        const section = document.querySelector("#workflow");
        if (section) window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
      });
    } else if (selector === "#gallery") {
      await page.evaluate(() => {
        const gallery = document.querySelector("#gallery");
        if (gallery) window.scrollTo({ top: gallery.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
      });
    } else {
      await page.locator(selector).scrollIntoViewIfNeeded();
    }
    await page.waitForTimeout(selector === "#workflow" ? 1300 : selector === "#gallery" ? 900 : 500);
    if (captureScreenshots && ["#workflow", "#gallery", "#testimonials", "#faq", "#start"].includes(selector)) {
      const fileName = {
        "#workflow": "tools-section.png",
        "#gallery": "gallery-section.png",
        "#testimonials": "testimonials-section.png",
        "#faq": "faq-section.png",
        "#start": "scroll-footer.png",
      }[selector];
      await page.screenshot({
        path: path.join(artifactDir, fileName),
      });
      if (selector === "#workflow") {
        await page.evaluate(() => {
          const howItWorks = document.querySelector(".cobbins-how-it-works");
          if (howItWorks) window.scrollTo({ top: howItWorks.getBoundingClientRect().top + window.scrollY - 20, behavior: "instant" });
        });
        await page.waitForTimeout(850);
        await page.screenshot({ path: path.join(artifactDir, "how-it-works.png") });
      }
    }
  }
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.waitForTimeout(250);
}

try {
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(artifactDir, "landing-hero-dark.png") });
  await page.evaluate(() => {
    const orbit = document.querySelector(".orbit-stage");
    if (orbit) window.scrollTo({ top: orbit.getBoundingClientRect().top + window.scrollY - 120, behavior: "instant" });
  });
  await page.waitForTimeout(1250);
  const orbitStart = await page.evaluate(() => Array.from(document.querySelectorAll(".orbit-node")).map((node) => {
    const rect = node.getBoundingClientRect();
    return [rect.x, rect.y];
  }));
  await page.waitForTimeout(1400);
  const orbitEnd = await page.evaluate(() => Array.from(document.querySelectorAll(".orbit-node")).map((node) => {
    const rect = node.getBoundingClientRect();
    return [rect.x, rect.y];
  }));
  results.motion = {
    orbitMoved: orbitStart.some(([x, y], index) => Math.hypot(x - orbitEnd[index][0], y - orbitEnd[index][1]) > 4),
    movingTools: orbitStart.length,
    orbitRings: await page.locator(".orbit-ring-static").count(),
    howItWorksCards: await page.locator(".cobbins-how-it-works .how-it-works-card-shell").count(),
    visualContinuity: await page.evaluate(() => ({
      toolsBackground: getComputedStyle(document.querySelector(".tools-section")).backgroundColor,
      howItWorksBackground: getComputedStyle(document.querySelector(".how-it-works-section")).backgroundColor,
      hubShadow: getComputedStyle(document.querySelector(".hub-node")).boxShadow,
      ringAnimation: getComputedStyle(document.querySelector(".orbit-ring-static")).animationName,
    })),
  };
  await page.locator("#gallery").scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  const galleryRotationStart = await page.locator(".cobbins-radial-gallery ul").evaluate((wheel) => getComputedStyle(wheel).transform);
  await page.evaluate(() => window.scrollBy({ top: 760, behavior: "instant" }));
  await page.waitForTimeout(650);
  const galleryRotationEnd = await page.locator(".cobbins-radial-gallery ul").evaluate((wheel) => getComputedStyle(wheel).transform);
  results.newGallery = await page.evaluate(({ start, end }) => ({
    heading: document.querySelector("#gallery-heading")?.textContent,
    cards: document.querySelectorAll(".cobbins-radial-gallery article").length,
    imagesLoaded: Array.from(document.querySelectorAll(".cobbins-radial-gallery img")).filter((image) => image.complete && image.naturalWidth > 0).length,
    rotatedOnScroll: start !== end,
    footerPlaceholderPresent: Array.from(document.querySelectorAll("#gallery h2")).some((heading) => heading.textContent?.trim() === "Footer"),
    sectionChrome: {
      borderWidth: getComputedStyle(document.querySelector(".gallery-bento-shell")).borderTopWidth,
      borderRadius: getComputedStyle(document.querySelector(".gallery-bento-shell")).borderRadius,
      background: getComputedStyle(document.querySelector(".gallery-bento-shell")).backgroundColor,
      pageBackground: getComputedStyle(document.querySelector(".gallery-section")).backgroundColor,
    },
  }), { start: galleryRotationStart, end: galleryRotationEnd });
  await revealLandingSections();
  const galleryBounds = await page.locator("#gallery").evaluate((element) => ({ top: element.offsetTop, height: element.offsetHeight }));
  await page.evaluate(({ top, height }) => window.scrollTo({ top: top + height - window.innerHeight + 220 }), galleryBounds);
  await page.waitForTimeout(650);
  results.galleryTransition = await page.evaluate(() => ({
    mapTop: document.querySelector("#community")?.getBoundingClientRect().top,
    galleryBottom: document.querySelector("#gallery")?.getBoundingClientRect().bottom,
  }));
  await page.screenshot({ path: path.join(artifactDir, "gallery-to-map.png") });
  await page.locator("#testimonials").scrollIntoViewIfNeeded();
  await page.waitForTimeout(650);
  results.testimonialMotion = await page.evaluate(() => ({
    columns: document.querySelectorAll(".testimonial-marquee").length,
    cardsPerTrack: Array.from(document.querySelectorAll(".testimonial-marquee")).map((column) => column.querySelector(".testimonial-marquee-track")?.children.length),
    heading: document.querySelector("#testimonials-heading")?.textContent,
    portraits: document.querySelectorAll(".three-d-testimonial-card .ui-avatar-image").length,
    loadedPortraits: Array.from(document.querySelectorAll(".three-d-testimonial-card .ui-avatar-image")).filter((image) => image.complete && image.naturalWidth > 0).length,
  }));
  await page.screenshot({ path: path.join(artifactDir, "testimonials-balanced.png") });
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.waitForTimeout(250);
  await page.locator("#faq").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Can I search by how a screen looks?" }).click();
  await page.waitForTimeout(250);
  results.faq = {
    expanded: await page.getByText("finds interfaces with similar composition", { exact: false }).isVisible(),
  };
  await page.screenshot({ path: path.join(artifactDir, "landing-dark.png"), fullPage: true });
  results.landing = await page.evaluate(() => ({
    title: document.title,
    theme: document.documentElement.dataset.theme,
    hero: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim(),
    sections: document.querySelectorAll("main section").length,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    logo: {
      lightAssetOpacity: getComputedStyle(document.querySelector(".logo-for-light")).opacity,
      darkAssetOpacity: getComputedStyle(document.querySelector(".logo-for-dark")).opacity,
    },
    buttonFill: getComputedStyle(document.querySelector(".origin-button-fill")).backgroundColor,
  }));

  await page.getByLabel("Primary navigation").getByRole("button", { name: "Switch to light theme" }).click();
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: "networkidle" });
  await revealLandingSections(false);
  results.themePersistence = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    savedTheme: localStorage.getItem("cobbins-theme"),
    logo: {
      lightAssetOpacity: getComputedStyle(document.querySelector(".logo-for-light")).opacity,
      darkAssetOpacity: getComputedStyle(document.querySelector(".logo-for-dark")).opacity,
    },
    buttonFill: getComputedStyle(document.querySelector(".origin-button-fill")).backgroundColor,
  }));
  await page.screenshot({ path: path.join(artifactDir, "landing-light.png"), fullPage: true });

  await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(artifactDir, "signup-light.png"), fullPage: true });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.waitForTimeout(350);
  results.authDarkTheme = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    lightAssetOpacity: getComputedStyle(document.querySelector(".logo-for-light")).opacity,
    darkAssetOpacity: getComputedStyle(document.querySelector(".logo-for-dark")).opacity,
  }));
  await page.screenshot({ path: path.join(artifactDir, "signup-dark.png"), fullPage: true });
  const email = `qa-${Date.now()}@cobbins.local`;
  const password = "Cobbins-QA-2026";
  await page.getByLabel("Full name").fill("Cobbins QA");
  await page.getByLabel("Work email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign up with email" }).click();
  await page.locator(".alert-toast").waitFor({ state: "visible", timeout: 10000 });
  results.signup = await page.locator(".alert-toast").innerText();
  await page.screenshot({ path: path.join(artifactDir, "signup-success.png"), fullPage: true });

  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.getByLabel("Work email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.locator(".alert-toast").waitFor({ state: "visible", timeout: 10000 });
  results.login = await page.locator(".alert-toast").innerText();

  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  results.dashboard = await page.evaluate(() => ({
    heading: document.querySelector(".dash2-welcome h1")?.textContent,
    screenCards: document.querySelectorAll(".dash2-screen-card").length,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  }));
  await page.screenshot({ path: path.join(artifactDir, "dashboard-dark.png"), fullPage: true });
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.waitForTimeout(350);
  results.dashboardLightTheme = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    lightAssetOpacity: getComputedStyle(document.querySelector(".logo-for-light")).opacity,
    darkAssetOpacity: getComputedStyle(document.querySelector(".logo-for-dark")).opacity,
  }));
  await page.screenshot({ path: path.join(artifactDir, "dashboard-light.png"), fullPage: true });
  await page.locator(".dash2-search").click();
  await page.locator(".command-dialog").waitFor({ state: "visible" });
  await page.getByPlaceholder("Search screens, products, patterns…").fill("billing");
  results.commandSearch = await page.locator(".command-results").innerText();
  await page.screenshot({ path: path.join(artifactDir, "dashboard-command.png") });
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(artifactDir, "landing-mobile-hero.png") });
  results.mobileInitialGeometry = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    blocks: ["#top", "#workflow", "#gallery", "#community", "#testimonials", "#faq", "#start"].map((selector) => {
      const element = document.querySelector(selector);
      return { selector, top: element?.getBoundingClientRect().top, height: element?.getBoundingClientRect().height };
    }),
  }));
  for (const selector of ["#gallery", "#testimonials", "#faq", "#start"]) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
  }
  results.mobile = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    viewport: [window.innerWidth, window.innerHeight],
  }));
  await page.screenshot({ path: path.join(artifactDir, "landing-mobile.png"), fullPage: true });

  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  results.mobileDashboard = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    menuVisible: getComputedStyle(document.querySelector(".dash2-menu")).display,
  }));
  await page.screenshot({ path: path.join(artifactDir, "dashboard-mobile.png"), fullPage: true });

  await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(artifactDir, "signup-mobile.png"), fullPage: true });

  results.consoleErrors = consoleErrors;
  results.pageErrors = pageErrors;
  results.failedResponses = failedResponses;
  await writeFile(path.join(artifactDir, "qa-results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
