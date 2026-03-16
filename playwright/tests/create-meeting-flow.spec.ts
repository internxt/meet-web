import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { MeetHomePage } from '../pages/meet-home-page';
import { expectTimerToIncrease, expectTimerRunning } from '../helpers/timer';

const ultimateEmail = process.env.PLAYWRIGHT_ULTIMATE_EMAIL!;
const ultimatePassword = process.env.PLAYWRIGHT_ULTIMATE_PASSWORD!;
const ultimateName = process.env.PLAYWRIGHT_ULTIMATE_NAME!;
expect(ultimateName).toBeTruthy();


test.beforeAll(() => {
  expect(ultimateEmail).toBeTruthy();
  expect(ultimatePassword).toBeTruthy();
  expect(ultimateName).toBeTruthy();
});

test('Ultimate user can create a meeting', async ({ page }) => {
  const meetHome = new MeetHomePage(page);

  await test.step('GIVEN Ultimate user is authenticated', async () => {
    await login(page, ultimateEmail, ultimatePassword);
  });

  await test.step('WHEN user clicks New meeting', async () => {
    await meetHome.expectUserLoggedIn();
    await meetHome.expectNewMeetingVisible();
    await meetHome.newMeetingButton.click();
  });

  await test.step('THEN prejoin modal is displayed ', async () => {
await expect(page.getByText('Your meeting is private')).toBeVisible();
await expect(page.getByRole('textbox', { name: /enter your name/i })).toHaveValue(ultimateName);
await expect(page.getByText('Up to 5 participants')).toBeVisible();
  });

await test.step('WHEN user confirms meeting creation', async () => {
  // TODO: temporary workaround nth(1)— UI currently renders two "New Meeting" buttons. Should be one.
  const newMeetingButtons = page.getByRole('button', { name: 'New Meeting' });
  await expect(newMeetingButtons).toHaveCount(2);
  await newMeetingButtons.nth(1).click();
});

await test.step('THEN moderator message appears briefly', async () => {
  const moderatorToast = page.getByText(/you're now a moderator/i);

  await expect(moderatorToast).toBeVisible({ timeout: 5000 });
  await expect(moderatorToast).toBeHidden({ timeout: 5000 });
});

await test.step('AND meeting UI is visible', async () => {
  await expect(page).toHaveURL(/meet\.internxt\.com\/[0-9a-fA-F-]{36}/);
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gallery' })).toBeVisible();
});

await test.step('AND timer is visible', async () => {
  const timer = page.locator('text=/^\\d{1,2}:\\d{2}$/').first();
  await expect(timer).toBeVisible();

  await expectTimerToIncrease(timer);
  await expectTimerRunning(timer);
});

await test.step('AND meeting controls are visible', async () => {
  const defaultControls = page.locator('[data-circle-button="default"]');
  const leaveControl = page.locator('[data-circle-button="cancel"]');

  // TODO: temporary workaround until stable data-testid attributes are added
  await expect(defaultControls).toHaveCount(5);
  await expect(leaveControl).toHaveCount(1);
});
})
