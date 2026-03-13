import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { MeetHomePage } from '../pages/meet-home-page';

const ultimateEmail = process.env.PLAYWRIGHT_ULTIMATE_EMAIL!;
const ultimatePassword = process.env.PLAYWRIGHT_ULTIMATE_PASSWORD!;

const freeEmail = process.env.PLAYWRIGHT_FREE_EMAIL!;
const freePassword = process.env.PLAYWRIGHT_FREE_PASSWORD!;

test.beforeAll(() => {
  expect(ultimateEmail).toBeTruthy();
  expect(ultimatePassword).toBeTruthy();
  expect(freeEmail).toBeTruthy();
  expect(freePassword).toBeTruthy();
});

test('Ultimate user sees Create meeting button', async ({ page }) => {
  const meetHome = new MeetHomePage(page);

  await test.step('GIVEN an Ultimate user is authenticated', async () => {
    await login(page, ultimateEmail, ultimatePassword);
  });

  await test.step('WHEN user is on the Meet main page', async () => {
    await meetHome.expectUserLoggedIn();
  });

  await test.step('THEN Create meeting button is visible', async () => {
    await meetHome.expectNewMeetingVisible();
  });
});

test('Free user does not see Create meeting button and sees Upgrade button', async ({ page }) => {
  const meetHome = new MeetHomePage(page);

  await test.step('GIVEN a Free user is authenticated', async () => {
    await login(page, freeEmail, freePassword);
  });

  await test.step('WHEN user is on the Meet main page', async () => {
    await meetHome.expectUserLoggedIn();
  });

  await test.step('THEN New meeting button is not visible', async () => {
    await meetHome.expectNewMeetingNotVisible();
  });

  await test.step('AND Upgrade button is visible', async () => {
    await meetHome.expectUpgradeVisible();
  });
});