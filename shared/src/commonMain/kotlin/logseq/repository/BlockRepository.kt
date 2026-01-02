package logseq.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.Instant

/**
 * Represents a block entity in Logseq's data model
 */
data class Block(
    val id: String,
    val uuid: String,
    val content: String,
    val pageId: String?,
    val parentId: String?,
    val leftId: String?,
    val properties: Map<String, Any> = emptyMap(),
    val createdAt: Instant,
    val updatedAt: Instant,
    val collapsed: Boolean = false,
    val level: Int = 1
)

/**
 * Search criteria for block queries
 */
data class BlockSearchCriteria(
    val query: String? = null,
    val pageId: String? = null,
    val parentId: String? = null,
    val properties: Map<String, Any> = emptyMap(),
    val createdAfter: Instant? = null,
    val createdBefore: Instant? = null,
    val updatedAfter: Instant? = null,
    val updatedBefore: Instant? = null,
    val collapsed: Boolean? = null
)

/**
 * Block repository interface for CRUD operations and hierarchical queries
 */
interface BlockRepository : BaseRepository<Block, String> {

    // CRUD operations (inherited from BaseRepository)

    // Hierarchical queries
    suspend fun findChildren(parentId: String, pagination: Pagination = Pagination()): Page<Block>
    suspend fun findSiblings(blockId: String): List<Block>
    suspend fun findAncestors(blockId: String): List<Block>
    suspend fun findDescendants(blockId: String, maxDepth: Int? = null): List<Block>
    suspend fun findRootBlocks(pageId: String, pagination: Pagination = Pagination()): Page<Block>

    // Search operations
    suspend fun search(criteria: BlockSearchCriteria, pagination: Pagination = Pagination()): Page<Block>
    suspend fun searchByContent(query: String, pagination: Pagination = Pagination()): Page<Block>
    suspend fun searchByProperties(properties: Map<String, Any>, pagination: Pagination = Pagination()): Page<Block>

    // Reference queries
    suspend fun findReferences(blockId: String): List<Block>
    suspend fun findBackReferences(blockId: String): List<Block>

    // Page-related queries
    suspend fun findBlocksByPage(pageId: String, pagination: Pagination = Pagination()): Page<Block>
    suspend fun countBlocksByPage(pageId: String): Long

    // Bulk operations
    suspend fun updateParent(blockIds: List<String>, newParentId: String?): List<Block>
    suspend fun moveBlocks(blockIds: List<String>, targetParentId: String?, targetLeftId: String?): List<Block>
    suspend fun collapseBlocks(blockIds: List<String>, collapsed: Boolean): List<Block>

    // Property operations
    suspend fun updateProperties(blockId: String, properties: Map<String, Any>): Block?
    suspend fun getProperties(blockId: String): Map<String, Any>

    // Flow-based operations for reactive updates
    fun observeBlock(blockId: String): Flow<Block?>
    fun observeBlocksByPage(pageId: String): Flow<List<Block>>
    fun observeSearchResults(criteria: BlockSearchCriteria): Flow<List<Block>>
}