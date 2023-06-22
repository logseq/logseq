import { expect } from '@playwright/test'
import { test } from './fixtures'
import { modKey, renamePage } from './utils'

test('enable whiteboards', async ({ page }) => {
  if (await page.$('.nav-header .whiteboard') === null) {
    await page.click('#head .toolbar-dots-btn')
    await page.click('#head .dropdown-wrapper >> text=Settings')
    await page.click('.settings-modal a[data-id=features]')
    await page.click('text=Whiteboards >> .. >> .ui__toggle')
    await page.waitForTimeout(1000)
    await page.keyboard.press('Escape')
  }

  await expect(page.locator('.nav-header .whiteboard')).toBeVisible()
})

test('should display onboarding tour', async ({ page }) => {
  // ensure onboarding tour is going to be triggered locally
  await page.evaluate(`window.localStorage.removeItem('whiteboard-onboarding-tour?')`)
  await page.click('.nav-header .whiteboard')

  await expect(page.locator('.cp__whiteboard-welcome')).toBeVisible()
  await page.click('.cp__whiteboard-welcome button.bg-gray-600')
  await expect(page.locator('.cp__whiteboard-welcome')).toBeHidden()
})

test('create new whiteboard', async ({ page }) => {
  await page.click('#tl-create-whiteboard')
  await expect(page.locator('.logseq-tldraw')).toBeVisible()
})

test('can right click title to show context menu', async ({ page }) => {
  await page.click('.whiteboard-page-title', {
    button: 'right',
  })

  await expect(page.locator('#custom-context-menu')).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(page.locator('#custom-context-menu')).toHaveCount(0)
})

test('newly created whiteboard should have a default title', async ({ page }) => {
  await expect(page.locator('.whiteboard-page-title .title')).toContainText(
    'Untitled'
  )
})

test('set whiteboard title', async ({ page }) => {
  const title = 'my-whiteboard'

  await page.click('.nav-header .whiteboard')
  await page.click('#tl-create-whiteboard')
  await page.click('.whiteboard-page-title')
  await page.fill('.whiteboard-page-title input', title)
  await page.keyboard.press('Enter')
  await expect(page.locator('.whiteboard-page-title .title')).toContainText(
    title
  )
})

test('update whiteboard title', async ({ page }) => {
  const title = 'my-whiteboard'

  await page.click('.whiteboard-page-title')
  await page.fill('.whiteboard-page-title input', title + '-2')
  await page.keyboard.press('Enter')

  // Updating non-default title should pop up a confirmation dialog
  await expect(page.locator('.ui__confirm-modal >> .headline')).toContainText(
    `Do you really want to change the page name to “${title}-2”?`
  )

  await page.click('.ui__confirm-modal button')
  await expect(page.locator('.whiteboard-page-title .title')).toContainText(
    title + '-2'
  )
})

test('draw a rectangle', async ({ page }) => {
  const canvas = await page.waitForSelector('.logseq-tldraw')
  const bounds = (await canvas.boundingBox())!

  await page.keyboard.type('wr')

  await page.mouse.move(bounds.x + 105, bounds.y + 105)
  await page.mouse.down()

  await page.mouse.move(bounds.x + 150, bounds.y + 150 )
  await page.mouse.up()
  await page.keyboard.press('Escape')

  await expect(page.locator('.logseq-tldraw .tl-box-container')).toHaveCount(1)
})

test('undo the rectangle action', async ({ page }) => {
  await page.keyboard.press(modKey + '+z')

  await expect(page.locator('.logseq-tldraw .tl-positioned-svg rect')).toHaveCount(0)
})

test('redo the rectangle action', async ({ page }) => {
  await page.keyboard.press(modKey + '+Shift+z')

  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)

  await expect(page.locator('.logseq-tldraw .tl-box-container')).toHaveCount(1)
})

test('clone the rectangle', async ({ page }) => {
  const canvas = await page.waitForSelector('.logseq-tldraw')
  const bounds = (await canvas.boundingBox())!

  await page.mouse.move(bounds.x + 400, bounds.y + 400)

  await page.mouse.move(bounds.x + 120, bounds.y + 120, {steps: 5})

  await page.keyboard.down('Alt')
  await page.mouse.down()

  await page.mouse.move(bounds.x + 200, bounds.y + 200, {steps: 5})
  await page.mouse.up()
  await page.keyboard.up('Alt')

  await expect(page.locator('.logseq-tldraw .tl-box-container')).toHaveCount(2)
})

test('group the rectangles', async ({ page }) => {
  await page.keyboard.press(modKey + '+a')
  await page.keyboard.press(modKey + '+g')

  await expect(page.locator('.logseq-tldraw .tl-group-container')).toHaveCount(1)
})

