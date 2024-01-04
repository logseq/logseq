import { expect } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'
import { test } from './fixtures'
import { randomString, createRandomPage, modKey } from './utils'


test('create page and blocks, save to disk', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // do editing
  await page.keyboard.type('first bullet')
  await block.enterNext()

  await block.waitForBlocks(2)

  await page.keyboard.type('second bullet')
  await block.enterNext()

  await page.keyboard.type('third bullet')
  expect(await block.indent()).toBe(true)
  await block.enterNext()

  await page.keyboard.type('continue editing')
  await page.keyboard.press('Shift+Enter')
  await page.keyboard.type('second line')

  await block.enterNext()
  expect(await block.unindent()).toBe(true)
  expect(await block.unindent()).toBe(false)
  await page.keyboard.type('test ok')
  await page.keyboard.press('Escape')

  await block.waitForBlocks(5)

  // active edit, and create next block
  await block.clickNext()
  await page.keyboard.type('test')
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Backspace', { delay: 100 })
  }

  await page.keyboard.press('Escape')
  await block.waitForBlocks(5)

  await page.waitForTimeout(2000) // wait for saving to disk
  const contentOnDisk = await fs.readFile(
    path.join(graphDir, `pages/${pageTitle}.md`),
    'utf8'
  )
  expect(contentOnDisk.trim()).toEqual(`
- first bullet
- second bullet
	- third bullet
	- continue editing
	  second line
- test ok`.trim())
})


test('delete and backspace', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('test')

  // backspace
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  expect(await page.inputValue('textarea >> nth=0')).toBe('te')

  // refill
  await block.enterNext()
  await block.mustType('test')
  await page.keyboard.press('ArrowLeft', { delay: 50 })
  await page.keyboard.press('ArrowLeft', { delay: 50 })

  // delete
  await page.keyboard.press('Delete', { delay: 50 })
  expect(await page.inputValue('textarea >> nth=0')).toBe('tet')
  await page.keyboard.press('Delete', { delay: 50 })
  expect(await page.inputValue('textarea >> nth=0')).toBe('te')
  await page.keyboard.press('Delete', { delay: 50 })
  expect(await page.inputValue('textarea >> nth=0')).toBe('te')

})


test('block selection', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('1')
  await block.enterNext()
  await block.mustFill('2')
  expect(await block.indent()).toBe(true)
  await block.enterNext()
  await block.mustFill('3')
  await block.enterNext()
  await block.mustFill('4')
  expect(await block.unindent()).toBe(true)
  await block.enterNext()
  await block.mustFill('5')
  expect(await block.indent()).toBe(true)
  await block.enterNext()
  await block.mustFill('6')
  await block.enterNext()
  await block.mustFill('7')
  expect(await block.unindent()).toBe(true)
  await block.enterNext()
  await block.mustFill('8')
  expect(await block.indent()).toBe(true)
  await block.enterNext()
  await block.mustFill('9')
  expect(await block.unindent()).toBe(true)

  // shift+up/down
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowUp')
  await block.waitForSelectedBlocks(1)
  let locator = page.locator('.ls-block >> nth=8')

  await page.keyboard.press('ArrowUp')
  await block.waitForSelectedBlocks(2)

  await page.keyboard.press('ArrowUp')
  await block.waitForSelectedBlocks(3)

  await page.keyboard.press('ArrowDown')
  await block.waitForSelectedBlocks(2)
  await page.keyboard.up('Shift')

  // mod+click select or deselect
  await page.keyboard.down(modKey)
  await page.click('.ls-block >> nth=7')
  await block.waitForSelectedBlocks(1)

  await page.click('.block-main-container >> nth=6')
  await block.waitForSelectedBlocks(2)

  // mod+shift+click
  await page.click('.ls-block >> nth=4')
  await block.waitForSelectedBlocks(3)

  await page.keyboard.down('Shift')
  await page.click('.ls-block >> nth=1')
  await block.waitForSelectedBlocks(6)

  await page.keyboard.up('Shift')
  await page.keyboard.up(modKey)
  await page.keyboard.press('Escape')

  // shift+click
  await page.keyboard.down('Shift')
  await page.click('.block-main-container >> nth=0')
  await page.click('.block-main-container >> nth=3')
  await block.waitForSelectedBlocks(4)
  await page.click('.ls-block >> nth=8')
  await block.waitForSelectedBlocks(9)
  await page.click('.ls-block >> nth=5')
  await block.waitForSelectedBlocks(6)
  await page.keyboard.up('Shift')
})

