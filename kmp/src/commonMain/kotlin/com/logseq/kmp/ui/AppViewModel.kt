package com.logseq.kmp.ui

import com.logseq.kmp.model.Page
import com.logseq.kmp.repository.PageRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

/**
 * View model for the main application screen, managing state and user interactions.
 *
 * @param pageRepository Repository for accessing page data
 * @param coroutineScope Scope for launching coroutines
 */
class AppViewModel(
    private val pageRepository: PageRepository,
    private val coroutineScope: CoroutineScope
) {
    private val _state = MutableStateFlow(AppState())
    val state: StateFlow<AppState> = _state.asStateFlow()

    init {
        loadPages()
    }

    /**
     * Loads all pages from the repository and updates the UI state.
     */
    fun loadPages() {
        _state.value = _state.value.copy(isLoading = true, error = null)
        coroutineScope.launch {
            try {
                pageRepository.getAllPages().collectLatest { pages ->
                    _state.value = _state.value.copy(
                        pages = pages,
                        isLoading = false,
                        error = null
                    )
                }
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    error = e.message ?: "Unknown error",
                    isLoading = false
                )
            }
        }
    }

    /**
     * Selects a page and updates the application state.
     *
     * @param page The page to select
     */
    fun selectPage(page: Page) {
        _state.value = _state.value.copy(selectedPage = page)
    }

    /**
     * Handles errors by updating the application state.
     *
     * @param error The error that occurred
     */
    fun onError(error: Throwable) {
        _state.value = _state.value.copy(error = error.message, isLoading = false)
    }
}