import '@logseq/libs'
import type { logseq as portable } from '../../../../libs/src/LSPlugin.quickjs'

declare const logseq: typeof portable

function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message)
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
    for (const [allowed, request] of [
      [(mask & 1) !== 0, () => logseq.Editor.checkEditing()],
      [(mask & 2) !== 0, () => logseq.Editor.getPage('quickjs sdk probe')],
      [
        (mask & 2) !== 0,
        () =>
          logseq.Editor.getBlock('00000000-0000-0000-0000-000000000100', {
            includeChildren: true,
          }),
      ],
      [
        (mask & 2) !== 0,
        () => logseq.Editor.getPageLinkedReferences('quickjs sdk probe'),
      ],
      [
        (mask & 6) === 6,
        () => logseq.DB.q('[:find ?e :where [?e :block/uuid]]'),
      ],
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
    ] as const) {
      try {
        await request()
        check(allowed, 'ungranted read succeeded')
      } catch (error) {
        check(
          !allowed &&
            error instanceof Error &&
            error.message === 'Permission_denied',
          'grant enforcement'
        )
      }
    }
    return
  }
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
    check(
      (await logseq.Editor.getBlock(uuid, { includeChildren: true })) === null,
      'no graph tree'
    )
    check(
      (await logseq.Editor.getPageLinkedReferences(uuid)) === null,
      'no graph references'
    )
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
  check((await logseq.Editor.getPage(block.id))?.uuid === uuid, 'page ID')
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
  const tree = await logseq.Editor.getBlock(
    '00000000-0000-0000-0000-000000000100',
    { includeChildren: true }
  )
  check(
    tree?.properties?.[':plugin.property.sdk-probe/score']?.[
      ':logseq.property/value'
    ] === 7,
    'tree properties'
  )
  check(
    tree['collapsed?'] === true &&
      tree.children?.length === 1 &&
      !Array.isArray(tree.children[0]) &&
      tree.children[0]?.uuid === '00000000-0000-0000-0000-000000000102',
    'nested children'
  )
  const refs = await logseq.Editor.getPageLinkedReferences(uuid)
  const groups = new Map(
    refs?.map(([page, blocks]) => [
      page.uuid,
      blocks.map((block) => block.uuid),
    ])
  )
  check(
    groups.size === 2 &&
      groups.get('00000000-0000-0000-0000-000000000103')?.length === 2 &&
      groups.get('00000000-0000-0000-0000-000000000106')?.[0] ===
        '00000000-0000-0000-0000-000000000107',
    'grouped page references'
  )
  check(
    (await logseq.Editor.getPageLinkedReferences('missing')) === null,
    'missing reference target'
  )
  check(
    (await logseq.Editor.getPageLinkedReferences('quickjs source page'))
      ?.length === 0,
    'empty references'
  )
  const inputs = [
    null,
    false,
    2,
    'unicode \u2603',
    {
      'sample-key': [1, null, 1e20, -1e20, 1e16, 9007199254740991, 2147483648],
    },
  ]
  const roundtrip = await logseq.DB.q(
    '[:find ?a ?b ?c ?d ?e :in $ ?a ?b ?c ?d ?e]',
    ...inputs
  )
  check(
    JSON.stringify(roundtrip) === JSON.stringify([inputs]),
    'variadic inputs'
  )
  let unsupported = false
  try {
    Reflect.get(logseq.DB, 'transact')
  } catch (error) {
    unsupported = error instanceof Error && error.message === 'Unsupported'
  }
  check(unsupported && Object.isFrozen(logseq.Editor), 'closed SDK surface')
  console.info('SDK read probe passed')
})
