import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const DEMO_PASSWORD = 'Demo@123';
const DONOR_EMAIL = 'demo.donor1@foodbridge.local';
const NGO_EMAIL = 'demo.ngo1@foodbridge.local';

const browserCandidates = [
    process.env.PLAYWRIGHT_BROWSER_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);

const findBrowserPath = () => browserCandidates.find((candidate) => fs.existsSync(candidate));

const checkpoints = [];

const recordPass = (name, detail = '') => {
    checkpoints.push({ name, status: 'PASS', detail });
    console.log(`PASS: ${name}${detail ? ` | ${detail}` : ''}`);
};

const recordFail = (name, error) => {
    const detail = error instanceof Error ? error.message : String(error);
    checkpoints.push({ name, status: 'FAIL', detail });
    console.error(`FAIL: ${name} | ${detail}`);
};

const runStep = async (name, fn) => {
    try {
        await fn();
        recordPass(name);
    } catch (error) {
        recordFail(name, error);
        throw error;
    }
};

const login = async (page, email, password, expectedHeading) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('Email Address').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('heading', { name: expectedHeading }).waitFor({ timeout: 20000 });
};

const waitForDonorClaimedCard = async (page, description) => {
    for (let attempt = 1; attempt <= 15; attempt += 1) {
        const refreshButton = page.getByRole('button', { name: 'Refresh Now' });
        if (await refreshButton.count()) {
            await refreshButton.click();
        }

        const claimedCard = page.locator('div.bg-white', { hasText: description }).first();

        if (await claimedCard.count()) {
            const qrButton = claimedCard.getByRole('button', { name: 'Show Handoff QR' });
            if (await qrButton.count()) {
                return claimedCard;
            }
        }

        await page.waitForTimeout(2000);
        await page.reload({ waitUntil: 'domcontentloaded' });
    }

    throw new Error('Donor listing did not expose Show Handoff QR in expected time window.');
};

const printSummary = () => {
    console.log('\n=== E2E CHECKPOINT SUMMARY ===');
    for (const checkpoint of checkpoints) {
        const detailSuffix = checkpoint.detail ? ` | ${checkpoint.detail}` : '';
        console.log(`${checkpoint.status} - ${checkpoint.name}${detailSuffix}`);
    }

    const failed = checkpoints.filter((checkpoint) => checkpoint.status === 'FAIL');
    console.log(`\nTotal: ${checkpoints.length}, Passed: ${checkpoints.length - failed.length}, Failed: ${failed.length}`);
};

const execute = async () => {
    const description = `E2E Donation ${Date.now()}`;
    const quantity = '11 boxes';

    const executablePath = findBrowserPath();
    if (!executablePath) {
        throw new Error('No local Chrome/Edge executable found for Playwright launch.');
    }

    console.log(`Using browser executable: ${executablePath}`);

    const browser = await chromium.launch({ headless: true, executablePath });
    const donorContext = await browser.newContext();
    const ngoContext = await browser.newContext();
    const donorPage = await donorContext.newPage();
    const ngoPage = await ngoContext.newPage();

    let backupPin = '';

    try {
        await runStep('Donor login', async () => {
            await login(donorPage, DONOR_EMAIL, DEMO_PASSWORD, 'My Donations');
        });

        await runStep('Donor creates new donation listing', async () => {
            await donorPage.getByRole('button', { name: '+ Log New Surplus' }).click();
            await donorPage.getByRole('heading', { name: 'Log Surplus Food' }).waitFor({ timeout: 10000 });
            await donorPage.getByPlaceholder('e.g., 20 loaves of bread').fill(description);
            await donorPage.getByPlaceholder('e.g., 10 kg').fill(quantity);
            await donorPage.getByRole('button', { name: 'Submit Listing' }).click();
            await donorPage.getByRole('heading', { name: 'My Donations' }).waitFor({ timeout: 15000 });
            await donorPage.getByText(description).first().waitFor({ timeout: 15000 });
        });

        await runStep('NGO login', async () => {
            await login(ngoPage, NGO_EMAIL, DEMO_PASSWORD, 'Available Donations');
        });

        await runStep('NGO claims donor listing', async () => {
            const availableCard = ngoPage.locator('div.bg-white', { hasText: description }).first();
            await availableCard.waitFor({ timeout: 20000 });
            await availableCard.getByRole('button', { name: 'Claim Food' }).click();

            const claimedCard = ngoPage.locator('div.border.border-teal-100', { hasText: description }).first();
            await claimedCard.waitFor({ timeout: 20000 });
            await claimedCard.getByRole('button', { name: 'Verify Handoff' }).waitFor({ timeout: 10000 });
        });

        await runStep('Donor opens handoff QR and captures backup PIN', async () => {
            const donorClaimedCard = await waitForDonorClaimedCard(donorPage, description);
            await donorClaimedCard.getByRole('button', { name: 'Show Handoff QR' }).click();
            await donorPage.getByRole('heading', { name: 'Secure Handoff QR' }).waitFor({ timeout: 15000 });

            const pinLine = donorPage.locator('p', { hasText: 'Backup PIN:' }).first();
            const pinText = await pinLine.textContent();
            const pinMatch = pinText?.match(/(\d{6})/);
            if (!pinMatch) {
                throw new Error('Could not extract 6-digit backup PIN from donor modal.');
            }
            backupPin = pinMatch[1];

            await donorPage.locator('button').filter({ hasText: '×' }).first().click();
        });

        await runStep('NGO verifies handoff using donor backup PIN', async () => {
            const claimedCard = ngoPage.locator('div.border.border-teal-100', { hasText: description }).first();
            await claimedCard.getByRole('button', { name: 'Verify Handoff' }).click();

            await ngoPage.getByRole('heading', { name: 'Verify Handoff' }).waitFor({ timeout: 10000 });
            await ngoPage.getByPlaceholder('Enter 6-digit PIN').fill(backupPin);
            await ngoPage.getByRole('button', { name: 'Verify Pickup' }).click();
            await ngoPage.getByText('Verified via PIN').waitFor({ timeout: 20000 });
            await ngoPage.getByText('Handoff verified and donation completed.').waitFor({ timeout: 20000 });
        });

        await runStep('Donor sees listing in Previous Transactions as COMPLETED', async () => {
            await donorPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
            await donorPage.getByRole('heading', { name: 'My Donations' }).waitFor({ timeout: 10000 });
            await donorPage.getByRole('button', { name: /Previous Transactions/ }).click();

            const completedCard = donorPage.locator('div.bg-white', { hasText: description }).first();
            await completedCard.waitFor({ timeout: 20000 });
            await completedCard.getByText('COMPLETED').waitFor({ timeout: 10000 });
        });
    } finally {
        await donorContext.close();
        await ngoContext.close();
        await browser.close();
    }
};

let exitCode = 0;
try {
    await execute();
} catch (error) {
    exitCode = 1;
} finally {
    printSummary();
    process.exit(exitCode);
}
