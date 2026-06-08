import { expect, Page, Locator } from '@playwright/test';

export class MeetHomePage {
  readonly page: Page;
  readonly avatarButton: Locator;
  readonly newMeetingButton: Locator;
  readonly upgradeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // temporary selector until data-testid is added
    this.avatarButton = page.locator('button img.rounded-full').first();

    // temporary selector until data-testid is added
    this.newMeetingButton = page.getByRole('button', { name: /new meeting/i });

    // temporary selector until data-testid is added
    this.upgradeButton = page.getByRole('button', { name: 'Upgrade' }).nth(1);
  }

  async expectUserLoggedIn() {
    await expect(this.avatarButton).toBeVisible();
  }

  async expectNewMeetingVisible() {
    await expect(this.newMeetingButton).toBeVisible();
  }

  async expectNewMeetingNotVisible() {
    await expect(this.newMeetingButton).toHaveCount(0);
  }

  async expectUpgradeVisible() {
    await expect(this.upgradeButton).toBeVisible();
  }
}