package logseq.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant

/**
 * Mock implementation of BlockRepository for testing
 */
class MockBlockRepository : BlockRepository {

    private val blocks = mutableMapOf<String, Block>()
    private val blocksFlow = MutableStateFlow<List<Block>>(emptyList())

    override suspend fun findById(id: String): Block? = blocks[id]

    override suspend fun findAll(): List<Block> = blocks.values.toList()

    override suspend fun findAllPaginated(pagination: Pagination): Page<Block> {
        val allBlocks = blocks.values.toList()
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(allBlocks.size)
        val items = if (startIndex < allBlocks.size) allBlocks.subList(startIndex, endIndex) else emptyList()
        return Page(items, allBlocks.size, endIndex < allBlocks.size)
    }

    override suspend fun save(entity: Block): Block {
        val now = Clock.System.now()
        val savedBlock = entity.copy(updatedAt = now)
        blocks[entity.id] = savedBlock
        updateFlow()
        return savedBlock
    }

    override suspend fun saveAll(entities: List<Block>): List<Block> {
        val now = Clock.System.now()
        val savedBlocks = entities.map { it.copy(updatedAt = now) }
        savedBlocks.forEach { blocks[it.id] = it }
        updateFlow()
        return savedBlocks
    }

    override suspend fun deleteById(id: String): Boolean {
        val removed = blocks.remove(id) != null
        if (removed) updateFlow()
        return removed
    }

    override suspend fun delete(entity: Block): Boolean = deleteById(entity.id)

    override suspend fun existsById(id: String): Boolean = blocks.containsKey(id)

    override suspend fun count(): Long = blocks.size.toLong()

    override suspend fun findChildren(parentId: String, pagination: Pagination): Page<Block> {
        val children = blocks.values.filter { it.parentId == parentId }
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(children.size)
        val items = if (startIndex < children.size) children.subList(startIndex, endIndex) else emptyList()
        return Page(items, children.size, endIndex < children.size)
    }

    override suspend fun findSiblings(blockId: String): List<Block> {
        val block = blocks[blockId] ?: return emptyList()
        return blocks.values.filter { it.id != blockId && it.parentId == block.parentId }
    }

    override suspend fun findAncestors(blockId: String): List<Block> {
        val ancestors = mutableListOf<Block>()
        var currentId = blocks[blockId]?.parentId
        while (currentId != null) {
            val parent = blocks[currentId]
            if (parent != null) {
                ancestors.add(parent)
                currentId = parent.parentId
            } else {
                break
            }
        }
        return ancestors.reversed()
    }

    override suspend fun findDescendants(blockId: String, maxDepth: Int?): List<Block> {
        val descendants = mutableListOf<Block>()
        val visited = mutableSetOf<String>()
        val queue = ArrayDeque<Pair<String, Int>>()

        queue.add(blockId to 0)
        visited.add(blockId)

        while (queue.isNotEmpty()) {
            val (currentId, depth) = queue.removeFirst()
            if (maxDepth != null && depth >= maxDepth) continue

            blocks.values.filter { it.parentId == currentId && !visited.contains(it.id) }.forEach { child ->
                descendants.add(child)
                visited.add(child.id)
                queue.add(child.id to (depth + 1))
            }
        }

        return descendants
    }

    override suspend fun findRootBlocks(pageId: String, pagination: Pagination): Page<Block> {
        val rootBlocks = blocks.values.filter { it.pageId == pageId && it.parentId == null }
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(rootBlocks.size)
        val items = if (startIndex < rootBlocks.size) rootBlocks.subList(startIndex, endIndex) else emptyList()
        return Page(items, rootBlocks.size, endIndex < rootBlocks.size)
    }

