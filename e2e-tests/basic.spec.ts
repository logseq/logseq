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

  // delete & backspace across blocks
  await block.enterNext()
  await block.mustFill('test')
  await page.keyboard.press('ArrowUp', { delay: 50 })
  await page.keyboard.press('Delete', { delay: 50 })
  expect(await page.inputValue('textarea >> nth=0')).toBe('tetest')
  await block.enterNext()
  expect(await page.inputValue('textarea >> nth=0')).toBe('test')
  await page.keyboard.press('Backspace', { delay: 50 })
  expect(await page.inputValue('textarea >> nth=0')).toBe('tetest')

  // delete across blocks, the current block has no refs
  await block.clickNext()
  await block.mustFill('no ref')
  await block.enterNext()
  await block.mustType('has a ref')
  await page.keyboard.press(modKey + '+c')
  await page.waitForTimeout(100)
  await block.clickNext()
  await page.keyboard.press(modKey + '+v')
  await page.waitForTimeout(100)
  await page.keyboard.press('ArrowUp', { delay: 50 })
  await page.keyboard.press('ArrowUp', { delay: 50 })
  await page.keyboard.press('End')
  await page.waitForTimeout(100)
  await page.keyboard.press('Delete', { delay: 50 })
  await page.waitForTimeout(100)
  expect(await page.inputValue('textarea >> nth=0')).toBe('no refhas a ref')
  await expect(page.locator('.warning')).toHaveCount(0)

  // delete across blocks, the current block has refs and the next block has no refs
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowUp', { delay: 50 })
  await page.keyboard.press('End')
  await page.waitForTimeout(100)
  await page.keyboard.press('Delete', { delay: 50 })
  await page.waitForTimeout(100)
  expect(await page.inputValue('textarea >> nth=0')).toBe('no refhas a ref')
  await expect(page.locator('.warning')).toHaveCount(0)

  // delete across blocks, the current block and the next block both have refs
  await page.keyboard.press('Enter')
  await page.keyboard.press(modKey + '+c')
  await page.waitForTimeout(100)
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await page.keyboard.press(modKey + '+v')
  await page.waitForTimeout(100)
  await page.keyboard.press('ArrowUp', { delay: 50 })
  await page.keyboard.press('ArrowUp', { delay: 50 })
  await page.keyboard.press('End')
  await page.waitForTimeout(100)
  await page.keyboard.press('Delete', { delay: 50 })
  await page.waitForTimeout(100)
  expect(await page.inputValue('textarea >> nth=0')).not.toBe('no refhas a ref')
  expect(await page.inputValue('textarea >> nth=0')).toContain('no refhas a ref')
  await expect(page.locator('.warning')).toHaveCount(1)

  // backspace across blocks, the current block has refs and the prev block has no refs
  await page.keyboard.press(modKey + '+z')
  await page.waitForTimeout(100)
  await page.keyboard.press('Home')
  await page.waitForTimeout(100)
  await page.keyboard.press('Backspace', { delay: 50 })
  await page.waitForTimeout(100)
  expect(await page.inputValue('textarea >> nth=0')).toBe('tetestno ref')
  await expect(page.locator('.warning')).toHaveCount(0)

  // backspace across blocks, the current block has no refs
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await block.mustFill('no ref')
  await page.keyboard.press('Home')
  await page.waitForTimeout(100)
  await page.keyboard.press('Backspace', { delay: 50 })
  await page.waitForTimeout(100)
  expect(await page.inputValue('textarea >> nth=0')).toBe('tetestno refno ref')
  await expect(page.locator('.warning')).toHaveCount(0)

  // backspace across blocks, the current block and the prev block both have refs
  await page.keyboard.press('ArrowDown', { delay: 50 })
  await page.keyboard.press('Home')
  await page.waitForTimeout(100)
  await page.keyboard.press('Backspace', { delay: 50 })
  await page.waitForTimeout(100)
  expect(await page.inputValue('textarea >> nth=0')).toBe('tetestno refno refhas a ref')
  await expect(page.locator('.warning')).toHaveCount(1)
})


test('selection', async ({ page, block }) => {
  await createRandomPage(page)

  // add 5 blocks
  await block.mustFill('line 1')
  await block.enterNext()
  await block.mustFill('line 2')
  await block.enterNext()
  expect(await block.indent()).toBe(true)
  await block.mustFill('line 3')
  await block.enterNext()
  await block.mustFill('line 4')
  expect(await block.indent()).toBe(true)
  await block.enterNext()
  await block.mustFill('line 5')

  // shift+up select 3 blocks
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.up('Shift')

  await block.waitForSelectedBlocks(3)
  await page.keyboard.press('Backspace')

  await block.waitForBlocks(2)
})

test('template', async ({ page, block }) => {
  const randomTemplate = randomString(6)

  await createRandomPage(page)

  await block.mustFill('template test\ntemplate:: ')
  await page.keyboard.type(randomTemplate, {delay: 100})
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

  // NOTE: use delay to type slower, to trigger auto-completion UI.
  await block.clickNext()
  await block.mustType('/template')

  await page.click('[title="Insert a created template here"]')
  // type to search template name
  await page.keyboard.type(randomTemplate.substring(0, 3), { delay: 100 })

  const popupMenuItem = page.locator('.absolute >> text=' + randomTemplate)
  await popupMenuItem.waitFor({ timeout: 2000 }) // wait for template search
  await popupMenuItem.click()

  await block.waitForBlocks(9)
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

test('Scheduled date picker should point to the already specified Date #6985', async({page,block})=>{
  await createRandomPage(page)

  await block.mustFill('testTask \n SCHEDULED: <2000-05-06 Sat>')
  await block.enterNext()
  await page.waitForTimeout(500)
  await block.escapeEditing()

  // Open date picker
  await page.click('a.opacity-80')
  await page.waitForTimeout(500)
  expect(page.locator('text=May 2000')).toBeVisible()
  expect(page.locator('td:has-text("6").active')).toBeVisible()

  // Close date picker
  await page.click('a.opacity-80')
  await page.waitForTimeout(500)
})

test('Opening a second datepicker should close the first one #7341', async({page,block})=>{
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
  expect(page.locator('text=May 2000')).toBeVisible()
  expect(page.locator('td:has-text("6").active')).toBeVisible()
  expect(page.locator('text=June 2000')).not.toBeVisible()
  expect(page.locator('td:has-text("7").active')).not.toBeVisible()

  // Close date picker
  await page.click('a:has-text("2000-05-06 Sat").opacity-80')
})
