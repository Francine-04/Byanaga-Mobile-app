const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || path.join(process.env.TEMP, 'byanaga-browser-check/node_modules/playwright'));

async function run() {
  const output = path.resolve('.artifacts/ui');
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1223/chrome-win64/chrome.exe') });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.setDefaultTimeout(20000);
  const button = (name) => page.getByRole('button', { name, exact: true });
  const textbox = (name) => page.getByRole('textbox', { name, exact: true });
  const tab = (name) => page.getByRole('tab', { name, exact: true });
  const shot = async (name) => {
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(output, `${name}.png`) });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name}: horizontal overflow`);
  };
  try {
    await page.goto(process.env.APP_URL || 'http://localhost:8090', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.getByText('Discover Naga City', { exact: true }).waitFor({ timeout: 90000 });
    await shot('onboarding-1');
    await button('Next').click();
    await page.getByText('Plan Every Journey', { exact: true }).waitFor();
    await shot('onboarding-2');
    await button('Next').click();
    await page.getByText('Travel Smarter', { exact: true }).waitFor();
    await shot('onboarding-3');
    await button('Login').click();
    await button('Forgot password').click();
    await shot('forgot-password');
    // No real reset emails or accounts are created by this smoke test.
    await textbox('Registered Gmail address').fill('not-an-email');
    await button('Continue').click();
    await page.getByRole('alert').filter({ hasText: 'Enter the Gmail address you registered with.' }).waitFor();
    await button('Back to Login').click();
    await button('Register').click();
    await button('Continue').click();
    await page.getByText('Please fill up all required fields correctly before continuing.', { exact: true }).waitFor();
    await textbox('First Name').fill('Test');
    await textbox('Last Name').fill('Traveler');
    await textbox('Age').fill('2a4');
    assert.equal(await textbox('Age').inputValue(), '24');
    await button('Select Gender').click();
    await page.getByRole('radio', { name: 'FEMALE', exact: true }).click();
    await button('Select Nationality').click();
    await page.getByRole('radio', { name: 'Filipino', exact: true }).click();
    await textbox('Gmail Address').fill('ui-check@gmail.com');
    await textbox('Password').fill('Strong1!');
    await textbox('Confirm Password').fill('Strong1!');
    assert.equal(await textbox('Password').getAttribute('type'), 'password');
    await button('Show password').click();
    assert.equal(await textbox('Password').evaluate((input) => input.type), 'text');
    await button('Hide password').click();
    await button('Continue').click();
    await page.getByText('Travel Preferences', { exact: true }).waitFor();
    assert.equal(await page.locator('[aria-pressed="true"]').count(), 0);
    await shot('registration-preferences');
    await page.reload();
    await page.getByText('Discover Naga City', { exact: true }).waitFor();
    await button('Skip').first().click();
    await button('Continue as Guest').click();
    await button('Menu').waitFor();
    await page.getByText('Tourist!', { exact: true }).waitFor();
    await button('Refresh Naga City weather').click();
    await shot('home-mobile');
    assert.equal(await page.getByText(/Open-Meteo|\d{4}-\d{2}-\d{2}.*PHT/).count(), 0, 'provider/timestamp should not appear on the weather card');
    await tab('Explore').click();
    await textbox('Search destinations').fill('no-matching-destination-123');
    await page.getByText('No results found', { exact: true }).waitFor();
    await button('Clear Filters').click();
    await tab('Heatmap').click();
    await page.locator('.mapboxgl-canvas').waitFor({ timeout: 30000 });
    await page.getByText('Loading live map...', { exact: true }).waitFor({ state: 'hidden', timeout: 30000 });
    await button('Zoom in').click();
    await shot('heatmap-mobile');
    assert.equal(await button('Retry map').count(), 0, 'Mapbox failed to load');
    await tab('Home').click();
    await button('Smart Itinerary').click();
    await button('Open travel date calendar').click();
    await shot('travel-date-picker');
    await button('Next year').click();
    await button('Select day 15').click();
    await button('Back').click();
    for (const viewport of [{ width: 320, height: 568 }, { width: 430, height: 932 }, { width: 1440, height: 1000 }]) {
      await page.setViewportSize(viewport);
      await button('Refresh Naga City weather').scrollIntoViewIfNeeded();
      await shot(`home-${viewport.width}`);
    }
    await tab('Trips').click();
    await button('Login').waitFor();
    await shot('guest-login-redirect');
    assert.deepEqual(errors, []);
    console.log('PASS web smoke: onboarding, registration validation, nationality/gender, password visibility, blank preferences, forgot-password validation, guest greeting/access, date picker, Mapbox and responsive layouts. No production writes.');
  } catch (error) {
    await shot('failure');
    console.log((await page.locator('body').ariaSnapshot()).slice(0, 6000));
    throw error;
  } finally {
    await browser.close();
  }
}
run().catch((error) => { console.error(error.message); process.exitCode = 1; });