test('template', async ({ page, block }) => {
  const randomTemplate = randomString(6)

  await createRandomPage(page)

  await block.mustFill('template test\ntemplate:: ')
  await page.keyboard.type(randomTemplate, { delay: 100 })
  await page.keyboard.press('Enter')
  await block.clickNext()

  expect(await block.indent()).toBe(true)

  await block.mustFill('line1')
  await block.enterNext()
  await block.mustFill('line2')
  await block.enterNext()

  expect(await block.indent()).toBe(true)
  await block.mustFill('line3')
  await block.enterNext()

  expect(await block.unindent()).toBe(true)
  expect(await block.unindent()).toBe(true)
  expect(await block.unindent()).toBe(false) // already at the first level

  await block.waitForBlocks(5)

  // See-also: #9354
  await block.enterNext()
  await block.mustType('/template')

  await page.click('[title="Insert a created template here"]')
  // type to search template name
  await page.keyboard.type(randomTemplate.substring(0, 3), { delay: 100 })

  const popupMenuItem = page.locator('.absolute >> text=' + randomTemplate)
  await popupMenuItem.waitFor({ timeout: 2000 }) // wait for template search
  await popupMenuItem.click()

  await block.waitForBlocks(9)


  await block.clickNext()
  await block.mustType('/template')

  await page.click('[title="Insert a created template here"]')
  // type to search template name
  await page.keyboard.type(randomTemplate.substring(0, 3), { delay: 100 })

  await popupMenuItem.waitFor({ timeout: 2000 }) // wait for template search
  await popupMenuItem.click()

  await block.waitForBlocks(13) // 9 + 4
})

test('auto completion square brackets', async ({ page, block }) => {
  await createRandomPage(page)

  // In this test, `type` is unused instead of `fill`, to allow for auto-completion.

  // [[]]
  await block.mustType('This is a [', { toBe: 'This is a []' })
  await block.mustType('[', { toBe: 'This is a [[]]' })

  // wait for search popup
  await page.waitForSelector('text="Search for a page"')

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

test('auto completion and auto pair', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('Auto-completion test')
  await block.enterNext()

  // {{
  await block.mustType('type {{', { toBe: 'type {{}}' })
  await page.waitForTimeout(100);
  // ((
  await block.clickNext()

  await block.mustType('type (', { toBe: 'type ()' })
  await block.mustType('(', { toBe: 'type (())' })

  await block.escapeEditing() // escape any popup from `(())`

  // [[  #3251
  await block.clickNext()

  await block.mustType('type [', { toBe: 'type []' })
  await block.mustType('[', { toBe: 'type [[]]' })

  await block.escapeEditing() // escape any popup from `[[]]`

  // ``
  await block.clickNext()

  await block.mustType('type `', { toBe: 'type ``' })
  await block.mustType('code here', { toBe: 'type `code here`' })
})

test('invalid page props #3944', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('public:: true\nsize:: 65535')
  await page.press('textarea >> nth=0', 'Enter')
  // Force rendering property block
  await block.enterNext()
})

test('Scheduled date picker should point to the already specified Date #6985', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('testTask \n SCHEDULED: <2000-05-06 Sat>')
  await block.enterNext()
  await page.waitForTimeout(500)
  await block.escapeEditing()

  // Open date picker
  await page.click('a.opacity-80')
  await page.waitForTimeout(500)
  await expect(page.locator('text=May 2000')).toBeVisible()
  await expect(page.locator('td:has-text("6").active')).toBeVisible()

  // Close date picker
  await page.click('a.opacity-80')
  await page.waitForTimeout(500)
})

test('Opening a second datepicker should close the first one #7341', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('testTask \n SCHEDULED: <2000-05-06 Sat>')

  await block.enterNext();

  await block.mustFill('testTask \n SCHEDULED: <2000-06-07 Wed>')
  await block.enterNext();
  await page.click('#main-content-container')
  // Open date picker
  await page.waitForTimeout(500)
  await page.click('#main-content-container')
  await page.waitForTimeout(500)
  await page.click('a:has-text("2000-06-07 Wed").opacity-80')
  await page.waitForTimeout(50)
  await page.click('a:has-text("2000-05-06 Sat").opacity-80')
  await page.waitForTimeout(50)
  await expect(page.locator('text=May 2000')).toBeVisible()
  await expect(page.locator('td:has-text("6").active')).toBeVisible()
  await expect(page.locator('text=June 2000')).not.toBeVisible()
  await expect(page.locator('td:has-text("7").active')).not.toBeVisible()

  // Close date picker
  await page.click('a:has-text("2000-05-06 Sat").opacity-80')
})
