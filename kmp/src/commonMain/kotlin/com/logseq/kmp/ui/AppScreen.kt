package com.logseq.kmp.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.logseq.kmp.model.Page
import kotlinx.coroutines.flow.collectLatest

/**
 * Main application screen composable that displays the Logseq KMP interface.
 *
 * @param viewModel The view model providing state and actions for the screen
 * @param modifier Modifier to be applied to the root composable
 */
@Composable
fun AppScreen(
    viewModel: AppViewModel,
    modifier: Modifier = Modifier
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadPages()
    }

    Column(modifier = modifier.fillMaxSize().padding(16.dp)) {
        Text(
            text = "Logseq KMP",
            style = MaterialTheme.typography.headlineMedium
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (state.isLoading) {
            CircularProgressIndicator()
        } else {
            LazyColumn {
                items(state.pages) { page ->
                    PageItem(
                        page = page,
                        onClick = { viewModel.selectPage(page) }
                    )
                }
            }
        }

        state.error?.let { error ->
            Text(
                text = error,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(top = 16.dp)
            )
        }
    }
}

@Composable
private fun PageItem(
    page: Page,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth().padding(vertical = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = page.name,
                style = MaterialTheme.typography.titleMedium
            )
            page.namespace?.let { namespace ->
                Text(
                    text = namespace,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}