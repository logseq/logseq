import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, enterNextBlock, editFirstBlock, randomInt, IsMac,
         randomInsert, randomEditDelete, randomEditMoveUpDown,
         editRandomBlock, randomSelectBlocks, randomIndentOutdent} from './utils'

test('Random editor operations', async ({page, block}) => {
  var ops = [
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

    var f = ops[n]
    if (f.toString() == randomInsert.toString()) {
      await f(page, block)
    } else {
      await f(page)
    }
  }
})
