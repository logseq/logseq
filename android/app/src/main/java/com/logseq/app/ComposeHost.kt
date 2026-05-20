package com.logseq.app

import android.graphics.Color
import android.app.Activity
import android.net.Uri
import android.util.Log
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
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
import androidx.compose.runtime.DisposableEffect
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
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private const val ROOT_ROUTE = "web/{encodedPath}"
private const val DEBUG_NAV_STACK_PREFIX = "[DEBUG-navstack]"

/**
 * Hosts the existing WebView inside Compose and drives Compose Navigation
 * so we get back gestures/animations while delegating actual routing to the JS layer.
 */
object ComposeHost {
    private val navEvents = MutableSharedFlow<NavigationRenderState>(extraBufferCapacity = 64)
    val navigationEvents: SharedFlow<NavigationRenderState> = navEvents

    @JvmStatic
    fun applyNavigation(state: NavigationRenderState) {
        Log.d(
            "NavStack",
            "$DEBUG_NAV_STACK_PREFIX compose.applyNavigation stack=${state.activeStackId} previous=${state.previousStackId} " +
                "type=${state.navigationType} path=${state.path} paths=${state.paths} switched=${state.stackSwitched}"
        )
        if (!navEvents.tryEmit(state)) {
            Log.w(
                "ComposeHost",
                "Dropped navigation state: stack=${state.activeStackId} type=${state.navigationType} path=${state.path}"
            )
        }
    }

    fun renderWithSystemInsets(
        activity: Activity,
        webView: WebView
    ) {
        WebViewSnapshotManager.registerWindow(activity.window)
        val root = activity.findViewById<FrameLayout>(android.R.id.content)

        // WebView already created by BridgeActivity; just reparent it into Compose.
        (webView.parent as? ViewGroup)?.removeView(webView)

        val composeView = ComposeView(activity).apply {
            tag = "compose-host-webview"
            setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
            setContent {
                ComposeNavigationHost(
                    webView = webView
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

private fun decodePath(encodedPath: String?): String =
    Uri.decode(encodedPath?.takeIf { it.isNotBlank() } ?: encodePath("/"))

private fun NavHostController.currentPath(): String? =
    currentBackStackEntry?.arguments?.getString("encodedPath")?.let(::decodePath)

private fun NavHostController.rebuildBackStack(paths: List<String>) {
    val normalizedPaths = paths.ifEmpty { listOf("/") }
    val rootRoute = routeFor(normalizedPaths.first())
    navigate(rootRoute) {
        popUpTo(ROOT_ROUTE) {
            inclusive = true
        }
        launchSingleTop = true
    }
    normalizedPaths.drop(1).forEach { path ->
        navigate(routeFor(path)) {
            launchSingleTop = true
        }
    }
}

@Suppress("UNUSED_PARAMETER")
private fun shouldAnimateNavigation(navigationType: String): Boolean =
    false

@OptIn(ExperimentalAnimationApi::class)
@Composable
private fun ComposeNavigationHost(
    webView: WebView
) {
    val navController = rememberNavController()

    DisposableEffect(navController) {
        navController.enableOnBackPressed(false)
        Log.d("NavStack", "$DEBUG_NAV_STACK_PREFIX compose.navController.backHandling disabled")
        onDispose {
            navController.enableOnBackPressed(true)
        }
    }

    // Track the last navigation type so we can change slide direction.
    val lastNavTypeState = remember { mutableStateOf("push") }

    HandleNavigationEvents(
        navController = navController,
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
                val navType = lastNavTypeState.value
                if (!shouldAnimateNavigation(navType)) {
                    EnterTransition.None
                } else if (navType == "pop") {
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
                val navType = lastNavTypeState.value
                if (!shouldAnimateNavigation(navType)) {
                    ExitTransition.None
                } else if (navType == "pop") {
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
                if (!shouldAnimateNavigation(lastNavTypeState.value)) {
                    EnterTransition.None
                } else {
                    slideInHorizontally(
                        initialOffsetX = { fullWidth -> -fullWidth / 4 },
                        animationSpec = tween(200)
                    ) + fadeIn(animationSpec = tween(160))
                }
            },
            popExitTransition = {
                if (!shouldAnimateNavigation(lastNavTypeState.value)) {
                    ExitTransition.None
                } else {
                    slideOutHorizontally(
                        targetOffsetX = { fullWidth -> fullWidth },
                        animationSpec = tween(200)
                    ) + fadeOut(animationSpec = tween(160))
                }
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
    webView: WebView,
    onNavType: (String) -> Unit
) {
    LaunchedEffect(navController) {
        var snapshotVersion = 0
        ComposeHost.navigationEvents.collect { state ->
            snapshotVersion += 1
            val currentSnapshotVersion = snapshotVersion
            val paths = state.paths.ifEmpty { listOf(state.path) }
            val targetPath = paths.lastOrNull() ?: state.path
            val route = routeFor(targetPath)
            val animateNavigation = shouldAnimateNavigation(state.navigationType) && !state.stackSwitched
            Log.d(
                "NavStack",
                "$DEBUG_NAV_STACK_PREFIX compose.event.before stack=${state.activeStackId} previous=${state.previousStackId} " +
                    "type=${state.navigationType} path=$targetPath paths=$paths switched=${state.stackSwitched} targetRoute=$route " +
                    "currentRoute=${navController.currentBackStackEntry?.destination?.route} " +
                    "currentArgs=${navController.currentBackStackEntry?.arguments} " +
                    "previousRoute=${navController.previousBackStackEntry?.destination?.route}"
            )
            if (animateNavigation) {
                WebViewSnapshotManager.showSnapshot("navigation", webView)
            } else {
                WebViewSnapshotManager.clearSnapshot("navigation")
            }
            onNavType(state.navigationType)
            when {
                state.stackSwitched || state.navigationType == "reset" -> {
                    navController.rebuildBackStack(paths)
                }

                state.navigationType == "push" -> {
                    if (navController.currentPath() != targetPath) {
                        navController.navigate(route)
                    }
                }

                state.navigationType == "replace" -> {
                    navController.popBackStack()
                    navController.navigate(route) {
                        launchSingleTop = true
                    }
                }

                state.navigationType == "pop" -> {
                    if (!navController.popBackStack(route, inclusive = false)) {
                        navController.rebuildBackStack(paths)
                    }
                }

                else -> navController.navigate(route)
            }
            Log.d(
                "NavStack",
                "$DEBUG_NAV_STACK_PREFIX compose.event.after stack=${state.activeStackId} type=${state.navigationType} path=$targetPath targetRoute=$route " +
                    "currentRoute=${navController.currentBackStackEntry?.destination?.route} " +
                    "currentArgs=${navController.currentBackStackEntry?.arguments} " +
                    "previousRoute=${navController.previousBackStackEntry?.destination?.route}"
            )

            if (animateNavigation) {
                launch {
                    delay(260)
                    if (currentSnapshotVersion == snapshotVersion) {
                        WebViewSnapshotManager.clearSnapshot("navigation")
                    }
                }
            }
        }
    }
}
