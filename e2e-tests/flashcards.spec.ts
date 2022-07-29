import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage } from './utils'


test('flashcard demo', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('Why do you add cards? #card #logseq')
  await block.enterNext()
  expect(await block.indent()).toBe(true)
  await block.mustFill('To augment our minds')

  await block.enterNext()
  expect(await block.unindent()).toBe(true)
  expect(await block.unindent()).toBe(false)

  await block.mustFill('How do you create clozes? #card #logseq')
  await block.enterNext()
  expect(await block.indent()).toBe(true)

  await block.mustType('/clo')
  const popupMenuItem = page.locator('.absolute >> text=Cloze')
  await popupMenuItem.waitFor({ timeout: 1000 }) // wait for electric-input
  await popupMenuItem.click({ delay: 10 })
  await page.waitForTimeout(500)

  await page.type('textarea >> nth=0', 'Something')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')

  await page.type('textarea >> nth=0', ' like this')

  await block.enterNext()
  expect(await block.unindent()).toBe(true)

  // navigate to another page, query cards
  await createRandomPage(page)

  await block.mustFill('{{cards [[logseq]]}}')
  await page.keyboard.press('Enter')
  const queryCards = page.locator('text="No matched cards"')
  await queryCards.waitFor({ state: 'hidden', timeout: 6000 })

  const numberLabel = page.locator('.cards-title')
  await numberLabel.waitFor({ state: 'visible' })
  expect(await numberLabel.innerText()).toMatch(/\[\[logseq\]\]\s+2\/2/)

  // DO NOT check number label for now
  //const cardsNum = page.locator('.flashcards-nav span >> nth=1')
  //expect(await cardsNum.innerText()).toBe('2')
})
