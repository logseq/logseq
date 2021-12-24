import { expect } from '@playwright/test'
import { test } from './fixtures'
import { randomString, createRandomPage, newBlock } from './utils'


test('render app', async ({ page }) => {
  // NOTE: part of app startup tests is moved to `fixtures.ts`.

  expect(await page.title()).toMatch(/^Logseq.*?/)
})

test('toggle sidebar', async ({ page }) => {
  let sidebar = page.locator('#left-sidebar')

  // Left sidebar is toggled by `is-open` class
  if (/is-open/.test(await sidebar.getAttribute('class'))) {
    await page.click('#left-menu.button')
    expect(await sidebar.getAttribute('class')).not.toMatch(/is-open/)
  } else {
    await page.click('#left-menu.button')
    expect(await sidebar.getAttribute('class')).toMatch(/is-open/)
    await page.click('#left-menu.button')
    expect(await sidebar.getAttribute('class')).not.toMatch(/is-open/)
  }

  await page.click('#left-menu.button')

  expect(await sidebar.getAttribute('class')).toMatch(/is-open/)
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

test('create page and blocks', async ({ page }) => {
  await createRandomPage(page)

  // do editing
  await page.fill(':nth-match(textarea, 1)', 'this is my first bullet')
  await page.press(':nth-match(textarea, 1)', 'Enter')

  // first block
  expect(await page.$$('.block-content')).toHaveLength(1)

  await page.fill(':nth-match(textarea, 1)', 'this is my second bullet')
  await page.press(':nth-match(textarea, 1)', 'Enter')

  await page.fill(':nth-match(textarea, 1)', 'this is my third bullet')
  await page.press(':nth-match(textarea, 1)', 'Tab')
  await page.press(':nth-match(textarea, 1)', 'Enter')

  await page.keyboard.type('continue editing test')
  await page.keyboard.press('Shift+Enter')
  await page.keyboard.type('continue')

  await page.keyboard.press('Enter')
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.type('test ok')
  await page.keyboard.press('Escape')

  const blocks = await page.$$('.ls-block')
  expect(blocks).toHaveLength(5)

  // active edit
  await page.click('.ls-block >> nth=-1')
  await page.press('textarea >> nth=0', 'Enter')
  await page.fill('textarea >> nth=0', 'test')
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Backspace')
  }

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  expect(await page.$$('.ls-block')).toHaveLength(5)
})

test('delete and backspace', async ({ page }) => {
  await createRandomPage(page)

  await page.fill(':nth-match(textarea, 1)', 'test')

  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('test')

  // backspace
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('te')

  // refill
  await page.fill(':nth-match(textarea, 1)', 'test')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')

  // delete
  await page.keyboard.press('Delete')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('tet')
  await page.keyboard.press('Delete')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('te')
  await page.keyboard.press('Delete')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('te')

  // TODO: test delete & backspace across blocks
})


test('selection', async ({ page }) => {
  await createRandomPage(page)

  await page.fill(':nth-match(textarea, 1)', 'line 1')
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await page.fill(':nth-match(textarea, 1)', 'line 2')
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await page.press(':nth-match(textarea, 1)', 'Tab')
  await page.fill(':nth-match(textarea, 1)', 'line 3')
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await page.fill(':nth-match(textarea, 1)', 'line 4')
  await page.press(':nth-match(textarea, 1)', 'Tab')
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await page.fill(':nth-match(textarea, 1)', 'line 5')

  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.up('Shift')

  await page.waitForTimeout(500)
  await page.keyboard.press('Backspace')

  expect(await page.$$('.ls-block')).toHaveLength(2)
})

test('template', async ({ page }) => {
  const randomTemplate = randomString(10)

  await createRandomPage(page)

  await page.fill(':nth-match(textarea, 1)', 'template')
  await page.press(':nth-match(textarea, 1)', 'Shift+Enter')
  await page.type(':nth-match(textarea, 1)', 'template:: ' + randomTemplate)
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await page.press(':nth-match(textarea, 1)', 'Enter')

  await page.press(':nth-match(textarea, 1)', 'Tab')
  await page.fill(':nth-match(textarea, 1)', 'line1')
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await page.fill(':nth-match(textarea, 1)', 'line2')
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await page.press(':nth-match(textarea, 1)', 'Tab')
  await page.fill(':nth-match(textarea, 1)', 'line3')

  await page.press(':nth-match(textarea, 1)', 'Enter')
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await page.press(':nth-match(textarea, 1)', 'Enter')


  expect(await page.$$('.ls-block')).toHaveLength(5)

  await page.type(':nth-match(textarea, 1)', '/template')

  await page.click('[title="Insert a created template here"]')
  // type to search template name
  await page.keyboard.type(randomTemplate.substring(0, 3))
  await page.click('.absolute >> text=' + randomTemplate)

  await page.waitForTimeout(500)

  expect(await page.$$('.ls-block')).toHaveLength(8)
})

test('auto completion square brackets', async ({ page }) => {
  await createRandomPage(page)

  await page.fill(':nth-match(textarea, 1)', 'Auto-completion test')
  await page.press(':nth-match(textarea, 1)', 'Enter')

  // [[]]
  await page.type(':nth-match(textarea, 1)', 'This is a [')
  await page.inputValue(':nth-match(textarea, 1)').then(text => {
    expect(text).toBe('This is a []')
  })
  await page.type(':nth-match(textarea, 1)', '[')
  // wait for search popup
  await page.waitForSelector('text="Search for a page"')

  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('This is a [[]]')

  // re-enter edit mode
  await page.press(':nth-match(textarea, 1)', 'Escape')
  await page.click('.ls-block >> nth=-1')
  await page.waitForSelector(':nth-match(textarea, 1)', { state: 'visible' })

  // #3253
  await page.press(':nth-match(textarea, 1)', 'ArrowLeft')
  await page.press(':nth-match(textarea, 1)', 'ArrowLeft')
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await page.waitForSelector('text="Search for a page"', { state: 'visible' })

  // type more `]`s
  await page.type(':nth-match(textarea, 1)', ']')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('This is a [[]]')
  await page.type(':nth-match(textarea, 1)', ']')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('This is a [[]]')
  await page.type(':nth-match(textarea, 1)', ']')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('This is a [[]]]')
})

test('auto completion and auto pair', async ({ page }) => {
  await createRandomPage(page)

  await page.fill(':nth-match(textarea, 1)', 'Auto-completion test')
  await page.press(':nth-match(textarea, 1)', 'Enter')

  // {{
  await page.type(':nth-match(textarea, 1)', 'type {{')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type {{}}')

  // ((
  await newBlock(page)

  await page.type(':nth-match(textarea, 1)', 'type (')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type ()')
  await page.type(':nth-match(textarea, 1)', '(')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type (())')

  // 99  #3444
  // TODO: Test under different keyboard layout when Playwright supports it
  // await newBlock(page)

  // await page.type(':nth-match(textarea, 1)', 'type 9')
  // expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type 9')
  // await page.type(':nth-match(textarea, 1)', '9')
  // expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type 99')

  // [[  #3251
  await newBlock(page)

  await page.type(':nth-match(textarea, 1)', 'type [')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type []')
  await page.type(':nth-match(textarea, 1)', '[')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type [[]]')

  // ``
  await newBlock(page)

  await page.type(':nth-match(textarea, 1)', 'type `')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type ``')
  await page.type(':nth-match(textarea, 1)', 'code here')

  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type `code here`')
})


// FIXME: Electron with filechooser is not working
test.skip('open directory', async ({ page }) => {
  await page.click('#left-sidebar >> text=Journals')
  await page.waitForSelector('h1:has-text("Open a local directory")')
  await page.click('h1:has-text("Open a local directory")')

  // await page.waitForEvent('filechooser')
  await page.keyboard.press('Escape')

  await page.click('#left-sidebar >> text=Journals')
})
