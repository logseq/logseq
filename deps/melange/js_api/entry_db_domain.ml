module Asset = struct
  let checksumValue = Melange_db_api.Workflows.Asset.checksumValue
  let digestHex = Melange_db_api.Workflows.Asset.digestHex
  let nameTitle = Melange_db_api.Workflows.Asset.nameTitle
  let pathType = Melange_db_api.Workflows.Asset.pathType
end

module Bidirectional = struct
  let getPropertiesWith =
    Melange_db_api.Workflows.Bidirectional.getPropertiesWith
end

module BlockTitle = struct
  let uniqueTitleWith =
    Melange_db_api.Workflows.BlockTitle.uniqueTitleWith
end

module ClassCatalog = struct
  let blockKindTags =
    Melange_db_api.Workflows.ClassCatalog.blockKindTags

  let disallowedInlineTags =
    Melange_db_api.Workflows.ClassCatalog.disallowedInlineTags

  let entries = Melange_db_api.Workflows.ClassCatalog.entries

  let extendsHiddenTags =
    Melange_db_api.Workflows.ClassCatalog.extendsHiddenTags

  let hiddenTags = Melange_db_api.Workflows.ClassCatalog.hiddenTags

  let internalTags =
    Melange_db_api.Workflows.ClassCatalog.internalTags

  let pageChildrenClasses =
    Melange_db_api.Workflows.ClassCatalog.pageChildrenClasses

  let pageClasses = Melange_db_api.Workflows.ClassCatalog.pageClasses
  let privateTags = Melange_db_api.Workflows.ClassCatalog.privateTags
end

module ClassRead = struct
  let extendsEntitiesCheckedWith =
    Melange_db_api.Workflows.ClassRead.extendsEntitiesCheckedWith

  let logseqClassValueWith =
    Melange_db_api.Workflows.ClassRead.logseqClassValueWith

  let objectsWith = Melange_db_api.Workflows.ClassRead.objectsWith

  let structuredChildren =
    Melange_db_api.Workflows.ClassRead.structuredChildren

  let userClassNamespace =
    Melange_db_api.Workflows.ClassRead.userClassNamespace
end

module ClassWorkflow = struct
  let buildNew =
    Melange_db_api.Workflows.ClassWorkflow.buildNew

  let createUserIdent =
    Melange_db_api.Workflows.ClassWorkflow.createUserIdent

end

module ContentWorkflow = struct
  let containsUuidRefWith =
    Melange_db_api.Workflows.ContentWorkflow.containsUuidRefWith

  let contentIdRefToPageWith =
    Melange_db_api.Workflows.ContentWorkflow.contentIdRefToPageWith

  let idRefToTitleRefWith =
    Melange_db_api.Workflows.ContentWorkflow.idRefToTitleRefWith

  let matchedIdsWith =
    Melange_db_api.Workflows.ContentWorkflow.matchedIdsWith

  let replaceTagRefsWithPageRefsWith =
    Melange_db_api.Workflows.ContentWorkflow
    .replaceTagRefsWithPageRefsWith

  let replaceTagsWithIdRefsWith =
    Melange_db_api.Workflows.ContentWorkflow.replaceTagsWithIdRefsWith

  let replaceTitleRefsWith =
    Melange_db_api.Workflows.ContentWorkflow.replaceTitleRefsWith

  let replaceUuidInBlockTitleWith =
    Melange_db_api.Workflows.ContentWorkflow
    .replaceUuidInBlockTitleWith

  let updateBlockContentWith =
    Melange_db_api.Workflows.ContentWorkflow.updateBlockContentWith
end

