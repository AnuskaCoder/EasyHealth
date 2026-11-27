import { test, expect } from "@playwright/test";

const DESKTOP_VIEWPORTS = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1280x720", width: 1280, height: 720 },
];

const MOBILE_VIEWPORTS = [
  { name: "375x667", width: 375, height: 667 },
  { name: "390x844", width: 390, height: 844 },
  { name: "412x915", width: 412, height: 915 },
  { name: "430x932", width: 430, height: 932 },
];

const BASE_URL = "http://localhost:5173";

async function loginAsDemoPatient(page: any, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto(BASE_URL);
  await expect(page.locator("text=Welcome back")).toBeVisible({ timeout: 10000 });

  // Fill credentials directly
  await page.fill('input[type="email"]', "patient@demo.com");
  await page.fill('input[type="password"]', "demo1234");

  // Click Sign In
  await page.click('button[type="submit"]:has-text("Sign In")');

  // Wait for dashboard - "Welcome, Ananya!" should appear
  await expect(page.locator("text=Welcome, Ananya!")).toBeVisible({ timeout: 15000 });
}

test.describe("EasyHealth - Login Page (Desktop)", () => {
  for (const vp of DESKTOP_VIEWPORTS) {
    test(`Login page renders at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE_URL);
      await expect(page.locator("text=Welcome back")).toBeVisible({ timeout: 10000 });
      await expect(page.locator('button:has-text("Use Demo Account (patient)")')).toBeVisible({ timeout: 10000 });
    });
  }
});

test.describe("EasyHealth - Login Page (Mobile)", () => {
  for (const vp of MOBILE_VIEWPORTS) {
    test(`Login page renders at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE_URL);
      await expect(page.locator("text=Welcome back")).toBeVisible({ timeout: 10000 });
      await expect(page.locator('button:has-text("Use Demo Account (patient)")')).toBeVisible({ timeout: 10000 });
    });
  }
});

test.describe("EasyHealth - All Pages Load (Desktop)", () => {
  for (const vp of DESKTOP_VIEWPORTS) {
    test(`Demo login at ${vp.name}`, async ({ page }) => {
      await loginAsDemoPatient(page, vp.width, vp.height);
    });

    test(`Dashboard renders at ${vp.name}`, async ({ page }) => {
      await loginAsDemoPatient(page, vp.width, vp.height);
      await page.click("text=Home");
      await expect(page.locator("text=Welcome, Ananya!")).toBeVisible({ timeout: 10000 });
    });

    test(`Find Doctors page renders at ${vp.name}`, async ({ page }) => {
      await loginAsDemoPatient(page, vp.width, vp.height);
      await page.click("text=Find Doctors");
      await expect(page.locator('input[placeholder*="Search doctors"]')).toBeVisible({ timeout: 10000 });
    });

    test(`Pharmacy page renders at ${vp.name}`, async ({ page }) => {
      await loginAsDemoPatient(page, vp.width, vp.height);
      await page.click("text=Pharmacy");
      await expect(page.locator("text=Save Up To 50% On Medicines")).toBeVisible({ timeout: 10000 });
    });

    test(`Lab Tests page renders at ${vp.name}`, async ({ page }) => {
      await loginAsDemoPatient(page, vp.width, vp.height);
      await page.click("text=Lab Checkups");
      await expect(page.locator("text=Full Body Health Checkups")).toBeVisible({ timeout: 10000 });
    });

    test(`Medical Records page renders at ${vp.name}`, async ({ page }) => {
      await loginAsDemoPatient(page, vp.width, vp.height);
      await page.click("text=Medical Records");
      await expect(page.locator('h1:has-text("Medical Records")')).toBeVisible({ timeout: 10000 });
    });

    test(`Appointments page renders at ${vp.name}`, async ({ page }) => {
      await loginAsDemoPatient(page, vp.width, vp.height);
      await page.click("text=Appointments");
      await expect(page.locator("text=Care Schedule")).toBeVisible({ timeout: 10000 });
    });

    test(`Chatbot page renders at ${vp.name}`, async ({ page }) => {
      await loginAsDemoPatient(page, vp.width, vp.height);
      await page.click("text=AI Assistant");
      await expect(page.locator('h1:has-text("EasyHealth Clinical AI")')).toBeVisible({ timeout: 10000 });
    });

    test(`Medical Profile page renders at ${vp.name}`, async ({ page }) => {
      await loginAsDemoPatient(page, vp.width, vp.height);
      await page.click('button:has-text("Ananya")');
      await expect(page.locator('h1:has-text("Ananya Krishnan")')).toBeVisible({ timeout: 10000 });
    });

    test(`Blood Bank page renders at ${vp.name}`, async ({ page }) => {
      await loginAsDemoPatient(page, vp.width, vp.height);
      await page.click("text=Urgent Blood");
      await expect(page.locator('h1:has-text("Urgent Blood Requests")')).toBeVisible({ timeout: 10000 });
    });

    test(`Emergency page renders at ${vp.name}`, async ({ page }) => {
      await loginAsDemoPatient(page, vp.width, vp.height);
      await page.click("text=Emergency");
      await expect(page.locator("text=Emergency & Hospital Services")).toBeVisible({ timeout: 10000 });
    });
  }
});

