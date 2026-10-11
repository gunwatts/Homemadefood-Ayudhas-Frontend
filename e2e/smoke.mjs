// End-to-end smoke test of the whole journey: browse -> order list -> Place Order ->
// callback request -> admin inbox/status/content/visibility -> live refresh on the public site.
//
// Prerequisites (see the README's "End-to-end test" section): API running with the sample catalogue and an admin user,
// static site built against that API and served on SITE.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SITE = process.env.E2E_SITE || "http://127.0.0.1:3000";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@localhost.test";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "Local-Dev-Pass-2026";
const CHANNEL = process.env.E2E_BROWSER_CHANNEL || "msedge"; // or "chrome"
const SHOTS = fileURLToPath(new URL("./shots/", import.meta.url));
mkdirSync(SHOTS, { recursive: true });
const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
};

const browser = await chromium.launch({ channel: CHANNEL, headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

// --- Home
await page.goto(`${SITE}/`, { waitUntil: "networkidle" });
check("home renders hero", (await page.locator("h1").first().innerText()).length > 10);
check("home shows product cards", (await page.locator('a[href*="/products/"]:has(h3)').count()) >= 3);
check("preview notice visible", await page.getByText("sample content awaiting").isVisible());
await page.screenshot({ path: SHOTS + "01-home-mobile.png", fullPage: true });

// --- Products listing + filter
await page.goto(`${SITE}/products/`, { waitUntil: "networkidle" });
const allCount = await page.locator("a:has(h3)").count();
await page.getByRole("button", { name: "Sweets", exact: true }).click();
await page.waitForTimeout(300);
const sweetsCount = await page.locator("a:has(h3)").count();
check("category filter narrows list", sweetsCount > 0 && sweetsCount < allCount, `${allCount} -> ${sweetsCount}`);

// --- Product detail: add 2 x 500 g
await page.goto(`${SITE}/products/avakaya-mango-pickle/`, { waitUntil: "networkidle" });
check("product price shown", await page.getByText("product price only").isVisible());
await page.locator("label", { hasText: "500 g" }).click();
await page.getByRole("button", { name: "Increase quantity" }).click();
await page.getByRole("button", { name: "Add to order list" }).click();
check("added confirmation", await page.getByText("Added to your order list").isVisible());
await page.screenshot({ path: SHOTS + "02-product-mobile.png", fullPage: true });
const badge = await page.locator('a[href$="/order/"] span.absolute').innerText();
check("header badge shows 2", badge.trim() === "2", badge);

// Add one sweet too
await page.goto(`${SITE}/products/sunnundalu/`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Add to order list" }).click();

// --- Order page: validation, then submit
await page.goto(`${SITE}/order/`, { waitUntil: "networkidle" });
check("order list has 2 lines", (await page.locator("#order-items > li").count()) === 2);
await page.getByRole("button", { name: "Place Order" }).click();
check("client validation shows phone error", await page.getByText("valid 10-digit Indian mobile number").isVisible().catch(() => false) || await page.getByText("Please enter your WhatsApp/mobile number.").isVisible());
await page.fill("#order-whatsapp_number", "98765 43210");
await page.fill("#order-delivery_pincode", "534201");
await page.locator('input[value="delhivery"]').check();
await page.fill("#order-note", "Before Diwali please");
await page.locator("#order-privacy_acknowledged").check();
await page.screenshot({ path: SHOTS + "03-order-form-mobile.png", fullPage: true });
await page.getByRole("button", { name: "Place Order" }).click();
await page.getByText("Order request received!").first().waitFor({ timeout: 10000 });
const ref = (await page.locator("p.font-mono").innerText()).trim();
check("success shows reference", /^AYD-[A-Z0-9]{6}$/.test(ref), ref);
check("success has exact disclaimer", await page.getByText("This is not a final order confirmation.").isVisible());
const subtotalText = await page.locator("tfoot td").last().innerText();
check("server subtotal = 2×330 + 220", subtotalText.replace(/\s/g, "").includes("880"), subtotalText);
await page.screenshot({ path: SHOTS + "04-order-success-mobile.png", fullPage: true });

// Cart cleared
await page.goto(`${SITE}/order/`, { waitUntil: "networkidle" });
check("order list cleared after submit", await page.getByText("Your order list is empty").isVisible());

// --- Callback form on contact page
await page.goto(`${SITE}/contact/`, { waitUntil: "networkidle" });
await page.fill("#contact-phone", "+44 7700 900123");
await page.fill("#contact-message", "Do you ship to the UK?");
await page.locator("#contact-privacy").check();
await page.getByRole("button", { name: "Request a callback" }).click();
await page.getByText("Enquiry received", { exact: true }).waitFor({ timeout: 10000 });
check("callback request accepted", true);

// --- Admin (desktop)
const admin = await ctx.browser().newContext({ viewport: { width: 1366, height: 900 } });
const ap = await admin.newPage();
ap.on("pageerror", (e) => consoleErrors.push("admin: " + String(e)));
await ap.goto(`${SITE}/admin/`, { waitUntil: "networkidle" });
await ap.fill("#email", ADMIN_EMAIL);
await ap.fill("#password", "wrong-password");
await ap.getByRole("button", { name: "Sign in" }).click();
check("admin rejects bad password", await ap.getByText("Email or password is incorrect.").waitFor({ timeout: 5000 }).then(() => true).catch(() => false));
await ap.fill("#password", ADMIN_PASSWORD);
await ap.getByRole("button", { name: "Sign in" }).click();
await ap.getByRole("heading", { name: "Dashboard" }).waitFor({ timeout: 10000 });
check("admin dashboard loads", true);
await ap.screenshot({ path: SHOTS + "05-admin-dashboard.png", fullPage: true });

await ap.getByRole("button", { name: "Order requests" }).first().click();
await ap.getByText(ref).waitFor({ timeout: 10000 });
check("admin sees new order request", true);
const card = ap.locator("li.card", { hasText: ref });
check("admin card shows phone + PIN", (await card.innerText()).includes("+919876543210") && (await card.innerText()).includes("534201"));
await card.locator("select").selectOption("contacted");
await ap.getByText("Saved.").first().waitFor({ timeout: 5000 });
check("status update saved", (await card.locator("select").inputValue()) === "contacted");
await ap.screenshot({ path: SHOTS + "06-admin-orders.png", fullPage: true });

await ap.getByRole("button", { name: "Callback requests" }).click();
await ap.getByText("Do you ship to the UK?").first().waitFor({ timeout: 10000 });
check("admin sees callback request", true);

// Set WhatsApp number via site settings
await ap.getByRole("button", { name: "Site text & settings" }).click();
await ap.locator("#b-whatsapp_number").fill("919876500000");
const waSave = ap.locator(".card", { has: ap.locator("#b-whatsapp_number") }).getByRole("button", { name: "Save" });
if (await waSave.isEnabled()) {
  await waSave.click();
  await ap.getByText("Saved. Visitors").first().waitFor({ timeout: 5000 });
}
check("whatsapp number saved", true);

// Hide a product
await ap.getByRole("button", { name: "Products", exact: true }).click();
const row = ap.locator("li.card", { hasText: "Chekkalu" });
await row.locator('input[type="checkbox"]').evaluate((el) => el.click());
await ap.getByText("Product hidden from the site.").waitFor({ timeout: 5000 });
check("product hidden via toggle", true);
await ap.screenshot({ path: SHOTS + "07-admin-products.png", fullPage: true });

// Editor opens
await ap.locator("li.card", { hasText: "Avakaya" }).getByRole("button", { name: "Edit" }).click();
await ap.getByRole("dialog").waitFor();
await ap.screenshot({ path: SHOTS + "08-admin-product-editor.png" });
await ap.keyboard.press("Escape");

// --- Public site reflects admin changes (live refresh)
const p2 = await ctx.newPage();
await p2.goto(`${SITE}/products/chekkalu/`, { waitUntil: "networkidle" });
check("hidden product shows 'not listed' after live refresh", await p2.getByText("isn't listed right now").isVisible({ timeout: 5000 }).catch(() => false));
await p2.goto(`${SITE}/products/gongura-pickle/`, { waitUntil: "networkidle" });
const wa = p2.getByRole("link", { name: "Enquire on WhatsApp" });
check("WhatsApp button appears with prefilled link", (await wa.getAttribute("href"))?.startsWith("https://wa.me/919876500000?text=") ?? false);

// Restore product visibility
await row.locator('input[type="checkbox"]').evaluate((el) => el.click());
await ap.getByText("Product is now visible.").waitFor({ timeout: 5000 });

// Desktop public screenshots
const desk = await admin.newPage();
await desk.goto(`${SITE}/`, { waitUntil: "networkidle" });
await desk.screenshot({ path: SHOTS + "09-home-desktop.png", fullPage: true });
await desk.goto(`${SITE}/products/avakaya-mango-pickle/`, { waitUntil: "networkidle" });
await desk.screenshot({ path: SHOTS + "10-product-desktop.png", fullPage: true });

const realErrors = consoleErrors.filter((e) => !/favicon|i\.ytimg|401 \(Unauthorized\)|status of 401/.test(e));
check("no unexpected console errors", realErrors.length === 0, realErrors.slice(0, 5).join(" | "));

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
