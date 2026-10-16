import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import postcss from 'postcss'

const stylesheet = new URL('../resources/css/lui-overlay.css', import.meta.url)

test('dialog surface declarations do not apply to dropdown menu items or slots', async () => {
  const source = await readFile(stylesheet, 'utf8')
  const root = postcss.parse(source, { from: stylesheet.pathname })
  const leakedSelectors = []
  root.walkRules(rule => {
    if (!rule.selectors.some(selector => selector.trim() === '.lui-dialog')) return
    for (const selector of rule.selectors) {
      if (selector.includes('.lui-menu-item')) {
        leakedSelectors.push(selector)
      }
    }
  })
  assert.deepEqual(leakedSelectors, [], 'Menu geometry must not inherit dialog chrome')
})

test('selector groups do not absorb a following section', async () => {
  const source = await readFile(stylesheet, 'utf8')
  const root = postcss.parse(source, { from: stylesheet.pathname })
  const mixedSections = []
  root.walkRules(rule => {
    const rawSelector = rule.raws.selector?.raw ?? rule.selector
    if (rawSelector.includes('/*')) mixedSections.push(rule.selectors)
  })
  assert.deepEqual(mixedSections, [], 'Remove obsolete selectors with their migrated declarations')
})
