import { expect } from '@playwright/test'
import { test } from './fixtures'
import {
  createRandomPage, randomInt, randomInsert, randomEditDelete, randomEditMoveUpDown,
} from './utils'

test('Random editor operations', async ({ page, block }) => {
  let ops = [
    randomInsert,
    randomEditMoveUpDown,
    randomEditDelete,

    // Errors:
    // locator.waitFor: Timeout 1000ms exceeded.
    //   =========================== logs ===========================
    //   waiting for selector "textarea >> nth=0" to be visible
    // selector resolved to hidden <textarea tabindex="-1" aria-hidden="true"></textarea>

    // editRandomBlock,

    // randomSelectBlocks,

    // randomIndentOutdent,
  ]

  await createRandomPage(page)

  await block.mustType('Random tests start!')
  await randomInsert(page, block)

  for (let i = 0; i < 100; i++) {
    let n = randomInt(0, ops.length - 1)

    let f = ops[n]
    await f(page, block)

  }
})
