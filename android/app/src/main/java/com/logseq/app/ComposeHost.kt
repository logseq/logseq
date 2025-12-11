package com.logseq.app

import android.app.Activity
import android.net.Uri
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.tween
import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBars
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
    HandleNavigationEvents(navController, navEvents)

    BackHandler {
        if (navController.previousBackStackEntry != null) {
            onBackRequested()
        } else {
            onExit()
        }
    }

    NavHost(
        navController = navController,
        startDestination = ROOT_ROUTE,
        modifier = Modifier
            .fillMaxSize()
            .padding(WindowInsets.systemBars.asPaddingValues())
    ) {
        composable(
            route = ROOT_ROUTE,
            arguments = listOf(navArgument("encodedPath") { defaultValue = encodePath("/") }),
            enterTransition = {
                fadeIn(animationSpec = tween(120))
            },
            exitTransition = {
                fadeOut(animationSpec = tween(120))
            },
            popEnterTransition = {
                fadeIn(animationSpec = tween(120))
            },
            popExitTransition = {
                fadeOut(animationSpec = tween(120))
            }
        ) {
            AndroidView(
                factory = { context ->
                    // Keep a dedicated container so we never try to reattach the WebView elsewhere.
                    FrameLayout(context).apply {
                        layoutParams = FrameLayout.LayoutParams(
                            FrameLayout.LayoutParams.MATCH_PARENT,
                            FrameLayout.LayoutParams.MATCH_PARENT
                        )
                        (webView.parent as? ViewGroup)?.removeView(webView)
                        addView(
                            webView,
                            FrameLayout.LayoutParams(
                                FrameLayout.LayoutParams.MATCH_PARENT,
                                FrameLayout.LayoutParams.MATCH_PARENT
                            )
                        )
                    }
                },
                modifier = Modifier.fillMaxSize(),
                update = {
                    if (webView.parent !== it) {
                        (webView.parent as? ViewGroup)?.removeView(webView)
                        it.addView(
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
    navEvents: SharedFlow<NavigationEvent>
) {
    LaunchedEffect(navController) {
        navEvents.collect { event ->
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
        }
    }
}
