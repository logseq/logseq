import '@logseq/libs'
import type { logseq as portable } from '../../../../libs/src/LSPlugin.quickjs'

declare const logseq: typeof portable

function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message)
}

const connected = logseq.ready(async (info) => {
  await connected
  const uuid = '00000000-0000-0000-0000-000000000099'
  check(
    (info.id === 'sdk-probe' || info.id === 'sdk-probe-empty') &&
      info.runtime === 'quickjs',
    'metadata'
  )
  check(logseq.baseInfo.id === info.id, 'baseInfo')
  for (const key of ['window', 'document', 'process', 'require', 'fetch']) {
    check(
      Reflect.get(globalThis, key) === undefined,
      `unexpected global: ${key}`
    )
  }
  if (info.id === 'sdk-probe-empty') {
    check((await logseq.Editor.checkEditing()) === false, 'absent editing')
    check(
      (await logseq.Editor.getEditingBlockContent()) === null,
      'absent text'
    )
    check((await logseq.Editor.getCurrentBlock()) === null, 'absent block')
    check((await logseq.Editor.getCurrentPage()) === null, 'absent page')
    check((await logseq.Editor.getBlock(uuid)) === null, 'no graph block')
    check((await logseq.Editor.getPage('missing')) === null, 'no graph page')
    let rejected = false
    try {
      await logseq.DB.datascriptQuery('[:find ?e :where [?e :block/uuid]]')
    } catch (error) {
      rejected = error instanceof Error && error.message === 'Invalid_request'
    }
    check(rejected, 'no graph query')
    return
  }
  check((await logseq.Editor.checkEditing()) === uuid, 'editing identity')
  check(
    (await logseq.Editor.getEditingBlockContent()) === 'unsaved probe text',
    'live text'
  )
  const block = await logseq.Editor.getCurrentBlock()
  const page = await logseq.Editor.getCurrentPage()
  check(
    block?.uuid === uuid && block.title === 'quickjs sdk probe',
    'current block'
  )
  check(page?.uuid === uuid && page.title === block.title, 'current page')
  check(
    (await logseq.Editor.getBlock({ uuid }))?.id === block.id,
    'UUID lookup'
  )
  check(
    (await logseq.Editor.getBlock(block.id))?.uuid === uuid,
    'numeric lookup'
  )
  check(
    (await logseq.Editor.getPage('quickjs sdk probe'))?.id === block.id,
    'page name'
  )
  check((await logseq.Editor.getPage(block.id))?.uuid === uuid, 'page ID')
  const rows = await logseq.DB.datascriptQuery(
    '[:find ?uuid :in $ ?title :where [?e :block/title ?title] [?e :block/uuid ?uuid]]',
    'quickjs sdk probe'
  )
  check(JSON.stringify(rows) === JSON.stringify([[uuid]]), 'graph query')
  const inputs = [null, false, 2, 'unicode \u2603', { 'sample-key': [1, null] }]
  const roundtrip = await logseq.DB.datascriptQuery(
    '[:find ?a ?b ?c ?d ?e :in $ ?a ?b ?c ?d ?e]',
    ...inputs
  )
  check(
    JSON.stringify(roundtrip) === JSON.stringify([inputs]),
    'variadic inputs'
  )
  let unsupported = false
  try {
    Reflect.get(logseq.DB, 'q')
  } catch (error) {
    unsupported = error instanceof Error && error.message === 'Unsupported'
  }
  check(unsupported && Object.isFrozen(logseq.Editor), 'closed SDK surface')
  console.info('SDK read probe passed')
})