test('delete the group', async ({ page }) => {
  await page.keyboard.press(modKey + '+a')

  await page.keyboard.press('Delete')

  await expect(page.locator('.logseq-tldraw .tl-group-container')).toHaveCount(0)
    // should also delete the grouped shapes
  await expect(page.locator('.logseq-tldraw .tl-box-container')).toHaveCount(0)
})

test('undo the group deletion', async ({ page }) => {
  await page.keyboard.press(modKey + '+z')

  await expect(page.locator('.logseq-tldraw .tl-group-container')).toHaveCount(1)
  await expect(page.locator('.logseq-tldraw .tl-box-container')).toHaveCount(2)
})

test('undo the group action', async ({ page }) => {
  await page.keyboard.press(modKey + '+z')

  await expect(page.locator('.logseq-tldraw .tl-group-container')).toHaveCount(0)
  await expect(page.locator('.logseq-tldraw .tl-box-container')).toHaveCount(2)
})

test('connect rectangles with an arrow', async ({ page }) => {
  const canvas = await page.waitForSelector('.logseq-tldraw')
  const bounds = (await canvas.boundingBox())!

  await page.keyboard.type('wc')

  await page.mouse.move(bounds.x + 120, bounds.y + 120)
  await page.mouse.down()

  await page.mouse.move(bounds.x + 200, bounds.y + 200, {steps: 5}) // will fail without steps
  await page.mouse.up()
  await page.keyboard.press('Escape')

  await expect(page.locator('.logseq-tldraw .tl-line-container')).toHaveCount(1)
})

test('delete the first rectangle', async ({ page }) => {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)
  await page.click('.logseq-tldraw .tl-box-container:first-of-type')
  await page.keyboard.press('Delete')

  await expect(page.locator('.logseq-tldraw .tl-box-container')).toHaveCount(1)
  await expect(page.locator('.logseq-tldraw .tl-line-container')).toHaveCount(0)
})

test('undo the delete action', async ({ page }) => {
  await page.keyboard.press(modKey + '+z')

  await expect(page.locator('.logseq-tldraw .tl-box-container')).toHaveCount(2)
  await expect(page.locator('.logseq-tldraw .tl-line-container')).toHaveCount(1)
})

test('convert the first rectangle to ellipse', async ({ page }) => {
  const canvas = await page.waitForSelector('.logseq-tldraw')
  const bounds = (await canvas.boundingBox())!

  await page.keyboard.press('Escape')
  await page.mouse.move(bounds.x + 220, bounds.y + 220)
  await page.mouse.down()
  await page.mouse.up()
  await page.mouse.move(bounds.x + 520, bounds.y + 520)

  await page.click('.tl-context-bar .tl-geometry-tools-pane-anchor')
  await page.click('.tl-context-bar .tl-geometry-toolbar [data-tool=ellipse]')

  await expect(page.locator('.logseq-tldraw .tl-ellipse-container')).toHaveCount(1)
  await expect(page.locator('.logseq-tldraw .tl-box-container')).toHaveCount(1)
})

test('change the color of the ellipse', async ({ page }) => {
  await page.click('.tl-context-bar .tl-color-bg')
  await page.click('.tl-context-bar .tl-color-palette .bg-red-500')

  await expect(page.locator('.logseq-tldraw .tl-ellipse-container ellipse:last-of-type')).toHaveAttribute('fill', 'var(--ls-wb-background-color-red)')
})

test('undo the color switch', async ({ page }) => {
  await page.keyboard.press(modKey + '+z')

  await expect(page.locator('.logseq-tldraw .tl-ellipse-container ellipse:last-of-type')).toHaveAttribute('fill', 'var(--ls-wb-background-color-default)')
})

test('undo the shape conversion', async ({ page }) => {
  await page.keyboard.press(modKey + '+z')

  await expect(page.locator('.logseq-tldraw .tl-box-container')).toHaveCount(2)
  await expect(page.locator('.logseq-tldraw .tl-ellipse-container')).toHaveCount(0)
})

test('locked elements should not be removed', async ({ page }) => {
  const canvas = await page.waitForSelector('.logseq-tldraw')
  const bounds = (await canvas.boundingBox())!

  await page.keyboard.press('Escape')
  await page.mouse.move(bounds.x + 220, bounds.y + 220)
  await page.mouse.down()
  await page.mouse.up()
  await page.mouse.move(bounds.x + 520, bounds.y + 520)
  await page.keyboard.press(`${modKey}+l`)
  await page.keyboard.press('Delete')
  await page.keyboard.press(`${modKey}+Shift+l`)

  await expect(page.locator('.logseq-tldraw .tl-box-container')).toHaveCount(2)

})

