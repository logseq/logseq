import { expect } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'
import { test } from './fixtures'
import { randomString, createRandomPage, newBlock, enterNextBlock } from './utils'

test('render app', async ({ page }) => {
  // NOTE: part of app startup tests is moved to `fixtures.ts`.
  await page.waitForFunction('window.document.title != "Loading"')

  expect(await page.title()).toMatch(/^Logseq.*?/)
})

test('toggle sidebar', async ({ page }) => {
  let sidebar = page.locator('#left-sidebar')

  // Left sidebar is toggled by `is-open` class
  if (/is-open/.test(await sidebar.getAttribute('class'))) {
    await page.click('#left-menu.button')
    await expect(sidebar).not.toHaveClass(/is-open/)
  } else {
    await page.click('#left-menu.button')
    await page.waitForTimeout(10)
    await expect(sidebar).toHaveClass(/is-open/)
    await page.click('#left-menu.button')
    await page.waitForTimeout(10)
    await expect(sidebar).not.toHaveClass(/is-open/)
  }

  await page.click('#left-menu.button')

  await page.waitForTimeout(10)
  await expect(sidebar).toHaveClass(/is-open/)
  await page.waitForSelector('#left-sidebar .left-sidebar-inner', { state: 'visible' })
  await page.waitForSelector('#left-sidebar a:has-text("New page")', { state: 'visible' })
})

test('search', async ({ page }) => {
  await page.click('#search-button')
  await page.waitForSelector('[placeholder="Search or create page"]')
  await page.fill('[placeholder="Search or create page"]', 'welcome')

  await page.waitForTimeout(500)
  const results = await page.$$('#ui__ac-inner .block')
  expect(results.length).toBeGreaterThanOrEqual(1)
})

test('create page and blocks, save to disk', async ({ page, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // do editing
  await page.fill('textarea >> nth=0', 'this is my first bullet')
  await enterNextBlock(page)

  // wait first block
  await page.waitForSelector('.ls-block >> nth=0')

  await page.fill('textarea >> nth=0', 'this is my second bullet')
  await enterNextBlock(page)

  await page.fill('textarea >> nth=0', 'this is my third bullet')
  await page.press('textarea >> nth=0', 'Tab')
  await enterNextBlock(page)

  await page.keyboard.type('continue editing test')
  await page.keyboard.press('Shift+Enter')
  await page.keyboard.type('continue')

  await enterNextBlock(page)
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.type('test ok')
  await page.keyboard.press('Escape')

  // NOTE: nth= counts from 0, so here're 5 blocks
  await page.waitForSelector('.ls-block >> nth=4')

  // active edit
  await page.click('.ls-block >> nth=-1')
  await enterNextBlock(page)
  await page.fill('textarea >> nth=0', 'test')
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Backspace')
  }

  await page.keyboard.press('Escape')
  await page.waitForSelector('.ls-block >> nth=4') // 5 blocks

  await page.waitForTimeout(2000) // wait for saving to disk

  const contentOnDisk = await fs.readFile(
    path.join(graphDir, `pages/${pageTitle}.md`),
    'utf8'
  )

  expect(contentOnDisk.trim()).toEqual(`
- this is my first bullet
- this is my second bullet
	- this is my third bullet
	- continue editing test
	  continue
- test ok`.trim())
})


test('delete and backspace', async ({ page }) => {
  await createRandomPage(page)

  await page.fill('textarea >> nth=0', 'test')
  expect(await page.inputValue('textarea >> nth=0')).toBe('test')

  // backspace
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  expect(await page.inputValue('textarea >> nth=0')).toBe('te')

  // refill
  await enterNextBlock(page)
  await page.type('textarea >> nth=0', 'test')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')

  // delete
  await page.keyboard.press('Delete')
  expect(await page.inputValue('textarea >> nth=0')).toBe('tet')
  await page.keyboard.press('Delete')
  expect(await page.inputValue('textarea >> nth=0')).toBe('te')
  await page.keyboard.press('Delete')
  expect(await page.inputValue('textarea >> nth=0')).toBe('te')

  // TODO: test delete & backspace across blocks
})


test('selection', async ({ page }) => {
  await createRandomPage(page)

  // add 5 blocks
  await page.fill('textarea >> nth=0', 'line 1')
  await enterNextBlock(page)
  await page.fill('textarea >> nth=0', 'line 2')
  await enterNextBlock(page)
  await page.press('textarea >> nth=0', 'Tab')
  await page.fill('textarea >> nth=0', 'line 3')
  await enterNextBlock(page)
  await page.fill('textarea >> nth=0', 'line 4')
  await page.press('textarea >> nth=0', 'Tab')
  await enterNextBlock(page)
  await page.fill('textarea >> nth=0', 'line 5')

  // shift+up select 3 blocks
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.up('Shift')

  await page.waitForSelector('.ls-block.selected >> nth=2') // 3 selected
  await page.keyboard.press('Backspace')

  await page.waitForSelector('.ls-block >> nth=1') // 2 blocks
})

