package com.logseq.kmp

import com.logseq.kmp.model.Page
import com.logseq.kmp.repository.InMemoryPageRepository
import com.logseq.kmp.ui.AppState
import com.logseq.kmp.ui.AppViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.TestCoroutineScheduler
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

@OptIn(ExperimentalCoroutinesApi::class)
class AppViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher(TestCoroutineScheduler())
    private val testScope = TestScope(testDispatcher)

    @Test
    fun testInitialState() {
        val repository = InMemoryPageRepository()
        val viewModel = AppViewModel(repository, testScope)

        val initialState = viewModel.state.value
        assertEquals(emptyList(), initialState.pages)
        assertNull(initialState.selectedPage)
        assertFalse(initialState.isLoading)
        assertNull(initialState.error)
    }

    @Test
    fun testSelectPage() = runTest(testDispatcher) {
        val repository = InMemoryPageRepository()
        val viewModel = AppViewModel(repository, testScope)

        val testPage = Page(
            id = 1,
            uuid = "test-uuid",
            name = "Test Page",
            createdAt = Clock.System.now(),
            updatedAt = Clock.System.now()
        )

        viewModel.selectPage(testPage)

        val state = viewModel.state.value
        assertEquals(testPage, state.selectedPage)
    }

    @Test
    fun testLoadPagesSuccess() = runTest(testDispatcher) {
        val repository = InMemoryPageRepository()
        val viewModel = AppViewModel(repository, testScope)

        val testPage = Page(
            id = 1,
            uuid = "test-uuid",
            name = "Test Page",
            createdAt = Clock.System.now(),
            updatedAt = Clock.System.now()
        )

        // Add page to repository
        repository.savePage(testPage)

        // Wait for the flow to emit
        val state = viewModel.state.first { it.pages.isNotEmpty() }

        assertEquals(listOf(testPage), state.pages)
        assertFalse(state.isLoading)
        assertNull(state.error)
    }

    @Test
    fun testOnError() = runTest(testDispatcher) {
        val repository = InMemoryPageRepository()
        val viewModel = AppViewModel(repository, testScope)

        val testError = RuntimeException("Test error")
        viewModel.onError(testError)

        val state = viewModel.state.value
        assertEquals("Test error", state.error)
        assertFalse(state.isLoading)
    }

    @Test
    fun testLoadPagesLoadingState() = runTest(testDispatcher) {
        val repository = InMemoryPageRepository()
        val viewModel = AppViewModel(repository, testScope)

        // Check initial loading state
        val initialState = viewModel.state.value
        assertTrue(initialState.isLoading)
    }

    @Test
    fun testMultiplePageSelection() = runTest(testDispatcher) {
        val repository = InMemoryPageRepository()
        val viewModel = AppViewModel(repository, testScope)

        val page1 = Page(
            id = 1,
            uuid = "uuid-1",
            name = "Page 1",
            createdAt = Clock.System.now(),
            updatedAt = Clock.System.now()
        )

        val page2 = Page(
            id = 2,
            uuid = "uuid-2",
            name = "Page 2",
            createdAt = Clock.System.now(),
            updatedAt = Clock.System.now()
        )

        viewModel.selectPage(page1)
        assertEquals(page1, viewModel.state.value.selectedPage)

        viewModel.selectPage(page2)
        assertEquals(page2, viewModel.state.value.selectedPage)
    }
}