test.describe("EasyHealth - All Pages Load (Mobile)", () => {
  for (const vp of MOBILE_VIEWPORTS) {
    test(`Demo login at ${vp.name}`, async ({ page }) => {
      await loginAsDemoPatient(page, vp.width, vp.height);
    });

    test(`Dashboard renders at ${vp.name}`, async ({ page }) => {
      await loginAsDemoPatient(page, vp.width, vp.height);
      await expect(page.locator("text=Welcome, Ananya!")).toBeVisible({ timeout: 10000 });
    });
  }
});

test.describe("EasyHealth - Functional Authentication", () => {
  test("Demo login as patient", async ({ page }) => {
    await loginAsDemoPatient(page, 1280, 720);
  });

  test("Navigation between pages works", async ({ page }) => {
    await loginAsDemoPatient(page, 1280, 720);
    await page.click("text=Find Doctors");
    await expect(page.locator('input[placeholder*="Search doctors"]')).toBeVisible({ timeout: 10000 });
    await page.click("text=Pharmacy");
    await expect(page.locator("text=Save Up To 50% On Medicines")).toBeVisible({ timeout: 10000 });
    await page.click("text=Lab Checkups");
    await expect(page.locator("text=Full Body Health Checkups")).toBeVisible({ timeout: 10000 });
  });

  test("AI chatbot responds to a query", async ({ page }) => {
    await loginAsDemoPatient(page, 1280, 720);
    await page.click("text=AI Assistant");
    await expect(page.locator('h1:has-text("EasyHealth Clinical AI")')).toBeVisible({ timeout: 10000 });
    await page.fill('input[placeholder*="Ask about"]', "hello");
    await page.click('button[type="submit"]');
    await expect(page.locator('.bg-blue-600.text-white:has-text("hello")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.bg-white.border.border-gray-200.rounded-tl-sm.text-gray-800')).toBeVisible({ timeout: 10000 });
  });

  test("Pharmacy cart add item", async ({ page }) => {
    await loginAsDemoPatient(page, 1280, 720);
    await page.click("text=Pharmacy");
    await expect(page.locator("text=Save Up To 50% On Medicines")).toBeVisible({ timeout: 10000 });
    const addBtn = page.locator("button:has-text('Add')").first();
    if ((await addBtn.count()) > 0) {
      await addBtn.click();
      await expect(page.locator("text=item added to cart")).toBeVisible({ timeout: 5000 });
    }
  });

  test("Blood bank post request form", async ({ page }) => {
    await loginAsDemoPatient(page, 1280, 720);
    await page.click("text=Urgent Blood");
    await expect(page.locator('h1:has-text("Urgent Blood Requests")')).toBeVisible({ timeout: 10000 });
    await page.click("text=Request Blood Urgently");
    await expect(page.locator("text=Post An Urgent Blood Request")).toBeVisible({ timeout: 10000 });
  });

  test("Medical records quick add", async ({ page }) => {
    await loginAsDemoPatient(page, 1280, 720);
    await page.locator('button:has-text("Medical Records")').first().click();
    await expect(page.locator('h1:has-text("Medical Records")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Quick Add")').first()).toBeVisible({ timeout: 10000 });
  });

  test("Lab tests booking modal opens", async ({ page }) => {
    await loginAsDemoPatient(page, 1280, 720);
    await page.click("text=Lab Checkups");
    await expect(page.locator("text=Full Body Health Checkups")).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("Book Home Pickup")').first().click();
    await expect(page.locator("text=Schedule Home Sample Collection")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("EasyHealth - Console Errors Check", () => {
  test("No critical console errors on login page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    const criticalErrors = errors.filter(e =>
      !e.includes("favicon") && !e.includes("404") && !e.includes("net::ERR") && !e.includes("fetch")
    );
    if (criticalErrors.length > 0) {
      console.log("Console errors found:", criticalErrors);
    }
    expect(criticalErrors.length).toBe(0);
  });
});