test('move arrow to back', async ({ page }) => {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)
  await page.click('.logseq-tldraw .tl-line-container')
  await page.keyboard.press('Shift+[')

  await expect(page.locator('.logseq-tldraw .tl-canvas .tl-layer > div:first-of-type > div:first-of-type')).toHaveClass('tl-line-container')
})

test('move arrow to front', async ({ page }) => {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)
  await page.click('.logseq-tldraw .tl-line-container')
  await page.keyboard.press('Shift+]')

  await expect(page.locator('.logseq-tldraw .tl-canvas .tl-layer > div:first-of-type > div:first-of-type')).not.toHaveClass('tl-line-container')
})

test('undo the move action', async ({ page }) => {
  await page.keyboard.press(modKey + '+z')

  await expect(page.locator('.logseq-tldraw .tl-canvas .tl-layer > div:first-of-type > div:first-of-type')).toHaveClass('tl-line-container')
})

test('cleanup the shapes', async ({ page }) => {
  await page.keyboard.press(`${modKey}+a`)
  await page.keyboard.press('Delete')
  await expect(page.locator('[data-type=Shape]')).toHaveCount(0)
})

test('create a block', async ({ page }) => {
  const canvas = await page.waitForSelector('.logseq-tldraw')
  const bounds = (await canvas.boundingBox())!

  await page.keyboard.type('ws')
  await page.mouse.dblclick(bounds.x + 105, bounds.y + 105)
  await page.waitForTimeout(100)

  await page.keyboard.type('a')
  await page.keyboard.press('Enter')


  await expect(page.locator('.logseq-tldraw .tl-logseq-portal-container')).toHaveCount(1)
})

// TODO: Fix the failing test
test.skip('expand the block', async ({ page }) => {
  await page.keyboard.press('Escape')
  await page.keyboard.press(modKey + '+ArrowDown')
  await page.waitForTimeout(100)

  await expect(page.locator('.logseq-tldraw .tl-logseq-portal-container .tl-logseq-portal-header')).toHaveCount(1)
})

// TODO: Depends on the previous test
test.skip('undo the expand action', async ({ page }) => {
  await page.keyboard.press(modKey + '+z')

  await expect(page.locator('.logseq-tldraw .tl-logseq-portal-container .tl-logseq-portal-header')).toHaveCount(0)
})

test('undo the block action', async ({ page }) => {
  await page.keyboard.press(modKey + '+z')

  await expect(page.locator('.logseq-tldraw .tl-logseq-portal-container')).toHaveCount(0)
})

test('copy/paste url to create an iFrame shape', async ({ page }) => {
  const canvas = await page.waitForSelector('.logseq-tldraw')
  const bounds = (await canvas.boundingBox())!

  await page.keyboard.type('wt')
  await page.mouse.move(bounds.x + 105, bounds.y + 105)
  await page.mouse.down()
  await page.waitForTimeout(100)

  await page.keyboard.type('https://logseq.com')
  await page.keyboard.press(modKey + '+a')
  await page.keyboard.press(modKey + '+c')
  await page.keyboard.press('Escape')

  await page.keyboard.press(modKey + '+v')

  await expect( page.locator('.logseq-tldraw .tl-iframe-container')).toHaveCount(1)
})

test('copy/paste twitter status url to create a Tweet shape', async ({ page }) => {
  const canvas = await page.waitForSelector('.logseq-tldraw')
  const bounds = (await canvas.boundingBox())!

  await page.keyboard.type('wt')
  await page.mouse.move(bounds.x + 105, bounds.y + 105)
  await page.mouse.down()
  await page.waitForTimeout(100)

  await page.keyboard.type('https://twitter.com/logseq/status/1605224589046386689')
  await page.keyboard.press(modKey + '+a')
  await page.keyboard.press(modKey + '+c')
  await page.keyboard.press('Escape')

  await page.keyboard.press(modKey + '+v')

  await expect( page.locator('.logseq-tldraw .tl-tweet-container')).toHaveCount(1)
})

test('copy/paste youtube video url to create a Youtube shape', async ({ page }) => {
  const canvas = await page.waitForSelector('.logseq-tldraw')
  const bounds = (await canvas.boundingBox())!

  await page.keyboard.type('wt')
  await page.mouse.move(bounds.x + 105, bounds.y + 105)
  await page.mouse.down()
  await page.waitForTimeout(100)

  await page.keyboard.type('https://www.youtube.com/watch?v=hz2BacySDXE')
  await page.keyboard.press(modKey + '+a')
  await page.keyboard.press(modKey + '+c')
  await page.keyboard.press('Escape')

  await page.keyboard.press(modKey + '+v')

  await expect(page.locator('.logseq-tldraw .tl-youtube-container')).toHaveCount(1)
})

