import { expect, Locator } from '@playwright/test';

const DEBUG = process.env.DEBUG_TESTS === 'true';

function parseTimer(value: string): number {
  const [minutes, seconds] = value.split(':').map(Number);
  return minutes * 60 + seconds;
}

export async function expectTimerToIncrease(timer: Locator) {
  await expect(timer).toBeVisible();

  const firstText = (await timer.textContent())?.trim() ?? '';
  expect(firstText).toMatch(/^\d{1,2}:\d{2}$/);

  const firstSeconds = parseTimer(firstText);

  // wait until timer changes
  await expect(timer).not.toHaveText(firstText, { timeout: 5000 });

  const secondText = (await timer.textContent())?.trim() ?? '';
  expect(secondText).toMatch(/^\d{1,2}:\d{2}$/);

  const secondSeconds = parseTimer(secondText);

  expect(
    secondSeconds,
    `Timer should increase. First: ${firstText}, Second: ${secondText}`
  ).toBeGreaterThan(firstSeconds);
}

export async function expectTimerRunning(timer: Locator, checks = 3) {
  await expect(timer).toBeVisible();

  let previous = 0;

  for (let i = 0; i < checks; i++) {
    const value = (await timer.textContent())?.trim() ?? '';
    if (DEBUG) console.log(`Timer check ${i}:`, value);

    expect(value).toMatch(/^\d{1,2}:\d{2}$/);

    const seconds = parseTimer(value);

    if (i > 0) {
      expect(
        seconds,
        `Timer should keep running. Previous: ${previous}, Current: ${seconds}`
      ).toBeGreaterThanOrEqual(previous);
    }

    previous = seconds;

    await timer.page().waitForTimeout(1000);
  }
}