import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = ['/', '/atlas', '/identity', '/learning', '/projects', '/life', '/library', '/timeline', '/review', '/inbox', '/index', '/settings', '/r/tp_ml', '/r/pj_atlas', '/r/ar_maker']

for (const theme of ['dark', 'paper'] as const) {
  test(`no serious accessibility violations (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('atlas:theme', JSON.stringify({ theme: t, accent: 'lime' })), theme)
    const problems: string[] = []
    for (const path of PAGES) {
      await page.goto(path)
      await page.locator('.app').waitFor()
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme)
      await page.waitForTimeout(250)
      const r = await new AxeBuilder({ page }).disableRules(['region']).analyze()
      for (const v of r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
        problems.push(`${path}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(' ')} — ${v.nodes[0]?.failureSummary?.split('\n')[1] ?? ''}`)
    }
    expect(problems, problems.join('\n')).toEqual([])
  })
}
