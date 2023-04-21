import { expect } from '@playwright/test'
import { test } from './fixtures'
import {
  createRandomPage, randomInt, IsMac, randomString,
} from './utils'

/**
 * Randomized test for single page editing. Block-wise.
 *
 * For now, only check total number of blocks.
 */

interface RandomTestStep {
  /// target block
  target: number;
  /// action
  op: string;
  text: string;
  /// expected total block number
  expectedBlocks: number;
}

// TODO: add better frequency support
const availableOps = [
  "insertByEnter",
  "insertAtLast",
  // "backspace", // FIXME: cannot backspace to delete block if has children, and prev is a parent, so skip
  // "delete", // FIXME: cannot delete to delete block if next is outdented
  "edit",
  "moveUp",
  "moveDown",
  "indent",
  "unindent",
  "indent",
  "unindent",
  "indent",
  "indent",
  // TODO: selection
]


const generateRandomTest = (size: number): RandomTestStep[] => {
  let blockCount = 1; // default block
  let steps: RandomTestStep[] = []
  for (let i = 0; i < size; i++) {
    let op = availableOps[Math.floor(Math.random() * availableOps.length)];
    // freq adjust
    if (Math.random() > 0.9) {
      op = "insertByEnter"
    }
    let loc = Math.floor(Math.random() * blockCount)
    let text = randomString(randomInt(2, 3))

    if (op === "insertByEnter" || op === "insertAtLast") {
      blockCount++
    } else if (op === "backspace") {
      if (blockCount == 1) {
        continue
      }
      blockCount--
      text = null
    } else if (op === "delete") {
      if (blockCount == 1) {
        continue
      }
      // cannot delete last block
      if (loc === blockCount - 1) {
        continue
      }
      blockCount--
      text = null
    } else if (op === "moveUp" || op === "moveDown") {
      // no op
      text = null
    } else if (op === "indent" || op === "unindent") {
      // no op
      text = null
    } else if (op === "edit") {
      // no ap
    } else {
      throw new Error("unexpected op");
    }
    if (blockCount < 1) {
      blockCount = 1
    }

    let step: RandomTestStep = {
      target: loc,
      op,
      text,
      expectedBlocks: blockCount,
    }
    steps.push(step)
  }

  return steps
}

// TODO: Fix test that intermittently started failing after https://github.com/logseq/logseq/pull/6945
test.skip('Random editor operations', async ({ page, block }) => {
  const steps = generateRandomTest(20)

  await createRandomPage(page)
  await block.mustType("randomized test!")

  for (let i = 0; i < steps.length; i++) {
    let step = steps[i]
    const { target, op, expectedBlocks, text } = step;

    console.log(step)

    if (op === "insertByEnter") {
      await block.activeEditing(target)
      let charCount = (await page.inputValue('textarea >> nth=0')).length
      // FIXME: CHECK expect(await block.selectionStart()).toBe(charCount)

      await page.keyboard.press('Enter', { delay: 50 })
      // FIXME: CHECK await block.waitForBlocks(expectedBlocks)
      // FIXME: use await block.mustType(text)
      await block.mustFill(text)
    } else if (op === "insertAtLast") {
      await block.clickNext()
      await block.mustType(text)
    } else if (op === "backspace") {
      await block.activeEditing(target)
      const charCount = (await page.inputValue('textarea >> nth=0')).length
      for (let i = 0; i < charCount + 1; i++) {
        await page.keyboard.press('Backspace', { delay: 50 })
      }
    } else if (op === "delete") {
      // move text-cursor to beginning
      // then press delete
      // then move text-cursor to the end
      await block.activeEditing(target)
      let charCount = (await page.inputValue('textarea >> nth=0')).length
      for (let i = 0; i < charCount; i++) {
        await page.keyboard.press('ArrowLeft', { delay: 50 })
      }
      expect.soft(await block.selectionStart()).toBe(0)
      for (let i = 0; i < charCount + 1; i++) {
        await page.keyboard.press('Delete', { delay: 50 })
      }
      await block.waitForBlocks(expectedBlocks)
      charCount = (await page.inputValue('textarea >> nth=0')).length
      for (let i = 0; i < charCount; i++) {
        await page.keyboard.press('ArrowRight', { delay: 50 })
      }
    } else if (op === "edit") {
      await block.activeEditing(target)
      await block.mustFill('') // clear old text
      await block.mustType(text)
    } else if (op === "moveUp") {
      await block.activeEditing(target)
      if (IsMac) {
        await page.keyboard.press('Meta+Shift+ArrowUp')
      } else {
        await page.keyboard.press('Alt+Shift+ArrowUp')
      }

    } else if (op === "moveDown") {
      await block.activeEditing(target)
      if (IsMac) {
        await page.keyboard.press('Meta+Shift+ArrowDown')
      } else {
        await page.keyboard.press('Alt+Shift+ArrowDown')
      }
    } else if (op === "indent") {
      await block.activeEditing(target)
      await page.keyboard.press('Tab', { delay: 50 })
    } else if (op === "unindent") {
      await block.activeEditing(target)
      await page.keyboard.press('Shift+Tab', { delay: 50 })
    } else {
      throw new Error("unexpected op");
    }

    // FIXME: CHECK await block.waitForBlocks(expectedBlocks)
    await page.waitForTimeout(50)
  }
})
