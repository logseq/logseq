package logseq.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant

/**
 * Mock implementation of PageRepository for testing.
 * Provides basic CRUD operations with simplified implementations for common use cases.
 */
class MockPageRepository : PageRepository {

    private val pages = mutableMapOf<String, logseq.repository.Page>()

    override suspend fun findById(id: String): logseq.repository.Page? = pages[id]

    override suspend fun findAll(): List<logseq.repository.Page> = pages.values.toList()

    override suspend fun findAllPaginated(pagination: Pagination): Page<logseq.repository.Page> {
        val allPages = pages.values.toList()
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(allPages.size)
        val items = if (startIndex < allPages.size) allPages.subList(startIndex, endIndex) else emptyList()
        return Page(items, allPages.size, endIndex < allPages.size)
    }

    override suspend fun save(entity: logseq.repository.Page): logseq.repository.Page {
        val now = Clock.System.now()
        val savedPage = entity.copy(updatedAt = now)
        pages[entity.id] = savedPage
        return savedPage
    }

    override suspend fun saveAll(entities: List<logseq.repository.Page>): List<logseq.repository.Page> {
        val now = Clock.System.now()
        val savedPages = entities.map { it.copy(updatedAt = now) }
        savedPages.forEach { pages[it.id] = it }
        return savedPages
    }

    override suspend fun deleteById(id: String): Boolean {
        return pages.remove(id) != null
    }

    override suspend fun delete(entity: logseq.repository.Page): Boolean = deleteById(entity.id)

    override suspend fun existsById(id: String): Boolean = pages.containsKey(id)

    override suspend fun count(): Long = pages.size.toLong()

    override suspend fun findByName(name: String): logseq.repository.Page? =
        pages.values.find { it.name == name }

    override suspend fun findByOriginalName(originalName: String): logseq.repository.Page? =
        pages.values.find { it.originalName == originalName }

    override suspend fun findByNamespace(namespace: List<String>): logseq.repository.Page? =
        pages.values.find { it.namespace == namespace }

    override suspend fun existsByName(name: String): Boolean =
        pages.values.any { it.name == name }

    override suspend fun findJournals(pagination: Pagination): Page<logseq.repository.Page> {
        val journals = pages.values.filter { it.journalDay != null }.sortedByDescending { it.journalDay }
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(journals.size)
        val items = if (startIndex < journals.size) journals.subList(startIndex, endIndex) else emptyList()
        return Page(items, journals.size, endIndex < journals.size)
    }

    override suspend fun findJournalByDay(day: Int): logseq.repository.Page? =
        pages.values.find { it.journalDay == day }

    override suspend fun findJournalsInRange(startDay: Int, endDay: Int): List<logseq.repository.Page> =
        pages.values.filter { it.journalDay != null && it.journalDay in startDay..endDay }
            .sortedBy { it.journalDay }

    override suspend fun findPagesInNamespace(namespace: String, pagination: Pagination): Page<logseq.repository.Page> {
        val namespacePages = pages.values.filter { it.namespace.contains(namespace) }
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(namespacePages.size)
        val items = if (startIndex < namespacePages.size) namespacePages.subList(startIndex, endIndex) else emptyList()
        return Page(items, namespacePages.size, endIndex < namespacePages.size)
    }

    override suspend fun findChildPages(parentPageId: String, pagination: Pagination): Page<logseq.repository.Page> {
        // Simplified implementation - return empty for mock
        return Page(emptyList(), 0, false)
    }

    override suspend fun findParentPages(childPageId: String): List<logseq.repository.Page> {
        // Simplified implementation - return empty for mock
        return emptyList()
    }

    override suspend fun search(criteria: PageSearchCriteria, pagination: Pagination): Page<logseq.repository.Page> {
        // Simplified implementation - filter by query only
        val filteredPages = pages.values.filter { page ->
            criteria.query?.let { query -> page.name.contains(query, ignoreCase = true) } ?: true
        }
        val items = filteredPages.drop(pagination.offset).take(pagination.limit)
        return Page(items, filteredPages.size, items.size == pagination.limit)
    }

    override suspend fun searchByName(query: String, pagination: Pagination): Page<logseq.repository.Page> =
        search(PageSearchCriteria(query = query), pagination)

    override suspend fun searchByProperties(properties: Map<String, Any>, pagination: Pagination): Page<logseq.repository.Page> {
        val filteredPages = pages.values.filter { page ->
            properties.all { (key, value) -> page.properties[key] == value }
        }
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(filteredPages.size)
        val items = if (startIndex < filteredPages.size) filteredPages.subList(startIndex, endIndex) else emptyList()
        return Page(items, filteredPages.size, endIndex < filteredPages.size)
    }

    override suspend fun findPagesWithBlocks(blockIds: List<String>): List<logseq.repository.Page> {
        // Mock implementation - in real implementation, this would query block-page relationships
        return emptyList()
    }

    override suspend fun findRecentlyUpdated(pagination: Pagination): Page<logseq.repository.Page> {
        val recentPages = pages.values.sortedByDescending { it.updatedAt }
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(recentPages.size)
        val items = if (startIndex < recentPages.size) recentPages.subList(startIndex, endIndex) else emptyList()
        return Page(items, recentPages.size, endIndex < recentPages.size)
    }

    override suspend fun findRecentlyCreated(pagination: Pagination): Page<logseq.repository.Page> {
        val recentPages = pages.values.sortedByDescending { it.createdAt }
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(recentPages.size)
        val items = if (startIndex < recentPages.size) recentPages.subList(startIndex, endIndex) else emptyList()
        return Page(items, recentPages.size, endIndex < recentPages.size)
    }

    override suspend fun updateProperties(pageId: String, properties: Map<String, Any>): logseq.repository.Page? {
        return pages[pageId]?.let { page ->
            val updated = page.copy(properties = page.properties + properties, updatedAt = Clock.System.now())
            pages[pageId] = updated
            updated
        }
    }

    override suspend fun getProperties(pageId: String): Map<String, Any> =
        pages[pageId]?.properties ?: emptyMap()

    override suspend fun renamePage(pageId: String, newName: String): logseq.repository.Page? {
        return pages[pageId]?.let { page ->
            val updated = page.copy(name = newName, updatedAt = Clock.System.now())
            pages[pageId] = updated
            updateFlow()
            updated
        }
    }

    override suspend fun updateNamespace(pageId: String, newNamespace: List<String>): logseq.repository.Page? {
        return pages[pageId]?.let { page ->
            val updated = page.copy(namespace = newNamespace, updatedAt = Clock.System.now())
            pages[pageId] = updated
            updateFlow()
            updated
        }
    }

    override fun observePage(pageId: String): Flow<logseq.repository.Page?> =
        flowOf(pages[pageId])

    override fun observePagesByNamespace(namespace: String): Flow<List<logseq.repository.Page>> =
        flowOf(emptyList())

    override fun observeRecentlyUpdated(): Flow<List<logseq.repository.Page>> =
        flowOf(emptyList())

    override suspend fun resolvePageName(name: String): String = name

    override suspend fun normalizePageName(name: String): String = name.lowercase()

    override suspend fun generateUniqueName(baseName: String): String {
        var uniqueName = baseName
        var counter = 1
        while (pages.values.any { it.name == uniqueName }) {
            uniqueName = "$baseName ($counter)"
            counter++
        }
        return uniqueName
    }


}