module CoreRead = struct
  let aliasSourcePageWith =
    Melange_db_api.Workflows.CoreRead.aliasSourcePageWith

  let allPagesWith = Melange_db_api.Workflows.CoreRead.allPagesWith

  let allTaggedPagesWith =
    Melange_db_api.Workflows.CoreRead.allTaggedPagesWith

  let casePageByReferenceWith =
    Melange_db_api.Workflows.CoreRead.casePageByReferenceWith

  let hasChildrenByReferenceWith =
    Melange_db_api.Workflows.CoreRead.hasChildrenByReferenceWith

  let hiddenOrInternalTagWith =
    Melange_db_api.Workflows.CoreRead.hiddenOrInternalTagWith

  let journalPageByDatabaseWith =
    Melange_db_api.Workflows.CoreRead.journalPageByDatabaseWith

  let journalPageByDayInputWith =
    Melange_db_api.Workflows.CoreRead.journalPageByDayInputWith

  let keyValueWith = Melange_db_api.Workflows.CoreRead.keyValueWith

  let lastChildBlockWith =
    Melange_db_api.Workflows.CoreRead.lastChildBlockWith

  let lastDirectChildIdWith =
    Melange_db_api.Workflows.CoreRead.lastDirectChildIdWith

  let libraryPageWith =
    Melange_db_api.Workflows.CoreRead.libraryPageWith

  let nonConsecutiveBlocksWith =
    Melange_db_api.Workflows.CoreRead.nonConsecutiveBlocksWith

  let optionalKeyValueWith =
    Melange_db_api.Workflows.CoreRead.optionalKeyValueWith

  let orphanedPagesWith =
    Melange_db_api.Workflows.CoreRead.orphanedPagesWith

  let pageAliasSetWith =
    Melange_db_api.Workflows.CoreRead.pageAliasSetWith

  let pageBlocksByPageWith =
    Melange_db_api.Workflows.CoreRead.pageBlocksByPageWith

  let pageBlocksCountWith =
    Melange_db_api.Workflows.CoreRead.pageBlocksCountWith

  let pageByReferenceWith =
    Melange_db_api.Workflows.CoreRead.pageByReferenceWith

  let pageEmptyByReferenceWith =
    Melange_db_api.Workflows.CoreRead.pageEmptyByReferenceWith

  let pageExistsInputWith =
    Melange_db_api.Workflows.CoreRead.pageExistsInputWith

  let pageInLibraryWith =
    Melange_db_api.Workflows.CoreRead.pageInLibraryWith

  let pagesRelationWith =
    Melange_db_api.Workflows.CoreRead.pagesRelationWith

  let pagesWith = Melange_db_api.Workflows.CoreRead.pagesWith
  let parentsWith = Melange_db_api.Workflows.CoreRead.parentsWith

  let sortPageRandomBlocksWith =
    Melange_db_api.Workflows.CoreRead.sortPageRandomBlocksWith
end

module DbIdent = struct
  let createGenerated =
    Melange_db_api.Workflows.DbIdent.createGenerated

  let ensureUniqueWith =
    Melange_db_api.Workflows.DbIdent.ensureUniqueWith

  let normalizeNamePart =
    Melange_db_api.Workflows.DbIdent.normalizeNamePart
end

module DeleteWorkflow = struct
  let cleanupWith =
    Melange_db_api.Workflows.DeleteWorkflow.cleanupWith

  let expandWith = Melange_db_api.Workflows.DeleteWorkflow.expandWith
end

module EntityLookup = struct
  let immutableIdents =
    Melange_db_api.Workflows.EntityLookup.immutableIdents

  let nilIdents = Melange_db_api.Workflows.EntityLookup.nilIdents
end

module EntityLookupWorkflow = struct
  let dbBasedNullableWith =
    Melange_db_api.Workflows.EntityLookupWorkflow.dbBasedNullableWith

  let lookupSafeWith =
    Melange_db_api.Workflows.EntityLookupWorkflow.lookupSafeWith

  let memoizedWith =
    Melange_db_api.Workflows.EntityLookupWorkflow.memoizedWith
end

