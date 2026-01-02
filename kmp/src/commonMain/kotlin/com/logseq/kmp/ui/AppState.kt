package com.logseq.kmp.ui

import com.logseq.kmp.model.Page

data class AppState(
    val pages: List<Page> = emptyList(),
    val selectedPage: Page? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)