package com.logseq.kmp.repository

import com.logseq.kmp.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class InMemoryPageRepository : PageRepository {
    private val pages = MutableStateFlow<List<Page>>(emptyList())

    override fun getAllPages(): Flow<List<Page>> = pages.asStateFlow()

    override fun getPageById(id: Long): Flow<Page?> {
        val pageFlow = MutableStateFlow<Page?>(null)
        pages.value.find { it.id == id }?.let { pageFlow.value = it }
        return pageFlow.asStateFlow()
    }

    override suspend fun savePage(page: Page): Result<Unit> {
        val currentPages = pages.value.toMutableList()
        val existingIndex = currentPages.indexOfFirst { it.id == page.id }
        if (existingIndex >= 0) {
            currentPages[existingIndex] = page
        } else {
            currentPages.add(page)
        }
        pages.value = currentPages
        return Result.success(Unit)
    }

    override suspend fun deletePage(id: Long): Result<Unit> {
        val currentPages = pages.value.toMutableList()
        currentPages.removeIf { it.id == id }
        pages.value = currentPages
        return Result.success(Unit)
    }
}

class InMemoryBlockRepository : BlockRepository {
    private val blocks = MutableStateFlow<List<Block>>(emptyList())

    override fun getBlocksForPage(pageId: Long): Flow<List<Block>> {
        val blocksFlow = MutableStateFlow<List<Block>>(emptyList())
        blocksFlow.value = blocks.value.filter { it.pageId == pageId }
        return blocksFlow.asStateFlow()
    }

    override fun getBlockById(id: Long): Flow<Block?> {
        val blockFlow = MutableStateFlow<Block?>(null)
        blockFlow.value = blocks.value.find { it.id == id }
        return blockFlow.asStateFlow()
    }

    override suspend fun saveBlock(block: Block): Result<Unit> {
        val currentBlocks = blocks.value.toMutableList()
        val existingIndex = currentBlocks.indexOfFirst { it.id == block.id }
        if (existingIndex >= 0) {
            currentBlocks[existingIndex] = block
        } else {
            currentBlocks.add(block)
        }
        blocks.value = currentBlocks
        return Result.success(Unit)
    }

    override suspend fun deleteBlock(id: Long): Result<Unit> {
        val currentBlocks = blocks.value.toMutableList()
        currentBlocks.removeIf { it.id == id }
        blocks.value = currentBlocks
        return Result.success(Unit)
    }
}

class InMemoryPropertyRepository : PropertyRepository {
    private val properties = MutableStateFlow<List<Property>>(emptyList())

    override fun getPropertiesForBlock(blockId: Long): Flow<List<Property>> {
        val propsFlow = MutableStateFlow<List<Property>>(emptyList())
        propsFlow.value = properties.value.filter { it.blockId == blockId }
        return propsFlow.asStateFlow()
    }

    override suspend fun saveProperty(property: Property): Result<Unit> {
        val currentProps = properties.value.toMutableList()
        currentProps.add(property)
        properties.value = currentProps
        return Result.success(Unit)
    }

    override suspend fun deleteProperty(id: Long): Result<Unit> {
        val currentProps = properties.value.toMutableList()
        currentProps.removeIf { it.id == id }
        properties.value = currentProps
        return Result.success(Unit)
    }
}