module EntityRead = struct
  let entityToMapWith =
    Melange_db_api.Workflows.EntityRead.entityToMapWith

  let entityTypesWith =
    Melange_db_api.Workflows.EntityRead.entityTypesWith

  let fieldPresentWith =
    Melange_db_api.Workflows.EntityRead.fieldPresentWith

  let fieldValueWith =
    Melange_db_api.Workflows.EntityRead.fieldValueWith

  let hasTagWith = Melange_db_api.Workflows.EntityRead.hasTagWith
  let hiddenWith = Melange_db_api.Workflows.EntityRead.hiddenWith
  let pageWith = Melange_db_api.Workflows.EntityRead.pageWith

  let pagesByNameWith =
    Melange_db_api.Workflows.EntityRead.pagesByNameWith

  let recycledWith = Melange_db_api.Workflows.EntityRead.recycledWith
end

module FrontendRead = struct
  let allPropertiesWith =
    Melange_db_api.Workflows.FrontendRead.allPropertiesWith

  let builtInClassProperty =
    Melange_db_api.Workflows.FrontendRead.builtInClassProperty

  let builtInPageNullableWith =
    Melange_db_api.Workflows.FrontendRead.builtInPageNullableWith

  let classIdentByDisplayType =
    Melange_db_api.Workflows.FrontendRead.classIdentByDisplayType

  let classInstanceWith =
    Melange_db_api.Workflows.FrontendRead.classInstanceWith

  let classTitleWithExtends =
    Melange_db_api.Workflows.FrontendRead.classTitleWithExtends

  let classesParentsWith =
    Melange_db_api.Workflows.FrontendRead.classesParentsWith

  let displayTypeByClassIdent =
    Melange_db_api.Workflows.FrontendRead.displayTypeByClassIdent

  let inlineTag = Melange_db_api.Workflows.FrontendRead.inlineTag
  let library = Melange_db_api.Workflows.FrontendRead.library

  let nodeDisplayTypeClasses =
    Melange_db_api.Workflows.FrontendRead.nodeDisplayTypeClasses

  let pageParentsWith =
    Melange_db_api.Workflows.FrontendRead.pageParentsWith

  let privateBuiltInPage =
    Melange_db_api.Workflows.FrontendRead.privateBuiltInPage

  let titleWithParentsWith =
    Melange_db_api.Workflows.FrontendRead.titleWithParentsWith
end

module InitialDataWorkflow = struct
  let blockAndChildrenWith =
    Melange_db_api.Workflows.InitialDataWorkflow.blockAndChildrenWith

  let getWith = Melange_db_api.Workflows.InitialDataWorkflow.getWith

  let withParentWith =
    Melange_db_api.Workflows.InitialDataWorkflow.withParentWith
end

module InitialRead = struct
  let blockAliasesWith =
    Melange_db_api.Workflows.InitialRead.blockAliasesWith

  let blockRefsCountWith =
    Melange_db_api.Workflows.InitialRead.blockRefsCountWith

  let blockRefsWith =
    Melange_db_api.Workflows.InitialRead.blockRefsWith

  let childrenEntitiesWith =
    Melange_db_api.Workflows.InitialRead.childrenEntitiesWith

  let childrenIdsWith =
    Melange_db_api.Workflows.InitialRead.childrenIdsWith

  let fullChildrenWith =
    Melange_db_api.Workflows.InitialRead.fullChildrenWith

  let latestJournalsNowWith =
    Melange_db_api.Workflows.InitialRead.latestJournalsNowWith

  let oldestPageByNameInputWith =
    Melange_db_api.Workflows.InitialRead.oldestPageByNameInputWith

  let oldestPageByTitle =
    Melange_db_api.Workflows.InitialRead.oldestPageByTitle

  let recentPagesNullableWith =
    Melange_db_api.Workflows.InitialRead.recentPagesNullableWith
end

module InputWorkflow = struct
  let resolveWith = Melange_db_api.Workflows.InputWorkflow.resolveWith
end

module KvEntity = struct
  let entries = Melange_db_api.Workflows.KvEntity.entries
end

