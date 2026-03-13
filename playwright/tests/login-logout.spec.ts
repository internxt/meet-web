import { test, expect } from '@playwright/test';
import { login, expectLoggedIn, logout } from '../helpers/auth';

const email = process.env.PLAYWRIGHT_ULTIMATE_EMAIL!;
const password = process.env.PLAYWRIGHT_ULTIMATE_PASSWORD!;

test.beforeAll(() => {
  expect(email).toBeTruthy();
  expect(password).toBeTruthy();
});

test('User can log in', async ({ page }) => {

  await test.step('GIVEN user logs in via Internxt', async () => {
    await login(page, email, password);
  });

  await test.step('THEN user is authenticated', async () => {
    await expectLoggedIn(page, email);
  });

});


test('User can log out', async ({ page }) => {

  await test.step('GIVEN user is logged in', async () => {
    await login(page, email, password);
  });

  await test.step('WHEN user logs out', async () => {
    await logout(page);
  });

  await test.step('THEN user is logged out', async () => {
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  });

});