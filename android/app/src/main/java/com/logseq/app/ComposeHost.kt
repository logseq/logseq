package com.logseq.app

import android.graphics.Color
import android.app.Activity
import android.net.Uri
import android.util.Log
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.activity.compose.BackHandler
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBars
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.viewinterop.AndroidView
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private const val ROOT_ROUTE = "web/{encodedPath}"

data class NavigationEvent(
    val navigationType: String,
    val path: String
)

/**
 * Hosts the existing WebView inside Compose and drives Compose Navigation
 * so we get back gestures/animations while delegating actual routing to the JS layer.
 */
object ComposeHost {
    private val navEvents = MutableSharedFlow<NavigationEvent>(extraBufferCapacity = 64)

    fun applyNavigation(navigationType: String?, path: String?) {
        val type = (navigationType ?: "push").lowercase()
        val safePath = path?.takeIf { it.isNotBlank() } ?: "/"
        navEvents.tryEmit(NavigationEvent(type, safePath))
    }

    fun renderWithSystemInsets(
        activity: Activity,
        webView: WebView,
        onBackRequested: () -> Unit,
        onExit: () -> Unit = { activity.finish() }
    ) {
        val root = activity.findViewById<FrameLayout>(android.R.id.content)

        // WebView already created by BridgeActivity; just reparent it into Compose.
        (webView.parent as? ViewGroup)?.removeView(webView)

        val composeView = ComposeView(activity).apply {
            tag = "compose-host-webview"
            setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
            setContent {
                ComposeNavigationHost(
                    navEvents = navEvents,
                    webView = webView,
                    onBackRequested = onBackRequested,
                    onExit = onExit
                )
            }
        }

        if (root.findViewWithTag<ComposeView>("compose-host-webview") == null) {
            root.addView(
                composeView,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            )
        }
    }
}

private fun encodePath(path: String): String =
    Uri.encode(if (path.isBlank()) "/" else path)

private fun routeFor(path: String): String =
    "web/${encodePath(path)}"

