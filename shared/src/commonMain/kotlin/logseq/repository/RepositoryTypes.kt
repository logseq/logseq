package logseq.repository

import kotlinx.coroutines.flow.Flow

/**
 * Common data types for repository operations
 */
data class Pagination(
    val offset: Int = 0,
    val limit: Int = 50
)

data class Page<T>(
    val items: List<T>,
    val totalCount: Int,
    val hasNextPage: Boolean = false
)

/**
 * Base repository interface providing common operations
 */
interface BaseRepository<T, ID> {
    suspend fun findById(id: ID): T?
    suspend fun findAll(): List<T>
    suspend fun findAllPaginated(pagination: Pagination = Pagination()): Page<T>
    suspend fun save(entity: T): T
    suspend fun saveAll(entities: List<T>): List<T>
    suspend fun deleteById(id: ID): Boolean
    suspend fun delete(entity: T): Boolean
    suspend fun existsById(id: ID): Boolean
    suspend fun count(): Long
}