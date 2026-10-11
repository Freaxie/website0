import { expect, test } from '@playwright/test'

test('the main interface works on a phone', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.mobile-nav')).toBeVisible()
  await expect(page.locator('.sidebar')).not.toBeInViewport()
  // no horizontal scroll
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)

  await page.locator('.mobile-nav').getByText('Atlas').click()
  await expect(page).toHaveURL(/\/atlas$/)
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(page.locator('.sidebar')).toBeInViewport()
  await page.locator('.sidebar').getByText('Project Forge').click()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.locator('.sidebar')).not.toBeInViewport()

  await page.getByRole('button', { name: 'Quick capture' }).click()
  await page.getByLabel('Capture text').fill('Try a 10-minute morning walk')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.locator('.mobile-nav').getByText('Inbox').click()
  await expect(page.locator('.capture-item')).toContainText('10-minute morning walk')

  for (const path of ['/r/tp_ml', '/identity', '/learning', '/life', '/settings', '/graph']) {
    await page.goto(path)
    const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(o, `${path} scrolls horizontally`).toBeLessThanOrEqual(1)
  }
})