module NormalizePlan = struct
  let normalizeDatomWith =
    Melange_db_api.Workflows.NormalizePlan.normalizeDatomWith

  let normalizeTxDataWith =
    Melange_db_api.Workflows.NormalizePlan.normalizeTxDataWith

  let removeConflictDatomsWith =
    Melange_db_api.Workflows.NormalizePlan.removeConflictDatomsWith

  let removeRetractEntityRefsWith =
    Melange_db_api.Workflows.NormalizePlan.removeRetractEntityRefsWith

  let reorderRetractEntityWith =
    Melange_db_api.Workflows.NormalizePlan.reorderRetractEntityWith

  let replaceAttrRetractV2With =
    Melange_db_api.Workflows.NormalizePlan.replaceAttrRetractV2With

  let replaceAttrRetractWith =
    Melange_db_api.Workflows.NormalizePlan.replaceAttrRetractWith

  let sortDatomsWith =
    Melange_db_api.Workflows.NormalizePlan.sortDatomsWith
end

module Order = struct
  let advanceCellWith = Melange_db_api.Workflows.Order.advanceCellWith

  let advanceTrackedMaxKey =
    Melange_db_api.Workflows.Order.advanceTrackedMaxKey

  let generateKeyWithStateWith =
    Melange_db_api.Workflows.Order.generateKeyWithStateWith

  let generateNKeysWithStateWith =
    Melange_db_api.Workflows.Order.generateNKeysWithStateWith

  let generateTrackedKeyBetween =
    Melange_db_api.Workflows.Order.generateTrackedKeyBetween

  let maxOrderWith = Melange_db_api.Workflows.Order.maxOrderWith
  let nextOrderWith = Melange_db_api.Workflows.Order.nextOrderWith

  let previousOrderWith =
    Melange_db_api.Workflows.Order.previousOrderWith

  let validateOrderKey =
    Melange_db_api.Workflows.Order.validateOrderKey
end

module PropertyBuild = struct
  let buildClosedValueBlockWith =
    Melange_db_api.Workflows.PropertyBuild.buildClosedValueBlockWith

  let buildClosedValuesWith =
    Melange_db_api.Workflows.PropertyBuild.buildClosedValuesWith

  let buildPropertiesWithRefValuesWith =
    Melange_db_api.Workflows.PropertyBuild
    .buildPropertiesWithRefValuesWith

  let buildPropertyValuesWith =
    Melange_db_api.Workflows.PropertyBuild.buildPropertyValuesWith

  let buildValueBlockWith =
    Melange_db_api.Workflows.PropertyBuild.buildValueBlockWith

  let closedValuesToBlocksWith =
    Melange_db_api.Workflows.PropertyBuild.closedValuesToBlocksWith
end

module PropertyCatalog = struct
  let closedValues =
    Melange_db_api.Workflows.PropertyCatalog.closedValues

  let dbAttributeProperties =
    Melange_db_api.Workflows.PropertyCatalog.dbAttributeProperties

  let entries = Melange_db_api.Workflows.PropertyCatalog.entries

  let logseqPropertyNamespaces =
    Melange_db_api.Workflows.PropertyCatalog.logseqPropertyNamespaces

  let privateDbAttributeProperties =
    Melange_db_api.Workflows.PropertyCatalog
    .privateDbAttributeProperties

  let publicBuiltInProperties =
    Melange_db_api.Workflows.PropertyCatalog.publicBuiltInProperties

  let publicDbAttributeProperties =
    Melange_db_api.Workflows.PropertyCatalog
    .publicDbAttributeProperties

  let readOnlyProperties =
    Melange_db_api.Workflows.PropertyCatalog.readOnlyProperties

  let schemaProperties =
    Melange_db_api.Workflows.PropertyCatalog.schemaProperties

  let schemaPropertiesMap =
    Melange_db_api.Workflows.PropertyCatalog.schemaPropertiesMap
end

