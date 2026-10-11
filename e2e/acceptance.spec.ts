import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Each test runs in a fresh browser context: a fresh IndexedDB seeded with the public seed.

const ready = async (page: Page, path = '/') => {
  await page.goto(path)
  await expect(page.locator('.app')).toBeVisible()
}
const saved = async (page: Page) => {
  await expect(page.locator('.save')).toHaveText(/Saved|Stored locally/, { timeout: 5000 })
}

test('create and edit a note; it survives a reload', async ({ page }) => {
  await ready(page)
  await page.keyboard.press('Alt+n')
  await expect(page).toHaveURL(/\/r\/no_.+\?edit=1/)
  await page.getByLabel('Title', { exact: true }).fill('Entropy as counting')
  await page.getByLabel('Body').click()
  await page.getByLabel('Body').fill('Many microstates, one macrostate.')
  await page.keyboard.press('Escape')
  await expect(page.locator('.md--read')).toContainText('Many microstates')
  await saved(page)
  await page.reload()
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Entropy as counting')
  await expect(page.locator('.md--read')).toContainText('Many microstates, one macrostate.')
})

test('link two topics and see the relationship in the graph', async ({ page }) => {
  await ready(page, '/atlas')
  await page.getByRole('button', { name: 'New topic' }).click()
  await page.getByLabel('Title', { exact: true }).fill('Information theory')
  await page.getByLabel('Title', { exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Add connection' }).click()
  await page.getByLabel('Relationship').selectOption('depends_on')
  await page.getByLabel('Find a record').fill('Linear algebra')
  await page.locator('.picker-item', { hasText: 'Linear algebra' }).first().click()
  await expect(page.locator('.conn-group', { hasText: 'Depends on' })).toContainText('Linear algebra')
  const url = page.url()

  await page.goto('/graph')
  await page.getByRole('radio', { name: 'List' }).click()
  const row = page.locator('tr', { hasText: 'Information theory' }).first()
  await expect(row).toContainText('Depends on')
  await expect(row).toContainText('Linear algebra')
  await page.getByRole('radio', { name: 'Graph' }).click()
  await expect(page.locator('.graph-canvas canvas')).toBeVisible()

  // The relationship is also visible from the other end, as a backlink.
  await page.goto(url)
  await page.locator('.conn-item a', { hasText: 'Linear algebra' }).click()
  await expect(page.locator('.conn-group', { hasText: 'Prerequisite for' })).toContainText('Information theory')
})

test('search across stored content from the command palette', async ({ page }) => {
  await ready(page)
  await page.keyboard.press('Control+k')
  const box = page.getByRole('combobox', { name: 'Search and commands' })
  await box.fill('microstates')
  await expect(page.locator('.palette-item').first()).toContainText(/Statistical mechanics|Microstates/)
  // matches inside kind-specific fields, not just titles
  await box.fill('Robocraze')
  await expect(page.locator('.palette-item').first()).toContainText('First Arduino build')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/r\/pj_uno/)
})

test('create a project with a next action, complete a task, keep it after reload', async ({ page }) => {
  await ready(page, '/projects')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.getByLabel('Title', { exact: true }).fill('ESP32 weather station')
  await page.getByLabel('Title', { exact: true }).press('Enter')
  await page.getByLabel('Next action').fill('Order a BME280 sensor')
  await page.getByLabel('Next action').press('Enter')
  await page.getByLabel('Add a task').fill('Flash MicroPython')
  await page.getByLabel('Add a task').press('Enter')
  await page.getByLabel('Complete: Flash MicroPython').check()
  await saved(page)
  await page.reload()
  await expect(page.getByLabel('Next action')).toHaveValue('Order a BME280 sensor')
  await expect(page.getByLabel('Complete: Flash MicroPython')).toBeChecked()
})

test('navigate from a note to related notes through wikilinks and backlinks', async ({ page }) => {
  await ready(page, '/r/nt_models')
  await page.locator('.md a.wl', { hasText: 'Emergence' }).first().click()
  await expect(page).toHaveURL(/\/r\/tp_emergence/)
  await expect(page.locator('.conn-group', { hasText: 'Mentioned in' })).toContainText('A model is not the thing modelled')
  await page.locator('.conn-group', { hasText: 'Mentioned in' }).getByText('Microstates and macrostates').click()
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Microstates and macrostates')
})

test('capture an unstructured thought in seconds and file it from the inbox', async ({ page }) => {
  await ready(page)
  await page.keyboard.press('c')
  await page.getByLabel('Capture text').fill('Is attention just a soft lookup table?')
  await page.keyboard.press('Enter')
  await expect(page.locator('.toast')).toContainText('Captured to inbox')
  await page.goto('/inbox')
  const item = page.locator('.capture-item', { hasText: 'soft lookup table' })
  await expect(item.locator('.chip').first()).toHaveText(/question/i)
  await item.getByRole('button', { name: 'Question' }).click()
  await expect(page.locator('.capture-item', { hasText: 'soft lookup table' })).toHaveCount(0)
})

test('export data and import a valid backup', async ({ page }) => {
  await ready(page, '/settings')
  const dl = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const file = await dl
  const path = await file.path()
  const json = JSON.parse(readFileSync(path!, 'utf8'))
  expect(json.format).toBe('krish-atlas')
  expect(json.records.length).toBeGreaterThan(40)

  // Change something, then restore the backup by replacing everything.
  await page.goto('/r/pg_now')
  await page.getByLabel('Title', { exact: true }).fill('Changed after backup')
  await page.getByLabel('Title', { exact: true }).press('Enter')
  await saved(page)
  await page.goto('/settings')
  await page.getByLabel('Choose backup file').setInputFiles(path!)
  await expect(page.locator('.import-preview')).toContainText(`${json.records.length} records`)
  await page.getByRole('button', { name: 'Replace all data' }).click()
  await page.getByRole('button', { name: 'Replace all data' }).last().click()
  await expect(page.locator('.toast')).toContainText('Imported')
  await page.goto('/r/pg_now')
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Current priorities')

  // An invalid file is rejected without touching data.
  await page.goto('/settings')
  await page.getByLabel('Choose backup file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"nope":1}') })
  await expect(page.getByRole('alert')).toContainText('can’t be imported')
})