@OptIn(ExperimentalAnimationApi::class)
@Composable
private fun ComposeNavigationHost(
    navEvents: SharedFlow<NavigationEvent>,
    webView: WebView,
    onBackRequested: () -> Unit,
    onExit: () -> Unit
) {
    val navController = rememberNavController()

    // Track the last navigation type so we can change slide direction.
    val lastNavTypeState = remember { mutableStateOf("push") }

    HandleNavigationEvents(
        navController = navController,
        navEvents = navEvents,
        webView = webView
    ) { type ->
        lastNavTypeState.value = type
    }

    // You can comment this out if you want to rely purely on JS for back.

    NavHost(
        navController = navController,
        startDestination = ROOT_ROUTE,
        modifier = Modifier
            .fillMaxSize()
            .padding(WindowInsets.systemBars.asPaddingValues())
    ) {
        composable(
            route = ROOT_ROUTE,
            arguments = listOf(
                navArgument("encodedPath") {
                    defaultValue = encodePath("/")
                }
            ),
            // ---- PUSH: A -> B ----
            enterTransition = {
                if (lastNavTypeState.value == "pop") {
                    slideInHorizontally(
                        initialOffsetX = { fullWidth -> -fullWidth / 3 },
                        animationSpec = tween(220)
                    ) + fadeIn(animationSpec = tween(180))
                } else {
                    slideInHorizontally(
                        initialOffsetX = { fullWidth -> fullWidth },
                        animationSpec = tween(220)
                    ) + fadeIn(animationSpec = tween(180))
                }
            },
            exitTransition = {
                if (lastNavTypeState.value == "pop") {
                    slideOutHorizontally(
                        targetOffsetX = { fullWidth -> fullWidth },
                        animationSpec = tween(200)
                    ) + fadeOut(animationSpec = tween(160))
                } else {
                    slideOutHorizontally(
                        targetOffsetX = { fullWidth -> -fullWidth / 4 },
                        animationSpec = tween(220)
                    ) + fadeOut(animationSpec = tween(180))
                }
            },
            // ---- POP: B -> A ----
            popEnterTransition = {
                slideInHorizontally(
                    initialOffsetX = { fullWidth -> -fullWidth / 4 },
                    animationSpec = tween(200)
                ) + fadeIn(animationSpec = tween(160))
            },
            popExitTransition = {
                slideOutHorizontally(
                    targetOffsetX = { fullWidth -> fullWidth },
                    animationSpec = tween(200)
                ) + fadeOut(animationSpec = tween(160))
            }
        ) {
            AndroidView(
                factory = { context ->
                    FrameLayout(context).apply {
                        layoutParams = FrameLayout.LayoutParams(
                            FrameLayout.LayoutParams.MATCH_PARENT,
                            FrameLayout.LayoutParams.MATCH_PARENT
                        )

                        val webContainer = FrameLayout(context).apply {
                            id = R.id.webview_container
                            layoutParams = FrameLayout.LayoutParams(
                                FrameLayout.LayoutParams.MATCH_PARENT,
                                FrameLayout.LayoutParams.MATCH_PARENT
                            )
                        }

                        val overlayContainer = FrameLayout(context).apply {
                            id = R.id.webview_overlay_container
                            layoutParams = FrameLayout.LayoutParams(
                                FrameLayout.LayoutParams.MATCH_PARENT,
                                FrameLayout.LayoutParams.MATCH_PARENT
                            )
                            isClickable = false
                            isFocusable = false
                        }

                        overlayContainer.setBackgroundColor(Color.TRANSPARENT)
                        overlayContainer.alpha = 1f
                        overlayContainer.visibility = android.view.View.GONE

                        addView(webContainer)
                        addView(overlayContainer)

                        WebViewSnapshotManager.registerOverlay(overlayContainer)

                        (webView.parent as? ViewGroup)?.removeView(webView)
                        webContainer.addView(
                            webView,
                            FrameLayout.LayoutParams(
                                FrameLayout.LayoutParams.MATCH_PARENT,
                                FrameLayout.LayoutParams.MATCH_PARENT
                            )
                        )
                    }
                },
                modifier = Modifier.fillMaxSize(),
                update = { root ->
                    val webContainer =
                        root.findViewById<FrameLayout>(R.id.webview_container)
                    val overlayContainer =
                        root.findViewById<FrameLayout>(R.id.webview_overlay_container)
                    WebViewSnapshotManager.registerOverlay(overlayContainer)
                    if (webView.parent !== webContainer) {
                        (webView.parent as? ViewGroup)?.removeView(webView)
                        webContainer.addView(
                            webView,
                            FrameLayout.LayoutParams(
                                FrameLayout.LayoutParams.MATCH_PARENT,
                                FrameLayout.LayoutParams.MATCH_PARENT
                            )
                        )
                    }
                }
            )
        }
    }
}

@Composable
private fun HandleNavigationEvents(
    navController: NavHostController,
    navEvents: SharedFlow<NavigationEvent>,
    webView: WebView,
    onNavType: (String) -> Unit
) {
    LaunchedEffect(navController) {
        var snapshotVersion = 0
        navEvents.collect { event ->
            snapshotVersion += 1
            val currentSnapshotVersion = snapshotVersion
            WebViewSnapshotManager.showSnapshot("navigation", webView)
            onNavType(event.navigationType)
            val route = routeFor(event.path)
            when (event.navigationType) {
                "push" -> navController.navigate(route)

                "replace" -> {
                    navController.popBackStack()
                    navController.navigate(route) {
                        launchSingleTop = true
                    }
                }

                "pop" -> {
                    if (!navController.popBackStack()) {
                        // Already at root; nothing to pop.
                    }
                }

                "reset" -> {
                    navController.popBackStack(route = ROOT_ROUTE, inclusive = false)
                    navController.navigate(route) {
                        popUpTo(ROOT_ROUTE) {
                            inclusive = true
                        }
                        launchSingleTop = true
                    }
                }

                else -> navController.navigate(route)
            }

            launch {
                delay(260)
                if (currentSnapshotVersion == snapshotVersion) {
                    WebViewSnapshotManager.clearSnapshot("navigation")
                }
            }
        }
    }
}
