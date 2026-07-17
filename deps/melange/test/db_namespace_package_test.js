const assert = require('node:assert/strict')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { createRequire } = require('node:module')
const test = require('node:test')

function findRepoRoot(start) {
  let directory = start
  while (directory !== path.dirname(directory)) {
    if (require('node:fs').existsSync(path.join(directory, 'pnpm-workspace.yaml'))) {
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

const dbBridgeContract = {
  Asset: ['checksumValue', 'digestHex', 'nameTitle', 'pathType'],
  Bidirectional: ['getPropertiesWith'],
  BlockTitle: ['uniqueTitleWith'],
  ClassCatalog: ['blockKindTags', 'disallowedInlineTags', 'entries', 'extendsHiddenTags', 'hiddenTags', 'internalTags', 'pageChildrenClasses', 'pageClasses', 'privateTags'],
  ClassRead: ['extendsEntitiesCheckedWith', 'logseqClassValueWith', 'objectsWith', 'structuredChildren', 'userClassNamespace'],
  ClassWorkflow: ['buildNew', 'createUserIdent'],
  ContentWorkflow: ['containsUuidRefWith', 'contentIdRefToPageWith', 'idRefToTitleRefWith', 'matchedIdsWith', 'replaceTagRefsWithPageRefsWith', 'replaceTagsWithIdRefsWith', 'replaceTitleRefsWith', 'replaceUuidInBlockTitleWith', 'updateBlockContentWith'],
  CoreRead: ['aliasSourcePageWith', 'allPagesWith', 'allTaggedPagesWith', 'casePageByReferenceWith', 'hasChildrenByReferenceWith', 'hiddenOrInternalTagWith', 'journalPageByDatabaseWith', 'journalPageByDayInputWith', 'keyValueWith', 'lastChildBlockWith', 'lastDirectChildIdWith', 'libraryPageWith', 'nonConsecutiveBlocksWith', 'optionalKeyValueWith', 'orphanedPagesWith', 'pageAliasSetWith', 'pageBlocksByPageWith', 'pageBlocksCountWith', 'pageByReferenceWith', 'pageEmptyByReferenceWith', 'pageExistsInputWith', 'pageInLibraryWith', 'pagesRelationWith', 'pagesWith', 'parentsWith', 'sortPageRandomBlocksWith'],
  DbIdent: ['createGenerated', 'ensureUniqueWith', 'normalizeNamePart'],
  DeleteWorkflow: ['cleanupWith', 'expandWith'],
  EntityLookup: ['immutableIdents', 'nilIdents'],
  EntityLookupWorkflow: ['dbBasedNullableWith', 'lookupSafeWith', 'memoizedWith'],
  EntityRead: ['entityToMapWith', 'entityTypesWith', 'fieldPresentWith', 'fieldValueWith', 'hasTagWith', 'hiddenWith', 'pageWith', 'pagesByNameWith', 'recycledWith'],
  FrontendRead: ['allPropertiesWith', 'builtInClassProperty', 'builtInPageNullableWith', 'classIdentByDisplayType', 'classInstanceWith', 'classTitleWithExtends', 'classesParentsWith', 'displayTypeByClassIdent', 'inlineTag', 'library', 'nodeDisplayTypeClasses', 'pageParentsWith', 'privateBuiltInPage', 'titleWithParentsWith'],
  InitialDataWorkflow: ['blockAndChildrenWith', 'getWith', 'withParentWith'],
  InitialRead: ['blockAliasesWith', 'blockRefsCountWith', 'blockRefsWith', 'childrenEntitiesWith', 'childrenIdsWith', 'fullChildrenWith', 'latestJournalsNowWith', 'oldestPageByNameInputWith', 'oldestPageByTitle', 'recentPagesNullableWith'],
  InputWorkflow: ['resolveWith'],
  KvEntity: ['entries'],
  NormalizePlan: ['normalizeDatomWith', 'normalizeTxDataWith', 'removeConflictDatomsWith', 'removeRetractEntityRefsWith', 'reorderRetractEntityWith', 'replaceAttrRetractV2With', 'replaceAttrRetractWith', 'sortDatomsWith'],
  Order: ['advanceCellWith', 'advanceTrackedMaxKey', 'generateKeyWithStateWith', 'generateNKeysWithStateWith', 'generateTrackedKeyBetween', 'maxOrderWith', 'nextOrderWith', 'previousOrderWith', 'validateOrderKey'],
  PropertyBuild: ['buildClosedValueBlockWith', 'buildClosedValuesWith', 'buildPropertiesWithRefValuesWith', 'buildPropertyValuesWith', 'buildValueBlockWith', 'closedValuesToBlocksWith'],
  PropertyCatalog: ['closedValues', 'dbAttributeProperties', 'entries', 'logseqPropertyNamespaces', 'privateDbAttributeProperties', 'publicBuiltInProperties', 'publicDbAttributeProperties', 'readOnlyProperties', 'schemaProperties', 'schemaPropertiesMap'],
  PropertyIdentity: ['builtInHasRefValue', 'builtInI18nKey', 'isInternalProperty', 'isLogseqPropertyNamespace', 'isPluginPropertyNamespace', 'isProperty', 'isUserPropertyNamespace', 'validPropertyName'],
  PropertyOrder: ['classOrderedWith', 'normalizeEntitiesValueWith', 'sortEntitiesWith'],
  PropertyScope: ['closedValueByNameNullableWith', 'closedValuesNullableWith', 'scopedValuesWith'],
  PropertyShape: ['isMany', 'isPropertyCreatedBlockWith'],
  PropertyType: ['allRef', 'cardinality', 'closedValue', 'defaultValueRef', 'infer', 'internalBuiltIn', 'originalValueRef', 'propertyValueContent', 'textRef', 'userAllowedInternal', 'userBuiltIn', 'userRef', 'valueRef', 'withDb'],
  PropertyWorkflow: ['blockValueWith', 'builtInDisplayTitleWith', 'contentWith', 'createUserIdent', 'lookupWith', 'propertiesWith', 'publicBuiltInWith', 'schemaWith'],
  ReferenceFilter: ['unlinkedWith'],
  ReferenceWorkflow: ['filtersWith', 'linkedWith'],
  Rules: ['dbQueryDslEntries', 'dependencyEntries', 'entries', 'extractWith', 'fullDependencies'],
  Schema: ['cardManyAttributes', 'cardManyRefTypeAttributes', 'cardOneRefTypeAttributes', 'dbNonRefAttributes', 'entries', 'refTypeAttributes', 'retractAttributes'],
  SchemaVersion: ['compareValuesWith', 'decodeValueWith', 'stringValueWith', 'valueIsVersionWith', 'version'],
  SqliteBuild: ['blockPropertyValueWith', 'extractBlocksWith', 'getUsedPropertiesWith', 'nextTempId', 'pagePropertyValueWith', 'updateBlocksWith'],
  SqliteBuildWorkflow: ['buildBlocksTx', 'createBlocksInput', 'validateOptionsWith'],
  SqliteCliWorkflow: ['newStorageWith', 'openArgsWith', 'openStorageConnectionWith', 'openStorageWith'],
  SqliteCreateGraph: ['buildInitialClassesWith', 'buildInitialData', 'buildInitialViewsWith', 'buildProperties', 'markBuiltInWith'],
  SqliteDebugWorkflow: ['findMissingNode', 'findMissingWasm'],
  SqliteExport: ['importTransactionDataWith', 'sortPagesWith'],
  SqliteExportWorkflow: ['buildExportWith', 'buildImport', 'createSeededConnectionWith', 'diffExportsWith', 'pruneUnreferencedUuidsWith', 'validateImportTransactionsWith', 'validateSeededExport'],
  SqliteGcWorkflow: ['collectNodeDefault', 'collectWasmDefault', 'ensureNoGarbageDefault'],
  SqliteLifecycle: ['backupConnection', 'backupFile', 'storageConnection'],
  SqlitePolicy: ['dbBasedGraphNullable', 'sanitizeDbName'],
  SqliteUtil: ['buildClassWith', 'buildPageWith', 'buildProperty', 'importTxWith', 'kvWith'],
  TransactionExecution: ['batchWith', 'batchWithTemp', 'transactOwnedWith'],
  TransactionPolicy: ['favorite'],
  TransactionRuntime: ['invalidCallback', 'pipelineCallback', 'registerInvalidCallback', 'registerPipeline', 'registerTransact', 'transactCallback'],
  TransactionWorkflow: ['replaceEntities'],
  TreeWorkflow: ['blockAndChildrenWith', 'childrenByReferenceWith', 'firstChildOfWith', 'firstChildWith', 'siblingWith', 'sortWith'],
  ValidationDatabase: ['graphCountsWith'],
  ValidationDatom: ['entitiesWith', 'entityMapsWith'],
  ValidationEntity: ['dispatchWith'],
  ValidationIdentity: ['isClassIdent', 'isInternalIdent', 'isUserPropertyIdent'],
  ValidationProperty: ['errorMessage', 'prepareEntitiesWith', 'requiredProperties', 'validatePropertyValueWith', 'valueValidWith'],
  ValidationSchema: ['validateDatabaseWith', 'validateEntityWith', 'validateLocalDatabaseAndLogWith', 'validateTransactionWith'],
  ViewDataWorkflow: ['getPropertyValuesWith', 'getWith'],
  ViewPropertyValues: ['contentWith'],
  ViewWorkflow: ['propertyValueForSearchWith'],
}

test('DB package exports exactly the bridge contract', () => {
  const db = consumerRequire('@logseq/melange-js-api/db')
  assert.deepEqual(Object.keys(db).sort(), Object.keys(dbBridgeContract).sort())
  for (const [moduleName, members] of Object.entries(dbBridgeContract)) {
    assert.deepEqual(Object.keys(db[moduleName]).sort(), members)
  }
})

test('DB bridge is callable from static ClojureScript', () => {
  const nbb = path.join(repoRoot, 'node_modules/.bin/nbb-logseq')
  const result = spawnSync(
    nbb,
    [
      '-cp',
      [path.join(repoRoot, 'deps/melange/bridge/src'), bridgeContractRoot].join(path.delimiter),
      '-m',
      'db-namespace-package',
    ],
    {
      cwd: path.join(repoRoot, 'deps/melange/bridge'),
      encoding: 'utf8',
    }
  )

  assert.equal(result.status, 0, [result.stdout, result.stderr].filter(Boolean).join('\n'))
})
