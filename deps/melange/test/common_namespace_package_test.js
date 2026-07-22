const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { createRequire } = require('node:module')
const test = require('node:test')

function findRepoRoot(start) {
  let directory = start
  while (directory !== path.dirname(directory)) {
    if (fs.existsSync(path.join(directory, 'pnpm-workspace.yaml'))) {
      return directory
    }
    directory = path.dirname(directory)
  }
  throw new Error(`Could not find repository root from ${start}`)
}

const repoRoot = findRepoRoot(__dirname)
const consumerRequire = createRequire(path.join(repoRoot, 'package.json'))
const bridgeContractRoot = path.join(
  repoRoot,
  'deps/melange/bridge/test/package_contract'
)

const commonBridgeContract = {
  Authorization: ['verifyJwtDefault'],
  BlockRef: [
    'blockRefRe',
    'getBlockRefId',
    'getStringBlockRefId',
    'isBlockRef',
    'isStringBlockRef',
    'leftAndRightParens',
    'leftParens',
    'rightParens',
    'toBlockRef',
  ],
  CognitoConfig: [
    'cliCognitoClientId',
    'cognitoClientId',
    'oauthDomain',
    'oauthScope',
  ],
  Config: [
    'appName',
    'blockPattern',
    'canonicalizeDbVersionRepo',
    'dbVersionPrefix',
    'favoritesPageName',
    'fileOnlyConfigDescription',
    'fileOnlyConfigKeys',
    'fileVersionPrefix',
    'imageFormatKeys',
    'isHidden',
    'isImageFormat',
    'isLocalProtocolAsset',
    'isLocalRelativeAsset',
    'isProtocolPath',
    'isTextFormat',
    'libraryPageName',
    'localAssetsDir',
    'quickAddPageName',
    'recyclePageName',
    'removeAssetProtocol',
    'stripLeadingDbVersionPrefix',
    'unlinkedGraphsDir',
    'unusedInDbGraphsDeprecation',
    'viewsPageName',
  ],
  DateTime: [
    'defaultJournalTitleFormatter',
    'formatDateTime',
    'formatJournalDay',
    'isJournalTitle',
    'isJournalTitleWithSlash',
    'journalDayOfMs',
    'journalDayToUtcMs',
    'journalTitleFormatters',
    'localDateMsOfJournalDay',
    'nowMs',
    'parseJournalTitleDay',
    'safeJournalTitleFormatters',
  ],
  Graph: ['isIgnoredPath'],
  GraphDir: [
    'decodeGraphDirName',
    'decodeLegacyGraphDirName',
    'encodeGraphDirName',
    'graphDirKeyToEncodedDirName',
    'repoIdentity',
    'repoToEncodedGraphDirName',
    'repoToGraphDirKey',
    'sameRepo',
  ],
  GraphRegistry: [
    'normalizeValueWith',
    'resolveTargetValueWith',
    'upsertValueWith',
  ],
  Macro: ['expandValueIfMacro', 'isMacro'],
  Namespace: ['getLastPart', 'namespacePage'],
  PageRef: [
    'getFileBasename',
    'getPageName',
    'getPageNameOrSelf',
    'isPageRef',
    'leftAndRightBrackets',
    'leftBrackets',
    'markdownPageRefRe',
    'pageRefAnyRe',
    'pageRefRe',
    'pageRefWithoutNestedRe',
    'rightBrackets',
    'toPageRef',
  ],
  Path: [
    'basename',
    'fileExt',
    'fileUrlOrPathToPath',
    'filename',
    'isAbsolute',
    'isProtocolUrl',
    'parent',
    'pathJoin',
    'pathNormalize',
    'prependProtocol',
    'trimDirPrefix',
    'urlToPath',
  ],
  StringUtil: [
    'capitalizeAll',
    'clearMarkdownHeading',
    'escapeRegexChars',
    'fileExtension',
    'fileFormatName',
    'isUrl',
    'isValidEdnKeyword',
    'isValidTag',
    'isWrappedByParens',
    'isWrappedByQuotes',
    'joinPathSegments',
    'normalizeFormatName',
    'normalizeNfc',
    'pageNameSanityLower',
    'removeBoundarySlashes',
    'replaceIgnoreCase',
    'safeDecodeUriComponent',
    'safeReFindValueWith',
    'safeSubstring',
    'safeSubstringRange',
    'splitFirst',
    'splitLast',
    'splitNamespacePages',
    'urlEncodedPattern',
    'zeroPad',
  ],
  Util: [
    'blockWithTimestampsWith',
    'compareByWith',
    'concatPresentValues',
    'distinctByLastWinsWith',
    'distinctLazyWith',
    'fastRemoveNilsWith',
    'pageTitle',
    'removeNilEntries',
    'safeReadMapStringWith',
    'safeReadStringWith',
  ],
  Uuid: [
    'builtinBlock',
    'dbIdentBlock',
    'generate',
    'isString',
    'journalPage',
    'journalTemplate',
    'viewBlock',
  ],
  Version: ['formatVersion'],
}

test('common package exports exactly the bridge contract', () => {
  const common = consumerRequire('@logseq/melange-js-api/common')

  assert.equal(Object.values(commonBridgeContract).flat().length, 133)
  assert.deepEqual(
    Object.keys(common).sort(),
    Object.keys(commonBridgeContract).sort()
  )
  for (const [moduleName, members] of Object.entries(commonBridgeContract)) {
    assert.deepEqual(
      Object.keys(common[moduleName]).sort(),
      members,
      moduleName
    )
  }
})

test('common package preserves representative JavaScript boundary values', () => {
  const { Namespace, StringUtil, Util } = consumerRequire(
    '@logseq/melange-js-api/common'
  )

  assert.equal(Namespace.getLastPart('//'), undefined)
  assert.deepEqual(StringUtil.splitFirst(':', 'a:b:c'), ['a', 'b:c'])
  assert.deepEqual(
    Util.removeNilEntries([
      ['missing', null],
      ['false', false],
      ['nested', [null]],
    ]),
    [
      ['false', false],
      ['nested', [null]],
    ]
  )
})

test('common package propagates JavaScript boundary errors', () => {
  const { StringUtil } = consumerRequire('@logseq/melange-js-api/common')

  assert.throws(() => StringUtil.splitNamespacePages('/'))
})

test('common package invokes capability callbacks once', () => {
  const { Uuid } = consumerRequire('@logseq/melange-js-api/common')
  const expected = { native: 'uuid' }
  let calls = 0

  assert.equal(
    Uuid.generate(() => {
      calls += 1
      return expected
    }),
    expected
  )
  assert.equal(calls, 1)
})

test('common package is callable from static ClojureScript', () => {
  const nbb = path.join(repoRoot, 'node_modules/.bin/nbb-logseq')
  const result = spawnSync(
    nbb,
    [
      '-cp',
      [path.join(repoRoot, 'deps/melange/bridge/src'), bridgeContractRoot].join(
        path.delimiter
      ),
      '-m',
      'common-namespace-package',
    ],
    {
      cwd: path.join(repoRoot, 'deps/melange/bridge'),
      encoding: 'utf8',
    }
  )

  assert.equal(
    result.status,
    0,
    [result.stdout, result.stderr].filter(Boolean).join('\n')
  )
})