module PropertyIdentity = struct
  let builtInHasRefValue =
    Melange_db_api.Workflows.PropertyIdentity.builtInHasRefValue

  let builtInI18nKey =
    Melange_db_api.Workflows.PropertyIdentity.builtInI18nKey

  let isInternalProperty =
    Melange_db_api.Workflows.PropertyIdentity.isInternalProperty

  let isLogseqPropertyNamespace =
    Melange_db_api.Workflows.PropertyIdentity
    .isLogseqPropertyNamespace

  let isPluginPropertyNamespace =
    Melange_db_api.Workflows.PropertyIdentity
    .isPluginPropertyNamespace

  let isProperty =
    Melange_db_api.Workflows.PropertyIdentity.isProperty

  let isUserPropertyNamespace =
    Melange_db_api.Workflows.PropertyIdentity.isUserPropertyNamespace

  let validPropertyName =
    Melange_db_api.Workflows.PropertyIdentity.validPropertyName
end

module PropertyOrder = struct
  let classOrderedWith =
    Melange_db_api.Workflows.PropertyOrder.classOrderedWith

  let normalizeEntitiesValueWith =
    Melange_db_api.Workflows.PropertyOrder.normalizeEntitiesValueWith

  let sortEntitiesWith =
    Melange_db_api.Workflows.PropertyOrder.sortEntitiesWith
end

module PropertyScope = struct
  let closedValueByNameNullableWith =
    Melange_db_api.Workflows.PropertyScope
    .closedValueByNameNullableWith

  let closedValuesNullableWith =
    Melange_db_api.Workflows.PropertyScope.closedValuesNullableWith

  let scopedValuesWith =
    Melange_db_api.Workflows.PropertyScope.scopedValuesWith
end

module PropertyShape = struct
  let isMany = Melange_db_api.Workflows.PropertyShape.isMany

  let isPropertyCreatedBlockWith =
    Melange_db_api.Workflows.PropertyShape.isPropertyCreatedBlockWith
end

module PropertyType = struct
  let allRef = Melange_db_api.Workflows.PropertyType.allRef
  let cardinality = Melange_db_api.Workflows.PropertyType.cardinality
  let closedValue = Melange_db_api.Workflows.PropertyType.closedValue

  let defaultValueRef =
    Melange_db_api.Workflows.PropertyType.defaultValueRef

  let infer = Melange_db_api.Workflows.PropertyType.infer

  let internalBuiltIn =
    Melange_db_api.Workflows.PropertyType.internalBuiltIn

  let originalValueRef =
    Melange_db_api.Workflows.PropertyType.originalValueRef

  let propertyValueContent =
    Melange_db_api.Workflows.PropertyType.propertyValueContent

  let textRef = Melange_db_api.Workflows.PropertyType.textRef

  let userAllowedInternal =
    Melange_db_api.Workflows.PropertyType.userAllowedInternal

  let userBuiltIn = Melange_db_api.Workflows.PropertyType.userBuiltIn
  let userRef = Melange_db_api.Workflows.PropertyType.userRef
  let valueRef = Melange_db_api.Workflows.PropertyType.valueRef
  let withDb = Melange_db_api.Workflows.PropertyType.withDb
end

module PropertyWorkflow = struct
  let blockValueWith =
    Melange_db_api.Workflows.PropertyWorkflow.blockValueWith

  let builtInDisplayTitleWith =
    Melange_db_api.Workflows.PropertyWorkflow.builtInDisplayTitleWith

  let contentWith =
    Melange_db_api.Workflows.PropertyWorkflow.contentWith

  let createUserIdent =
    Melange_db_api.Workflows.PropertyWorkflow.createUserIdent

  let lookupWith =
    Melange_db_api.Workflows.PropertyWorkflow.lookupWith

  let propertiesWith =
    Melange_db_api.Workflows.PropertyWorkflow.propertiesWith

  let publicBuiltInWith =
    Melange_db_api.Workflows.PropertyWorkflow.publicBuiltInWith

  let schemaWith =
    Melange_db_api.Workflows.PropertyWorkflow.schemaWith