test('historical records are marked as historical', async ({ page }) => {
  await ready(page, '/r/pj_twoworlds')
  await expect(page.locator('.rec-chips')).toContainText('Historical')
  await expect(page.locator('.rec-chips')).toContainText('Imported')
  await page.goto('/r/pj_cogfn')
  await expect(page.locator('.rec-chips')).not.toContainText('Historical')
})

test('private records start private and the privacy screen hides them', async ({ page }) => {
  await ready(page, '/identity')
  await page.getByRole('button', { name: 'Observation' }).first().click()
  await page.getByLabel('Title', { exact: true }).fill('Focus is better before noon')
  await page.getByLabel('Title', { exact: true }).press('Enter')
  await expect(page.locator('.rec-chips')).toContainText('Private')
  await page.goto('/settings')
  await page.getByText(/Hide private records/).click()
  await page.goto('/index?q=noon')
  await expect(page.locator('table')).not.toContainText('Focus is better before noon')
  // Public export excludes it even with the screen off.
  await page.goto('/settings')
  await page.getByText(/Hide private records/).click()
  await page.getByText('Include private records in exports').click()
  const dl = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const json = JSON.parse(readFileSync((await (await dl).path())!, 'utf8'))
  expect(json.records.some((r: { title: string }) => r.title === 'Focus is better before noon')).toBe(false)
})

test('destructive operations ask for confirmation', async ({ page }) => {
  await ready(page, '/r/nt_breadth')
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('dialog')).toContainText('Delete “Breadth and depth”?')
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Breadth and depth')
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Delete permanently' }).click()
  await page.goto('/r/nt_breadth')
  await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible()
})

test('keyboard: g-shortcuts navigate, Escape closes overlays', async ({ page }) => {
  await ready(page)
  await page.keyboard.press('g')
  await page.keyboard.press('a')
  await expect(page).toHaveURL(/\/atlas$/)
  await page.keyboard.press('?')
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('the exhibition sub-site is still served', async ({ page }) => {
  const res = await page.goto('/functions/index.html')
  expect(res?.status()).toBe(200)
  await expect(page).toHaveTitle('The Cognitive Functions')
})
