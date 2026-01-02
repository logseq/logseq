package logseq.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.Instant

/**
 * Represents a page entity in Logseq's data model
 */
data class Page(
    val id: String,
    val uuid: String,
    val name: String,
    val originalName: String,
    val namespace: List<String> = emptyList(),
    val properties: Map<String, Any> = emptyMap(),
    val createdAt: Instant,
    val updatedAt: Instant,
    val journalDay: Int? = null,
    val filePath: String? = null
)

/**
 * Search criteria for page queries
 */
data class PageSearchCriteria(
    val query: String? = null,
    val namespace: String? = null,
    val properties: Map<String, Any> = emptyMap(),
    val createdAfter: Instant? = null,
    val createdBefore: Instant? = null,
    val updatedAfter: Instant? = null,
    val updatedBefore: Instant? = null,
    val isJournal: Boolean? = null
)

/**
 * Page repository interface for page management and name resolution
 */
interface PageRepository : BaseRepository<Page, String> {

    // CRUD operations (inherited from BaseRepository)

    // Name resolution
    suspend fun findByName(name: String): Page?
    suspend fun findByOriginalName(originalName: String): Page?
    suspend fun findByNamespace(namespace: List<String>): Page?
    suspend fun existsByName(name: String): Boolean

    // Journal operations
    suspend fun findJournals(pagination: Pagination = Pagination()): Page<Page>
    suspend fun findJournalByDay(day: Int): Page?
    suspend fun findJournalsInRange(startDay: Int, endDay: Int): List<Page>

    // Namespace operations
    suspend fun findPagesInNamespace(namespace: String, pagination: Pagination = Pagination()): Page<Page>
    suspend fun findChildPages(parentPageId: String, pagination: Pagination = Pagination()): Page<Page>
    suspend fun findParentPages(childPageId: String): List<Page>

    // Search operations
    suspend fun search(criteria: PageSearchCriteria, pagination: Pagination = Pagination()): Page<Page>
    suspend fun searchByName(query: String, pagination: Pagination = Pagination()): Page<Page>
    suspend fun searchByProperties(properties: Map<String, Any>, pagination: Pagination = Pagination()): Page<Page>

    // Content-related queries
    suspend fun findPagesWithBlocks(blockIds: List<String>): List<Page>
    suspend fun findRecentlyUpdated(pagination: Pagination = Pagination()): Page<Page>
    suspend fun findRecentlyCreated(pagination: Pagination = Pagination()): Page<Page>

    // Property operations
    suspend fun updateProperties(pageId: String, properties: Map<String, Any>): Page?
    suspend fun getProperties(pageId: String): Map<String, Any>

    // Bulk operations
    suspend fun renamePage(pageId: String, newName: String): Page?
    suspend fun updateNamespace(pageId: String, newNamespace: List<String>): Page?

    // Flow-based operations for reactive updates
    fun observePage(pageId: String): Flow<Page?>
    fun observePagesByNamespace(namespace: String): Flow<List<Page>>
    fun observeRecentlyUpdated(): Flow<List<Page>>

    // Utility operations
    suspend fun resolvePageName(name: String): String
    suspend fun normalizePageName(name: String): String
    suspend fun generateUniqueName(baseName: String): String
}