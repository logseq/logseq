package com.logseq.kmp.repository

import com.logseq.kmp.model.Page
import com.logseq.kmp.model.Block
import com.logseq.kmp.model.Property
import kotlinx.coroutines.flow.Flow

interface PageRepository {
    fun getAllPages(): Flow<List<Page>>
    fun getPageById(id: Long): Flow<Page?>
    suspend fun savePage(page: Page): Result<Unit>
    suspend fun deletePage(id: Long): Result<Unit>
}

interface BlockRepository {
    fun getBlocksForPage(pageId: Long): Flow<List<Block>>
    fun getBlockById(id: Long): Flow<Block?>
    suspend fun saveBlock(block: Block): Result<Unit>
    suspend fun deleteBlock(id: Long): Result<Unit>
}

interface PropertyRepository {
    fun getPropertiesForBlock(blockId: Long): Flow<List<Property>>
    suspend fun saveProperty(property: Property): Result<Unit>
    suspend fun deleteProperty(id: Long): Result<Unit>
}