    override suspend fun search(criteria: BlockSearchCriteria, pagination: Pagination): Page<Block> {
        var filteredBlocks = blocks.values.asSequence()

        criteria.query?.let { query ->
            filteredBlocks = filteredBlocks.filter { it.content.contains(query, ignoreCase = true) }
        }

        criteria.pageId?.let { pageId ->
            filteredBlocks = filteredBlocks.filter { it.pageId == pageId }
        }

        criteria.parentId?.let { parentId ->
            filteredBlocks = filteredBlocks.filter { it.parentId == parentId }
        }

        criteria.collapsed?.let { collapsed ->
            filteredBlocks = filteredBlocks.filter { it.collapsed == collapsed }
        }

        val result = filteredBlocks.toList()
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(result.size)
        val items = if (startIndex < result.size) result.subList(startIndex, endIndex) else emptyList()
        return Page(items, result.size, endIndex < result.size)
    }

    override suspend fun searchByContent(query: String, pagination: Pagination): Page<Block> =
        search(BlockSearchCriteria(query = query), pagination)

    override suspend fun searchByProperties(properties: Map<String, Any>, pagination: Pagination): Page<Block> {
        val filteredBlocks = blocks.values.filter { block ->
            properties.all { (key, value) -> block.properties[key] == value }
        }
        val startIndex = pagination.offset
        val endIndex = (startIndex + pagination.limit).coerceAtMost(filteredBlocks.size)
        val items = if (startIndex < filteredBlocks.size) filteredBlocks.subList(startIndex, endIndex) else emptyList()
        return Page(items, filteredBlocks.size, endIndex < filteredBlocks.size)
    }

    override suspend fun findReferences(blockId: String): List<Block> {
        // Mock implementation - in real implementation, this would search for block references
        return emptyList()
    }

    override suspend fun findBackReferences(blockId: String): List<Block> {
        // Mock implementation - in real implementation, this would search for backlinks
        return emptyList()
    }

    override suspend fun findBlocksByPage(pageId: String, pagination: Pagination): Page<Block> =
        search(BlockSearchCriteria(pageId = pageId), pagination)

    override suspend fun countBlocksByPage(pageId: String): Long =
        blocks.values.count { it.pageId == pageId }.toLong()

    override suspend fun updateParent(blockIds: List<String>, newParentId: String?): List<Block> {
        val updatedBlocks = mutableListOf<Block>()
        blockIds.forEach { blockId ->
            blocks[blockId]?.let { block ->
                val updated = block.copy(parentId = newParentId, updatedAt = Clock.System.now())
                blocks[blockId] = updated
                updatedBlocks.add(updated)
            }
        }
        updateFlow()
        return updatedBlocks
    }

    override suspend fun moveBlocks(blockIds: List<String>, targetParentId: String?, targetLeftId: String?): List<Block> {
        // Simplified implementation
        return updateParent(blockIds, targetParentId)
    }

    override suspend fun collapseBlocks(blockIds: List<String>, collapsed: Boolean): List<Block> {
        val updatedBlocks = mutableListOf<Block>()
        blockIds.forEach { blockId ->
            blocks[blockId]?.let { block ->
                val updated = block.copy(collapsed = collapsed, updatedAt = Clock.System.now())
                blocks[blockId] = updated
                updatedBlocks.add(updated)
            }
        }
        updateFlow()
        return updatedBlocks
    }

    override suspend fun updateProperties(blockId: String, properties: Map<String, Any>): Block? {
        return blocks[blockId]?.let { block ->
            val updated = block.copy(properties = block.properties + properties, updatedAt = Clock.System.now())
            blocks[blockId] = updated
            updateFlow()
            updated
        }
    }

    override suspend fun getProperties(blockId: String): Map<String, Any> =
        blocks[blockId]?.properties ?: emptyMap()

    override fun observeBlock(blockId: String): Flow<Block?> =
        flowOf(blocks[blockId])

    override fun observeBlocksByPage(pageId: String): Flow<List<Block>> =
        flowOf(blocks.values.filter { it.pageId == pageId })

    override fun observeSearchResults(criteria: BlockSearchCriteria): Flow<List<Block>> =
        flowOf(search(criteria, Pagination()).items)

    private fun updateFlow() {
        blocksFlow.value = blocks.values.toList()
    }
}