end

module ReferenceFilter = struct
  let unlinkedWith =
    Melange_db_api.Workflows.ReferenceFilter.unlinkedWith
end

module ReferenceWorkflow = struct
  let filtersWith =
    Melange_db_api.Workflows.ReferenceWorkflow.filtersWith

  let linkedWith =
    Melange_db_api.Workflows.ReferenceWorkflow.linkedWith
end

module Rules = struct
  let dbQueryDslEntries =
    Melange_db_api.Workflows.Rules.dbQueryDslEntries

  let dependencyEntries =
    Melange_db_api.Workflows.Rules.dependencyEntries

  let entries = Melange_db_api.Workflows.Rules.entries
  let extractWith = Melange_db_api.Workflows.Rules.extractWith

  let fullDependencies =
    Melange_db_api.Workflows.Rules.fullDependencies
end

module Schema = struct
  let cardManyAttributes =
    Melange_db_api.Workflows.Schema.cardManyAttributes

  let cardManyRefTypeAttributes =
    Melange_db_api.Workflows.Schema.cardManyRefTypeAttributes

  let cardOneRefTypeAttributes =
    Melange_db_api.Workflows.Schema.cardOneRefTypeAttributes

  let dbNonRefAttributes =
    Melange_db_api.Workflows.Schema.dbNonRefAttributes

  let entries = Melange_db_api.Workflows.Schema.entries

  let refTypeAttributes =
    Melange_db_api.Workflows.Schema.refTypeAttributes

  let retractAttributes =
    Melange_db_api.Workflows.Schema.retractAttributes
end

module SchemaVersion = struct
  let compareValuesWith =
    Melange_db_api.Workflows.SchemaVersion.compareValuesWith

  let decodeValueWith =
    Melange_db_api.Workflows.SchemaVersion.decodeValueWith

  let stringValueWith =
    Melange_db_api.Workflows.SchemaVersion.stringValueWith

  let valueIsVersionWith =
    Melange_db_api.Workflows.SchemaVersion.valueIsVersionWith

  let version = Melange_db_api.Workflows.SchemaVersion.version
end

module SqliteBuild = struct
  let blockPropertyValueWith =
    Melange_db_api.Workflows.SqliteBuild.blockPropertyValueWith

  let extractBlocksWith =
    Melange_db_api.Workflows.SqliteBuild.extractBlocksWith

  let getUsedPropertiesWith =
    Melange_db_api.Workflows.SqliteBuild.getUsedPropertiesWith

  let nextTempId = Melange_db_api.Workflows.SqliteBuild.nextTempId

  let pagePropertyValueWith =
    Melange_db_api.Workflows.SqliteBuild.pagePropertyValueWith

  let updateBlocksWith =
    Melange_db_api.Workflows.SqliteBuild.updateBlocksWith
end

module SqliteBuildWorkflow = struct
  let buildBlocksTx =
    Melange_db_api.Workflows.SqliteBuildWorkflow.buildBlocksTx

  let createBlocksInput =
    Melange_db_api.Workflows.SqliteBuildWorkflow.createBlocksInput

  let validateOptionsWith =
    Melange_db_api.Workflows.SqliteBuildWorkflow.validateOptionsWith
end

module SqliteCliWorkflow = struct
  let newStorageWith =
    Melange_db_api.Workflows.SqliteCliWorkflow.newStorageWith

  let openArgsWith =
    Melange_db_api.Workflows.SqliteCliWorkflow.openArgsWith

  let openStorageConnectionWith =
    Melange_db_api.Workflows.SqliteCliWorkflow
    .openStorageConnectionWith

  let openStorageWith =
    Melange_db_api.Workflows.SqliteCliWorkflow.openStorageWith
end

