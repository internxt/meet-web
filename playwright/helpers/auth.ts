import { expect, Page } from '@playwright/test';
import 'dotenv/config';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/');

  await page.getByRole('button', { name: 'Log in' }).click();

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Sign in with Internxt' }).click();
  const popup = await popupPromise;

  const emailField = popup.locator('[data-cy="emailInput"]');
  const passField = popup.locator('[data-cy="passwordInput"]');
  const submitLoginButton = popup.locator('[data-cy="loginButton"]');

  await expect(emailField).toBeVisible({ timeout: 15_000 });
  await emailField.fill(email);

  await expect(passField).toBeVisible({ timeout: 15_000 });
  await passField.fill(password);

  await expect(submitLoginButton).toBeVisible({ timeout: 15_000 });
  await submitLoginButton.click();

  await Promise.race([
    popup.waitForEvent('close').catch(() => {}),
    popup.waitForLoadState('networkidle').catch(() => {}),
  ]);

  if (!popup.isClosed()) {
    await popup.close().catch(() => {});
  }

  await expect(page.locator('button img.rounded-full').first()).toBeVisible({ timeout: 20_000 });
}

export async function expectLoggedIn(page: Page, email: string) {
  const avatarButton = page.locator('button img.rounded-full').first();

  await expect(avatarButton).toBeVisible({ timeout: 20_000 });
  await avatarButton.click();

  const userMenu = page.locator('div.flex.items-center.p-3');
  await expect(userMenu).toContainText(email);

  // close menu so next step starts from a clean state
  await avatarButton.click();
}

export async function logout(page: Page) {
  const avatarButton = page.locator('button img.rounded-full').first();
  const logoutButton = page.getByRole('button', { name: /log out|logout|sign out/i });

  await expect(avatarButton).toBeVisible({ timeout: 20_000 });
  await avatarButton.click();

  await expect(logoutButton).toBeVisible({ timeout: 10_000 });
  await logoutButton.click();
}