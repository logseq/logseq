import { test, expect } from '@playwright/test'
import { ElectronApplication, Page, BrowserContext, _electron as electron } from 'playwright'
import { randomString, createRandomPage, openSidebar, newBlock, lastBlock } from './utils'

let electronApp: ElectronApplication
let context: BrowserContext
let page: Page

test.beforeAll(async () => {
  electronApp = await electron.launch({
    cwd: "./static",
    args: ["electron.js"],
    // NOTE: video recording for Electron is not supported yet
    // recordVideo: {
    //   dir: "./videos",
    // }
  })

  context = electronApp.context()
  await context.tracing.start({ screenshots: true, snapshots: true });

  // Evaluation expression in the Electron context.
  const appPath = await electronApp.evaluate(async ({ app }) => {
    // This runs in the main Electron process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.getAppPath()
  })
  console.log("Test start with AppPath:", appPath)
})

test.beforeEach(async () => {
  // discard any dialog by ESC
  if (page) {
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
  } else {
    page = await electronApp.firstWindow()
  }
})

test.afterAll(async () => {
  // await context.close();
  await context.tracing.stop({ path: 'artifacts.zip' });
  await electronApp.close()
})

test('render app', async () => {
  // Direct Electron console to Node terminal.
  // page.on('console', console.log)

  // Wait for the app to load
  await page.waitForLoadState('domcontentloaded')
  await page.waitForFunction('window.document.title != "Loading"')

  // Logseq: "A privacy-first platform for knowledge management and collaboration."
  // or Logseq
  expect(await page.title()).toMatch(/^Logseq.*?/)

  page.once('load', async () => {
    console.log('Page loaded!')
    await page.screenshot({ path: 'startup.png' })
  })
})

test('first start', async () => {
  await page.waitForSelector('text=This is a demo graph, changes will not be saved until you open a local folder')
})

test('open sidebar', async () => {
  await openSidebar(page)

  await page.waitForSelector('#sidebar-nav-wrapper a:has-text("New page")', { state: 'visible' })
  await page.waitForSelector('#sidebar-nav-wrapper >> text=Journals', { state: 'visible' })
})

test('search', async () => {
  await page.click('#search-button')
  await page.waitForSelector('[placeholder="Search or create page"]')
  await page.fill('[placeholder="Search or create page"]', 'welcome')

  await page.waitForTimeout(500)
  const results = await page.$$('#ui__ac-inner .block')
  expect(results.length).toBeGreaterThanOrEqual(1)
})

test('create page and blocks', async () => {
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

test('delete and backspace', async () => {
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


test('selection', async () => {
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

test('template', async () => {
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

test('auto completion square brackets', async () => {
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

test('auto completion and auto pair', async () => {
  await createRandomPage(page)

  await page.fill(':nth-match(textarea, 1)', 'Auto-completion test')
  await page.press(':nth-match(textarea, 1)', 'Enter')

  // {}
  await page.type(':nth-match(textarea, 1)', 'type {{')
  await page.press(':nth-match(textarea, 1)', 'Escape')

  // FIXME: keycode seq is wrong
  // expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type {{}}')

  // (()
  await newBlock(page)

  await page.type(':nth-match(textarea, 1)', 'type (')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type ()')
  await page.type(':nth-match(textarea, 1)', '(')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type (())')

  // ``
  await newBlock(page)

  await page.type(':nth-match(textarea, 1)', 'type `')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type ``')
  await page.type(':nth-match(textarea, 1)', 'code here')

  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('type `code here`')
})


// FIXME: Electron with filechooser is not working
test.skip('open directory', async () => {
  await page.click('#sidebar-nav-wrapper >> text=Journals')
  await page.waitForSelector('h1:has-text("Open a local directory")')
  await page.click('h1:has-text("Open a local directory")')

  // await page.waitForEvent('filechooser')
  await page.keyboard.press('Escape')

  await page.click('#sidebar-nav-wrapper >> text=Journals')
})