module SqliteCreateGraph = struct
  let buildInitialClassesWith =
    Melange_db_api.Workflows.SqliteCreateGraph.buildInitialClassesWith

  let buildInitialData =
    Melange_db_api.Workflows.SqliteCreateGraph.buildInitialData

  let buildInitialViewsWith =
    Melange_db_api.Workflows.SqliteCreateGraph.buildInitialViewsWith

  let buildProperties =
    Melange_db_api.Workflows.SqliteCreateGraph.buildProperties

  let markBuiltInWith =
    Melange_db_api.Workflows.SqliteCreateGraph.markBuiltInWith
end

module SqliteDebugWorkflow = struct
  let findMissingNode =
    Melange_db_api.Workflows.SqliteDebugWorkflow.findMissingNode

  let findMissingWasm =
    Melange_db_api.Workflows.SqliteDebugWorkflow.findMissingWasm

end

module SqliteExport = struct
  let importTransactionDataWith =
    Melange_db_api.Workflows.SqliteExport.importTransactionDataWith

  let sortPagesWith =
    Melange_db_api.Workflows.SqliteExport.sortPagesWith
end

module SqliteExportWorkflow = struct
  let buildExportWith =
    Melange_db_api.Workflows.SqliteExportWorkflow.buildExportWith

  let buildImport =
    Melange_db_api.Workflows.SqliteExportWorkflow.buildImport

  let createSeededConnectionWith =
    Melange_db_api.Workflows.SqliteExportWorkflow
    .createSeededConnectionWith

  let diffExportsWith =
    Melange_db_api.Workflows.SqliteExportWorkflow.diffExportsWith

  let pruneUnreferencedUuidsWith =
    Melange_db_api.Workflows.SqliteExportWorkflow
    .pruneUnreferencedUuidsWith

  let validateImportTransactionsWith =
    Melange_db_api.Workflows.SqliteExportWorkflow
    .validateImportTransactionsWith

  let validateSeededExport =
    Melange_db_api.Workflows.SqliteExportWorkflow.validateSeededExport
end

module SqliteGcWorkflow = struct
  let collectNodeDefault =
    Melange_db_api.Workflows.SqliteGcWorkflow.collectNodeDefault

  let collectWasmDefault =
    Melange_db_api.Workflows.SqliteGcWorkflow.collectWasmDefault

  let ensureNoGarbageDefault =
    Melange_db_api.Workflows.SqliteGcWorkflow.ensureNoGarbageDefault

end

module SqliteLifecycle = struct
  let backupConnection =
    Melange_db_api.Workflows.SqliteLifecycle.backupConnection

  let backupFile = Melange_db_api.Workflows.SqliteLifecycle.backupFile

  let storageConnection =
    Melange_db_api.Workflows.SqliteLifecycle.storageConnection
end

module SqlitePolicy = struct
  let dbBasedGraphNullable =
    Melange_db_api.Workflows.SqlitePolicy.dbBasedGraphNullable

  let sanitizeDbName =
    Melange_db_api.Workflows.SqlitePolicy.sanitizeDbName
end

module SqliteUtil = struct
  let buildClassWith =
    Melange_db_api.Workflows.SqliteUtil.buildClassWith

  let buildPageWith =
    Melange_db_api.Workflows.SqliteUtil.buildPageWith

  let buildProperty =
    Melange_db_api.Workflows.SqliteUtil.buildProperty

  let importTxWith = Melange_db_api.Workflows.SqliteUtil.importTxWith
  let kvWith = Melange_db_api.Workflows.SqliteUtil.kvWith
end

module TransactionExecution = struct
  let batchWith =
    Melange_db_api.Workflows.TransactionExecution.batchWith

  let batchWithTemp =
    Melange_db_api.Workflows.TransactionExecution.batchWithTemp

  let transactOwnedWith =
    Melange_db_api.Workflows.TransactionExecution.transactOwnedWith
end

module TransactionPolicy = struct
  let favorite = Melange_db_api.Workflows.TransactionPolicy.favorite
end

