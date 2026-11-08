import { test, expect } from '@playwright/test';

test('E2E: orchestrator shows the candidate passing idle but blocked during a background update', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Release Confidence Lab' })).toBeVisible();
  await page.getByRole('button', { name: 'Run release comparison' }).click();
  await expect(page.getByRole('heading', { name: /Overall: BLOCK/ })).toBeVisible();

  const idleSection = page.locator('section[data-condition="idle"]');
  const updateSection = page.locator('section[data-condition="background-update"]');
  await expect(idleSection.getByRole('heading', { name: /PASS/ })).toBeVisible();
  await expect(updateSection.getByRole('heading', { name: /BLOCK/ })).toBeVisible();
  await expect(updateSection.getByRole('row', { name: /medianInputLatencyMs.*BLOCK/ })).toBeVisible();
  await expect(updateSection.getByRole('row', { name: /droppedMotionEvents.*BLOCK/ })).toBeVisible();

  await expect(page.getByText(/passes every gate with no update running/)).toBeVisible();
});
