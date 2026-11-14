import '@logseq/libs'
import type { logseq as portable } from '../../../../libs/src/LSPlugin.quickjs'

declare const logseq: typeof portable

function check(value: unknown, message: string): asserts value {
  if (!value) {
    console.error(message)
    throw new Error(message)
  }
}

const connected = logseq.ready(async (info) => {
  await connected
  if (info.id === 'sdk-probe-failure') {
    console.error('initialization failed')
    throw new Error('expected activation failure')
  }
  if (info.id.startsWith('sdk-probe-grants-')) {
    const mask = Number(info.id.slice('sdk-probe-grants-'.length))
    const expected = ['editor_read', 'graph_read', 'db_query'].filter(
      (_, index) => (mask & (1 << index)) !== 0
    )
    check(logseq.baseInfo === info, 'shared metadata snapshot')
    check(
      JSON.stringify(info.grantedCapabilities) === JSON.stringify(expected),
      'exact session grants'
    )
    check(
      Object.isFrozen(info) && Object.isFrozen(info.grantedCapabilities),
      'immutable grant snapshot'
    )
    check(
      !Reflect.set(info.grantedCapabilities, 0, 'editor_command') &&
        !Reflect.set(info, 'grantedCapabilities', ['editor_command']),
      'grant mutation rejected'
    )
    for (const [index, [allowed, request]] of (
      [
        [(mask & 1) !== 0, () => logseq.Editor.checkEditing()],
        [(mask & 2) !== 0, () => logseq.Editor.getPage('quickjs sdk probe')],
        [(mask & 3) === 3, () => logseq.Editor.getCurrentPageBlocksTree()],
        [(mask & 3) === 3, () => logseq.Editor.getSelectedBlocks()],
        [
          (mask & 2) !== 0,
          () =>
            logseq.Editor.getBlockProperty(
              '00000000-0000-0000-0000-000000000100',
              'plugin.property.sdk-probe/score'
            ),
        ],
        [
          (mask & 2) !== 0,
          () => logseq.Editor.getPageProperties('quickjs sdk probe'),
        ],
        [(mask & 2) !== 0, () => logseq.Editor.getTodayPage()],
        [(mask & 2) !== 0, () => logseq.Editor.getAllPages()],
        [
          (mask & 2) !== 0,
          () =>
            logseq.Editor.getPreviousSiblingBlock(
              '00000000-0000-0000-0000-000000000101'
            ),
        ],
        [
          (mask & 2) !== 0,
          () =>
            logseq.Editor.getNextSiblingBlock(
              '00000000-0000-0000-0000-000000000100'
            ),
        ],
        [
          (mask & 6) === 6,
          () => logseq.DB.datascriptQuery('[:find ?e :where [?e :block/uuid]]'),
        ],
      ] as const
    ).entries()) {
      try {
        await request()
        check(allowed, 'ungranted read succeeded')
      } catch (error) {
        check(
          !allowed &&
            error instanceof Error &&
            error.message === 'Permission_denied',
          `grant enforcement ${index}: ${String(error)}`
        )
      }
    }
    return
  }
  const uuid = '00000000-0000-0000-0000-000000000099'
  if (info.id === 'sdk-probe-selection') {
    const selected = await logseq.Editor.getSelectedBlocks()
    check(
      selected.map((block) => block.uuid).join(',') ===
        '00000000-0000-0000-0000-000000000101,00000000-0000-0000-0000-000000000100',
      'selection follows its owning projection, not UUID or main-page order'
    )
    return
  }
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
    check(
      (await logseq.Editor.getCurrentPageBlocksTree()).length === 0,
      'empty tree'
    )
    check(
      (await logseq.Editor.getSelectedBlocks()).length === 0,
      'empty selection'
    )
    check((await logseq.Editor.getAllPages()).length === 0, 'no graph catalog')
    check((await logseq.Editor.getTodayPage()) === null, 'no graph today page')
    check(
      (await logseq.Editor.getPageProperties(uuid)) === null,
      'no graph properties'
    )
    check(
      (await logseq.Editor.getBlockProperty(
        uuid,
        'plugin.property.sdk-probe/score'
      )) === null,
      'no graph property'
    )
    check((await logseq.Editor.getBlock(uuid)) === null, 'no graph block')
    check((await logseq.Editor.getPage('missing')) === null, 'no graph page')
    check(
      (await logseq.Editor.getNextSiblingBlock(uuid)) === null,
      'no graph sibling'
    )
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
  const pageById = await logseq.Editor.getPage(block.id)
  check(pageById?.uuid === uuid, 'page ID')
  const tree = await logseq.Editor.getCurrentPageBlocksTree()
  const child = tree[0]?.children?.[0]
  check(
    tree.map((block) => block.uuid).join(',') ===
      '00000000-0000-0000-0000-000000000100,00000000-0000-0000-0000-000000000101' &&
      typeof child === 'object' &&
      child !== null &&
      !Array.isArray(child) &&
      child.uuid === '00000000-0000-0000-0000-000000000102',
    'complete ordered current-page tree'
  )
  check(
    (await logseq.Editor.getSelectedBlocks()).length === 0,
    'empty selection with editing'
  )
  const key = ':plugin.property.sdk-probe/score'
  const first = await logseq.Editor.getBlock(
    '00000000-0000-0000-0000-000000000100'
  )
  const value = await logseq.Editor.getBlockProperty(
    '00000000-0000-0000-0000-000000000100',
    key
  )
  check(
    Array.isArray(value) &&
      value.length === 2 &&
      JSON.stringify(value) === JSON.stringify(first?.properties?.[key]),
    'canonical property read preserves the structured value'
  )
  check(
    (await logseq.Editor.getBlockProperty(
      uuid,
      'plugin.property.sdk-probe/missing'
    )) === null,
    'absent property'
  )
  const properties = await logseq.Editor.getPageProperties('quickjs sdk probe')
  check(
    properties !== null &&
      JSON.stringify(properties[key]) ===
        JSON.stringify(block.properties?.[key]),
    'page properties use canonical keys'
  )
  check(
    (await logseq.Editor.getPageProperties('missing sdk page')) === null,
    'absent page properties'
  )
  const today = await logseq.Editor.getTodayPage()
  check(
    today?.uuid === '00000000-0000-0000-0000-000000000103',
    'today lookup without creation'
  )
  const pages = await logseq.Editor.getAllPages()
  check(
    pages.some((page) => page.uuid === uuid) &&
      pages.some((page) => page.uuid === today.uuid) &&
      !pages.some(
        (page) => page.uuid === '00000000-0000-0000-0000-000000000111'
      ) &&
      pages.every(
        (page, index) =>
          index === 0 || String(pages[index - 1].title) <= String(page.title)
      ),
    'deterministic current-graph catalog excludes hidden pages'
  )
  const projected = await logseq.Editor.getBlockProperty(
    '00000000-0000-0000-0000-000000000112',
    key
  )
  check(
    Array.isArray(projected) && projected.length === 1,
    'unrelated large title is not projected'
  )
  const firstUuid = '00000000-0000-0000-0000-000000000100'
  const lastUuid = '00000000-0000-0000-0000-000000000101'
  const previous = await logseq.Editor.getPreviousSiblingBlock(lastUuid)
  const next = await logseq.Editor.getNextSiblingBlock({ uuid: firstUuid })
  check(
    previous?.uuid === firstUuid && next?.uuid === lastUuid,
    'immediate sibling order'
  )
  check(
    (await logseq.Editor.getPreviousSiblingBlock(previous.id)) === null,
    'first sibling boundary'
  )
  check(
    (await logseq.Editor.getNextSiblingBlock(next.id)) === null,
    'last sibling boundary'
  )
  check(
    (await logseq.Editor.getNextSiblingBlock(
      '00000000-0000-0000-0000-000000000088'
    )) === null,
    'missing sibling source'
  )
  const rows = await logseq.DB.datascriptQuery(
    '[:find ?uuid :in $ ?title :where [?e :block/title ?title] [?e :block/uuid ?uuid]]',
    'quickjs sdk probe'
  )
  check(JSON.stringify(rows) === JSON.stringify([[uuid]]), 'graph query')
  const inputs = [
    null,
    false,
    2,
    'unicode \u2603',
    {
      'sample-key': [1, null, 1e20, -1e20, 1e16, 9007199254740991, 2147483648],
    },
  ]
  const roundtrip = await logseq.DB.datascriptQuery(
    '[:find ?a ?b ?c ?d ?e :in $ ?a ?b ?c ?d ?e]',
    ...inputs
  )
  check(
    JSON.stringify(roundtrip) === JSON.stringify([inputs]),
    'variadic inputs'
  )
  for (const invalid of ['score', 'a/b/c', ':a/with space']) {
    try {
      await logseq.Editor.getBlockProperty(uuid, invalid)
      throw new Error('invalid property identifier accepted')
    } catch (error) {
      check(
        error instanceof Error && error.message === 'Invalid_request',
        'canonical identifiers only'
      )
    }
  }
  try {
    await Reflect.apply(logseq.Editor.getAllPages, null, ['another graph'])
    throw new Error('cross-graph argument accepted')
  } catch (error) {
    check(
      error instanceof Error && error.message === 'Unsupported',
      'no cross-graph catalog argument'
    )
  }
  let unsupported = false
  try {
    Reflect.get(logseq.DB, 'q')
  } catch (error) {
    unsupported = error instanceof Error && error.message === 'Unsupported'
  }
  check(unsupported && Object.isFrozen(logseq.Editor), 'closed SDK surface')
  console.info('SDK read probe passed')
})
