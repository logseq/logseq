import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import postcss from 'postcss'

const stylesheet = new URL('../resources/css/lui-overlay.css', import.meta.url)

test('root stylesheet does not compound the shared application font size', async () => {
  const source = await readFile(new URL('../resources/css/lui-core.css', import.meta.url), 'utf8')
  const fontSizes = []
  postcss.parse(source).walkRules('#root', rule => {
    rule.walkDecls('font-size', declaration => fontSizes.push(declaration.value))
  })
  assert.deepEqual(fontSizes, [], 'The shared root applies relative page text sizes exactly once')
})

test('left sidebar groups are independent of the right sidebar scope', async () => {
  const source = await readFile(new URL('../resources/css/lui-core.css', import.meta.url), 'utf8')
  const root = postcss.parse(source)
  for (const selector of ['.sidebar-navigations', '.sidebar-content-group']) {
    const matches = []
    root.walkRules(selector, rule => matches.push(rule))
    assert.equal(matches.length, 1, `${selector} must have one semantic owner`)
    assert.equal(matches[0].parent.type, 'root', `${selector} must style the left sidebar`)
  }
  const rightOnly = []
  root.walkRules('.sidebar-item-list', rule => rightOnly.push(rule.parent.selector))
  assert.deepEqual(rightOnly, ['.cp__right-sidebar'], 'Right panel list spacing stays scoped')
})

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

test('a shared search clear action owns browser cancel chrome', async () => {
  const source = await readFile(stylesheet, 'utf8')
  const root = postcss.parse(source, { from: stylesheet.pathname })
  const owners = []
  root.walkRules(rule => {
    if (rule.selector !== '.ls-search-with-clear::-webkit-search-cancel-button') return
    owners.push(rule.nodes.some(node => node.type === 'decl'
      && node.prop === '-webkit-appearance' && node.value === 'none'))
  })
  assert.deepEqual(owners, [true], 'Only fields with a shared clear action suppress browser cancel chrome')
})

test('popup content consumes the positioner available-height contract directly', async () => {
  const root = postcss.parse(await readFile(stylesheet, 'utf8'))
  const caps = []
  root.walkRules(rule => {
    if (!rule.selectors.includes('.ui__popover-content')) return
    rule.walkDecls('max-height', declaration => caps.push(declaration.value))
  })
  assert.deepEqual(caps, ['var(--lui-popup-available-height, none)'],
    'A variable resolved on an ancestor cannot see the content node available height')
})

const themeSources = [
  'theme/radix.css', 'theme/vars-classic.css', 'theme/colors.css',
  'theme/index.css', 'shui.css',
]

test('every referenced Radix color and channel has a definition in both modes', async () => {
  const config = (await import('../postcss.config.js')).default
  const sources = await Promise.all(themeSources.map(async name => ({
    name, source: await readFile(new URL(`../resources/css/${name}`, import.meta.url), 'utf8'),
  })))
  const radix = await postcss(config.plugins.filter(plugin => plugin.postcssPlugin !== '@tailwindcss/postcss'))
    .process(sources[0].source, { from: undefined })
  const referenced = new Set()
  for (const { source } of sources) {
    for (const match of source.matchAll(/var\((--rx-[a-z]+-\d+(?:-hsl|-alpha)?)\b/g)) referenced.add(match[1])
  }
  assert.ok(referenced.size > 0)
  for (const mode of ['light', 'dark']) {
    const defined = new Map()
    radix.root.walkRules(rule => {
      if (rule.selector === ':root' || mode === 'dark' && rule.selector.includes('data-theme=dark')) {
        rule.walkDecls(declaration => defined.set(declaration.prop, declaration.value))
      }
    })
    for (const name of referenced) assert.ok(defined.has(name), `${mode}: missing ${name}`)
    assert.equal(defined.get('--rx-gray-12-hsl'), mode === 'light' ? '0 0% 9.0%' : '0 0% 93.0%')
    assert.equal(defined.get('--rx-yellow-10-hsl'), mode === 'light' ? '50 100% 48.5%' : '54 100% 68.0%')
  }
})


test('legacy form styling is opt-in and leaves shared controls in their component layer', async () => {
  const config = (await import('../postcss.config.js')).default
  const source = `@import "tailwindcss" source(none);
@import "./resources/css/shui.css";
@import "./resources/css/lui.css";
@source inline("form-checkbox form-input form-select");
@config "./tailwind.config.js";`
  const result = await postcss(config.plugins.filter(plugin => plugin.postcssPlugin !== 'cssnano'))
    .process(source, { from: new URL('../choice-style-test.css', import.meta.url).pathname })
  const bareControls = []
  const formClasses = new Set()
  const borderResetLayers = []
  result.root.walkRules(rule => {
    if (/input:where\(\[type=["'](?:checkbox|radio)/.test(rule.selector)) bareControls.push(rule.selector)
    for (const selector of rule.selectors) {
      if (['.form-checkbox', '.form-input', '.form-select'].includes(selector)) formClasses.add(selector)
    }
    if (rule.selector === 'html *' && rule.nodes.some(node => node.prop === 'border-color')) {
      let owner = rule.parent
      while (owner && !(owner.type === 'atrule' && owner.name === 'layer')) owner = owner.parent
      borderResetLayers.push(owner?.params)
    }
  })
  assert.deepEqual(bareControls, [], 'Legacy input selectors must not override component chrome')
  assert.deepEqual([...formClasses].sort(), ['.form-checkbox', '.form-input', '.form-select'])
  assert.deepEqual(borderResetLayers, ['base'], 'Generic border defaults must yield to component colors')
})

test('body leaves application colors to the shared root', async () => {
  const source = await readFile(new URL('../resources/css/lui-core.css', import.meta.url), 'utf8')
  const colors = []
  postcss.parse(source).walkRules('body', rule => {
    rule.walkDecls(declaration => {
      if (['color', 'background-color'].includes(declaration.prop)) colors.push(declaration.value)
    })
  })
  assert.deepEqual(colors, [], 'Portaled content must inherit logical shared foregrounds')
})

test('application font family has one shared typed owner', async () => {
  const source = await readFile(new URL('../resources/css/lui-core.css', import.meta.url), 'utf8')
  const duplicates = []
  postcss.parse(source).walkRules(rule => {
    if (rule.selectors.some(selector => ['html', 'html:not(.is-native-android)', 'body', '#root'].includes(selector))) {
      rule.walkDecls('font-family', declaration => duplicates.push(declaration.value))
    }
  })
  assert.deepEqual(duplicates, [], 'Ordinary and portaled content inherit the shared application font family')
})


test('leading toolbar geometry and visibility have no stylesheet implementation', async () => {
  const source = await readFile(new URL('../resources/css/lui-core.css', import.meta.url), 'utf8')
  const root = postcss.parse(source)
  const duplicateRules = []
  root.walkRules(rule => {
    if (rule.selector === '> .l' || rule.selector.includes('.head-l-btns')) {
      duplicateRules.push(rule.selector)
    }
  })
  assert.deepEqual(duplicateRules, [], 'Shared typed toolbar layout owns placement and visibility')
})
