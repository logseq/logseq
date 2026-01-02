package com.logseq.kmp.repository

import com.logseq.kmp.model.Block
import com.logseq.kmp.model.Page
import com.logseq.kmp.model.Property
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class RepositoryIntegrationTests {

    private val now = Clock.System.now()

    @Test
    fun testPageRepositoryCRUD() = runTest {
        val repository = InMemoryPageRepository()

        // Create
        val page = Page(
            id = 1,
            uuid = "test-uuid",
            name = "Test Page",
            createdAt = now,
            updatedAt = now
        )

        val saveResult = repository.savePage(page)
        assertTrue(saveResult.isSuccess)

        // Read all
        val allPages = repository.getAllPages().first()
        assertEquals(listOf(page), allPages)

        // Read by id
        val retrievedPage = repository.getPageById(1).first()
        assertEquals(page, retrievedPage)

        // Update
        val updatedPage = page.copy(name = "Updated Page")
        val updateResult = repository.savePage(updatedPage)
        assertTrue(updateResult.isSuccess)

        val updatedPages = repository.getAllPages().first()
        assertEquals(listOf(updatedPage), updatedPages)

        // Delete
        val deleteResult = repository.deletePage(1)
        assertTrue(deleteResult.isSuccess)

        val emptyPages = repository.getAllPages().first()
        assertTrue(emptyPages.isEmpty())
    }

    @Test
    fun testBlockRepositoryCRUD() = runTest {
        val repository = InMemoryBlockRepository()

        // Create
        val block = Block(
            id = 1,
            uuid = "block-uuid",
            pageId = 1,
            content = "Test content",
            position = 0,
            createdAt = now,
            updatedAt = now
        )

        val saveResult = repository.saveBlock(block)
        assertTrue(saveResult.isSuccess)

        // Read by page
        val blocksForPage = repository.getBlocksForPage(1).first()
        assertEquals(listOf(block), blocksForPage)

        // Read by id
        val retrievedBlock = repository.getBlockById(1).first()
        assertEquals(block, retrievedBlock)

        // Update
        val updatedBlock = block.copy(content = "Updated content")
        val updateResult = repository.saveBlock(updatedBlock)
        assertTrue(updateResult.isSuccess)

        val updatedBlocks = repository.getBlocksForPage(1).first()
        assertEquals(listOf(updatedBlock), updatedBlocks)

        // Delete
        val deleteResult = repository.deleteBlock(1)
        assertTrue(deleteResult.isSuccess)

        val emptyBlocks = repository.getBlocksForPage(1).first()
        assertTrue(emptyBlocks.isEmpty())
    }

    @Test
    fun testPropertyRepositoryCRUD() = runTest {
        val repository = InMemoryPropertyRepository()

        // Create
        val property = Property(
            id = 1,
            blockId = 1,
            key = "priority",
            value = "high",
            createdAt = now
        )

        val saveResult = repository.saveProperty(property)
        assertTrue(saveResult.isSuccess)

        // Read by block
        val propertiesForBlock = repository.getPropertiesForBlock(1).first()
        assertEquals(listOf(property), propertiesForBlock)

        // Update
        val anotherProperty = Property(
            id = 2,
            blockId = 1,
            key = "status",
            value = "done",
            createdAt = now
        )

        val saveAnotherResult = repository.saveProperty(anotherProperty)
        assertTrue(saveAnotherResult.isSuccess)

        val allProperties = repository.getPropertiesForBlock(1).first()
        assertEquals(2, allProperties.size)
        assertTrue(allProperties.contains(property))
        assertTrue(allProperties.contains(anotherProperty))

        // Delete
        val deleteResult = repository.deleteProperty(1)
        assertTrue(deleteResult.isSuccess)

        val remainingProperties = repository.getPropertiesForBlock(1).first()
        assertEquals(listOf(anotherProperty), remainingProperties)
    }

    @Test
    fun testRepositoryRelationships() = runTest {
        val pageRepo = InMemoryPageRepository()
        val blockRepo = InMemoryBlockRepository()
        val propertyRepo = InMemoryPropertyRepository()

        // Create page
        val page = Page(
            id = 1,
            uuid = "page-uuid",
            name = "Test Page",
            createdAt = now,
            updatedAt = now
        )
        pageRepo.savePage(page)

        // Create block for page
        val block = Block(
            id = 1,
            uuid = "block-uuid",
            pageId = 1,
            content = "Block content",
            position = 0,
            createdAt = now,
            updatedAt = now
        )
        blockRepo.saveBlock(block)

        // Create property for block
        val property = Property(
            id = 1,
            blockId = 1,
            key = "type",
            value = "text",
            createdAt = now
        )
        propertyRepo.saveProperty(property)

        // Verify relationships
        val pages = pageRepo.getAllPages().first()
        assertEquals(1, pages.size)

        val blocks = blockRepo.getBlocksForPage(1).first()
        assertEquals(1, blocks.size)
        assertEquals(1L, blocks[0].pageId)

        val properties = propertyRepo.getPropertiesForBlock(1).first()
        assertEquals(1, properties.size)
        assertEquals(1L, properties[0].blockId)
    }

    @Test
    fun testNonExistentEntities() = runTest {
        val pageRepo = InMemoryPageRepository()
        val blockRepo = InMemoryBlockRepository()

        // Try to get non-existent page
        val page = pageRepo.getPageById(999).first()
        assertNull(page)

        // Try to get blocks for non-existent page
        val blocks = blockRepo.getBlocksForPage(999).first()
        assertTrue(blocks.isEmpty())

        // Try to get non-existent block
        val block = blockRepo.getBlockById(999).first()
        assertNull(block)
    }
}