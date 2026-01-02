package com.logseq.kmp.model

import kotlinx.datetime.Clock
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals

class ModelTests {

    private val now = Clock.System.now()

    @Test
    fun testPageCreation() {
        val page = Page(
            id = 1,
            uuid = "test-uuid",
            name = "Test Page",
            namespace = "test",
            filePath = "/path/to/file.md",
            createdAt = now,
            updatedAt = now,
            properties = mapOf("key" to "value")
        )

        assertEquals(1L, page.id)
        assertEquals("test-uuid", page.uuid)
        assertEquals("Test Page", page.name)
        assertEquals("test", page.namespace)
        assertEquals("/path/to/file.md", page.filePath)
        assertEquals(now, page.createdAt)
        assertEquals(now, page.updatedAt)
        assertEquals(mapOf("key" to "value"), page.properties)
    }

    @Test
    fun testPageEquality() {
        val page1 = Page(
            id = 1,
            uuid = "test-uuid",
            name = "Test Page",
            createdAt = now,
            updatedAt = now
        )

        val page2 = Page(
            id = 1,
            uuid = "test-uuid",
            name = "Test Page",
            createdAt = now,
            updatedAt = now
        )

        val page3 = page1.copy(name = "Different Name")

        assertEquals(page1, page2)
        assertNotEquals(page1, page3)
    }

    @Test
    fun testBlockCreation() {
        val block = Block(
            id = 1,
            uuid = "block-uuid",
            pageId = 1,
            parentId = null,
            leftId = null,
            content = "Test content",
            level = 0,
            position = 0,
            createdAt = now,
            updatedAt = now,
            properties = mapOf("type" to "text")
        )

        assertEquals(1L, block.id)
        assertEquals("block-uuid", block.uuid)
        assertEquals(1L, block.pageId)
        assertEquals(null, block.parentId)
        assertEquals(null, block.leftId)
        assertEquals("Test content", block.content)
        assertEquals(0, block.level)
        assertEquals(0, block.position)
        assertEquals(now, block.createdAt)
        assertEquals(now, block.updatedAt)
        assertEquals(mapOf("type" to "text"), block.properties)
    }

    @Test
    fun testBlockWithParent() {
        val parentBlock = Block(
            id = 1,
            uuid = "parent-uuid",
            pageId = 1,
            content = "Parent content",
            position = 0,
            createdAt = now,
            updatedAt = now
        )

        val childBlock = Block(
            id = 2,
            uuid = "child-uuid",
            pageId = 1,
            parentId = 1,
            content = "Child content",
            level = 1,
            position = 1,
            createdAt = now,
            updatedAt = now
        )

        assertEquals(1L, childBlock.parentId)
        assertEquals(1, childBlock.level)
        assertEquals(1, childBlock.position)
    }

    @Test
    fun testPropertyCreation() {
        val property = Property(
            id = 1,
            blockId = 1,
            key = "priority",
            value = "high",
            createdAt = now
        )

        assertEquals(1L, property.id)
        assertEquals(1L, property.blockId)
        assertEquals("priority", property.key)
        assertEquals("high", property.value)
        assertEquals(now, property.createdAt)
    }

    @Test
    fun testPageCopy() {
        val original = Page(
            id = 1,
            uuid = "test-uuid",
            name = "Original Name",
            createdAt = now,
            updatedAt = now
        )

        val updated = original.copy(name = "Updated Name", updatedAt = now)

        assertEquals("Updated Name", updated.name)
        assertEquals(original.id, updated.id)
        assertEquals(original.uuid, updated.uuid)
        assertEquals(original.createdAt, updated.createdAt)
    }

    @Test
    fun testBlockCopy() {
        val original = Block(
            id = 1,
            uuid = "block-uuid",
            pageId = 1,
            content = "Original content",
            position = 0,
            createdAt = now,
            updatedAt = now
        )

        val updated = original.copy(content = "Updated content", updatedAt = now)

        assertEquals("Updated content", updated.content)
        assertEquals(original.id, updated.id)
        assertEquals(original.uuid, updated.uuid)
        assertEquals(original.pageId, updated.pageId)
    }
}