test('zoom in', async ({ page }) => {
  await page.keyboard.press('Shift+0') // reset zoom
  await page.waitForTimeout(1500) // wait for the zoom animation to finish
  await page.keyboard.press('Shift+=')
  await page.waitForTimeout(1500) // wait for the zoom animation to finish
  await expect(page.locator('#tl-zoom')).toContainText('125%')
})

test('zoom out', async ({ page }) => {
  await page.keyboard.press('Shift+0')
  await page.waitForTimeout(1500) // wait for the zoom animation to finish
  await page.keyboard.press('Shift+-')
  await page.waitForTimeout(1500) // wait for the zoom animation to finish
  await expect(page.locator('#tl-zoom')).toContainText('80%')
})

test('open context menu', async ({ page }) => {
  await page.locator('.logseq-tldraw').click({ button: 'right' })
  await expect(page.locator('.tl-context-menu')).toBeVisible()
})

test('close context menu on esc', async ({ page }) => {
  await page.keyboard.press('Escape')
  await expect(page.locator('.tl-context-menu')).toBeHidden()
})

test('quick add another whiteboard', async ({ page }) => {
  // create a new board first
  await page.click('.nav-header .whiteboard')
  await page.click('#tl-create-whiteboard')

  await page.click('.whiteboard-page-title')
  await page.fill('.whiteboard-page-title input', 'my-whiteboard-3')
  await page.keyboard.press('Enter')

  const canvas = await page.waitForSelector('.logseq-tldraw')
  await canvas.dblclick({
    position: {
      x: 200,
      y: 200,
    },
  })

  const quickAdd$ = page.locator('.tl-quick-search')
  await expect(quickAdd$).toBeVisible()

  await page.fill('.tl-quick-search input', 'my-whiteboard')
  await quickAdd$
    .locator('.tl-quick-search-option >> text=my-whiteboard-2')
    .first()
    .click()

  await expect(quickAdd$).toBeHidden()
  await expect(
    page.locator('.tl-logseq-portal-container >> text=my-whiteboard-2')
  ).toBeVisible()
})

test('go to another board and check reference', async ({ page }) => {
  await page
    .locator('.tl-logseq-portal-container >> text=my-whiteboard-2')
    .click()
  await expect(page.locator('.whiteboard-page-title .title')).toContainText(
    'my-whiteboard-2'
  )

  const pageRefCount$ = page.locator('.whiteboard-page-refs-count')
  await expect(pageRefCount$.locator('.open-page-ref-link')).toContainText('1')
})

test('Create an embedded whiteboard', async ({ page }) => {
  const canvas = await page.waitForSelector('.logseq-tldraw')
  await canvas.dblclick({
    position: {
      x: 110,
      y: 110,
    },
  })

  const quickAdd$ = page.locator('.tl-quick-search')
  await expect(quickAdd$).toBeVisible()

  await page.fill('.tl-quick-search input', 'My embedded whiteboard')
  await quickAdd$
    .locator('div[data-index="2"] .tl-quick-search-option')
    .first()
    .click()

  await expect(quickAdd$).toBeHidden()
  await expect(page.locator('.tl-logseq-portal-header a')).toContainText('My embedded whiteboard')
})

test('New whiteboard should have the correct name', async ({ page }) => {
  page.locator('.tl-logseq-portal-header a').click()

  await expect(page.locator('.whiteboard-page-title')).toContainText('My embedded whiteboard')
})

test('Create an embedded page', async ({ page }) => {
  const canvas = await page.waitForSelector('.logseq-tldraw')
  await canvas.dblclick({
    position: {
      x: 150,
      y: 150,
    },
  })

  const quickAdd$ = page.locator('.tl-quick-search')
  await expect(quickAdd$).toBeVisible()

  await page.fill('.tl-quick-search input', 'My page')
  await quickAdd$
    .locator('div[data-index="1"] .tl-quick-search-option')
    .first()
    .click()

  await expect(quickAdd$).toBeHidden()
  await expect(page.locator('.tl-logseq-portal-header a')).toContainText('My page')
})

test('New page should have the correct name', async ({ page }) => {
  page.locator('.tl-logseq-portal-header a').click()

  await expect(page.locator('.ls-page-title')).toContainText('My page')
})

test('Renaming a page to an existing whiteboard name should be prohibited', async ({ page }) => {
  await renamePage(page, "My embedded whiteboard")

  await expect(page.locator('.page-title input')).toHaveValue('My page')
})