test('template', async ({ page }) => {
  const randomTemplate = randomString(10)

  await createRandomPage(page)

  await page.fill('textarea >> nth=0', 'template')
  await page.press('textarea >> nth=0', 'Shift+Enter')
  await page.type('textarea >> nth=0', 'template:: ' + randomTemplate)

  // Enter twice to exit from property block
  await page.press('textarea >> nth=0', 'Enter')
  await enterNextBlock(page)

  await page.press('textarea >> nth=0', 'Tab')
  await page.fill('textarea >> nth=0', 'line1')
  await enterNextBlock(page)
  await page.fill('textarea >> nth=0', 'line2')
  await enterNextBlock(page)
  await page.press('textarea >> nth=0', 'Tab')
  await page.fill('textarea >> nth=0', 'line3')

  await enterNextBlock(page)
  await page.press('textarea >> nth=0', 'Shift+Tab')
  await page.press('textarea >> nth=0', 'Shift+Tab')
  await page.press('textarea >> nth=0', 'Shift+Tab')

  await page.waitForSelector('.ls-block >> nth=3') // total 4 blocks

  // NOTE: use delay to type slower, to trigger auto-completion UI.
  await page.type('textarea >> nth=0', '/template', { delay: 100 })

  await page.click('[title="Insert a created template here"]')
  // type to search template name
  await page.keyboard.type(randomTemplate.substring(0, 3), { delay: 100 })
  await page.waitForTimeout(500) // wait for template search
  await page.click('.absolute >> text=' + randomTemplate)


  await page.waitForSelector('.ls-block >> nth=7') // 8 blocks
})

test('auto completion square brackets', async ({ page }) => {
  await createRandomPage(page)

  // [[]]
  await page.type('textarea >> nth=0', 'This is a [')
  await page.inputValue('textarea >> nth=0').then(text => {
    expect(text).toBe('This is a []')
  })
  await page.waitForTimeout(100)
  await page.type('textarea >> nth=0', '[')
  // wait for search popup
  await page.waitForSelector('text="Search for a page"')

  expect(await page.inputValue('textarea >> nth=0')).toBe('This is a [[]]')

  // re-enter edit mode
  await page.press('textarea >> nth=0', 'Escape')
  await page.click('.ls-block >> nth=-1')
  await page.waitForSelector('textarea >> nth=0', { state: 'visible' })

  // #3253
  await page.press('textarea >> nth=0', 'ArrowLeft')
  await page.press('textarea >> nth=0', 'ArrowLeft')
  await page.press('textarea >> nth=0', 'Enter')
  await page.waitForSelector('text="Search for a page"', { state: 'visible' })

  // type more `]`s
  await page.type('textarea >> nth=0', ']')
  expect(await page.inputValue('textarea >> nth=0')).toBe('This is a [[]]')
  await page.type('textarea >> nth=0', ']')
  expect(await page.inputValue('textarea >> nth=0')).toBe('This is a [[]]')
  await page.type('textarea >> nth=0', ']')
  expect(await page.inputValue('textarea >> nth=0')).toBe('This is a [[]]]')
})

test('auto completion and auto pair', async ({ page }) => {
  await createRandomPage(page)

  await page.fill('textarea >> nth=0', 'Auto-completion test')
  await enterNextBlock(page)

  // {{
  await page.type('textarea >> nth=0', 'type {{')
  expect(await page.inputValue('textarea >> nth=0')).toBe('type {{}}')

  // ((
  await newBlock(page)

  await page.type('textarea >> nth=0', 'type (')
  expect(await page.inputValue('textarea >> nth=0')).toBe('type ()')
  await page.type('textarea >> nth=0', '(')
  expect(await page.inputValue('textarea >> nth=0')).toBe('type (())')

  // 99  #3444
  // TODO: Test under different keyboard layout when Playwright supports it
  // await newBlock(page)

  // await page.type('textarea >> nth=0', 'type 9')
  // expect(await page.inputValue('textarea >> nth=0')).toBe('type 9')
  // await page.type('textarea >> nth=0', '9')
  // expect(await page.inputValue('textarea >> nth=0')).toBe('type 99')

  // [[  #3251
  await newBlock(page)

  await page.type('textarea >> nth=0', 'type [')
  expect(await page.inputValue('textarea >> nth=0')).toBe('type []')
  await page.type('textarea >> nth=0', '[')
  expect(await page.inputValue('textarea >> nth=0')).toBe('type [[]]')

  // ``
  await newBlock(page)

  await page.type('textarea >> nth=0', 'type `')
  expect(await page.inputValue('textarea >> nth=0')).toBe('type ``')
  await page.type('textarea >> nth=0', 'code here')

  expect(await page.inputValue('textarea >> nth=0')).toBe('type `code here`')
})

test('invalid page props #3944', async ({ page }) => {
  await createRandomPage(page)

  await page.fill('textarea >> nth=0', 'public:: true\nsize:: 65535')
  await page.press('textarea >> nth=0', 'Enter')
  await enterNextBlock(page)
})