module TransactionRuntime = struct
  let invalidCallback =
    Melange_db_api.Workflows.TransactionRuntime.invalidCallback

  let pipelineCallback =
    Melange_db_api.Workflows.TransactionRuntime.pipelineCallback

  let registerInvalidCallback =
    Melange_db_api.Workflows.TransactionRuntime
    .registerInvalidCallback

  let registerPipeline =
    Melange_db_api.Workflows.TransactionRuntime.registerPipeline

  let registerTransact =
    Melange_db_api.Workflows.TransactionRuntime.registerTransact

  let transactCallback =
    Melange_db_api.Workflows.TransactionRuntime.transactCallback
end

module TransactionWorkflow = struct
  let replaceEntities =
    Melange_db_api.Workflows.TransactionWorkflow.replaceEntities
end

module TreeWorkflow = struct
  let blockAndChildrenWith =
    Melange_db_api.Workflows.TreeWorkflow.blockAndChildrenWith

  let childrenByReferenceWith =
    Melange_db_api.Workflows.TreeWorkflow.childrenByReferenceWith

  let firstChildOfWith =
    Melange_db_api.Workflows.TreeWorkflow.firstChildOfWith

  let firstChildWith =
    Melange_db_api.Workflows.TreeWorkflow.firstChildWith

  let siblingWith = Melange_db_api.Workflows.TreeWorkflow.siblingWith
  let sortWith = Melange_db_api.Workflows.TreeWorkflow.sortWith
end

module ValidationDatabase = struct
  let graphCountsWith =
    Melange_db_api.Workflows.ValidationDatabase.graphCountsWith
end

module ValidationDatom = struct
  let entitiesWith =
    Melange_db_api.Workflows.ValidationDatom.entitiesWith

  let entityMapsWith =
    Melange_db_api.Workflows.ValidationDatom.entityMapsWith
end

module ValidationEntity = struct
  let dispatchWith =
    Melange_db_api.Workflows.ValidationEntity.dispatchWith
end

module ValidationIdentity = struct
  let isClassIdent =
    Melange_db_api.Workflows.ValidationIdentity.isClassIdent

  let isInternalIdent =
    Melange_db_api.Workflows.ValidationIdentity.isInternalIdent

  let isUserPropertyIdent =
    Melange_db_api.Workflows.ValidationIdentity.isUserPropertyIdent
end

module ValidationProperty = struct
  let errorMessage =
    Melange_db_api.Workflows.ValidationProperty.errorMessage

  let prepareEntitiesWith =
    Melange_db_api.Workflows.ValidationProperty.prepareEntitiesWith

  let requiredProperties =
    Melange_db_api.Workflows.ValidationProperty.requiredProperties

  let validatePropertyValueWith =
    Melange_db_api.Workflows.ValidationProperty
    .validatePropertyValueWith

  let valueValidWith =
    Melange_db_api.Workflows.ValidationProperty.valueValidWith
end

module ValidationSchema = struct
  let validateDatabaseWith =
    Melange_db_api.Workflows.ValidationSchema.validateDatabaseWith

  let validateEntityWith =
    Melange_db_api.Workflows.ValidationSchema.validateEntityWith

  let validateLocalDatabaseAndLogWith =
    Melange_db_api.Workflows.ValidationSchema
    .validateLocalDatabaseAndLogWith

  let validateTransactionWith =
    Melange_db_api.Workflows.ValidationSchema.validateTransactionWith
end

module ViewDataWorkflow = struct
  let getPropertyValuesWith =
    Melange_db_api.Workflows.ViewDataWorkflow.getPropertyValuesWith

  let getWith = Melange_db_api.Workflows.ViewDataWorkflow.getWith
end

module ViewPropertyValues = struct
  let contentWith =
    Melange_db_api.Workflows.ViewPropertyValues.contentWith
end

module ViewWorkflow = struct
  let propertyValueForSearchWith =
    Melange_db_api.Workflows.ViewWorkflow.propertyValueForSearchWith
end
