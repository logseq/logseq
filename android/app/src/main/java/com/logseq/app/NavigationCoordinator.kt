package com.logseq.app

import android.util.Log

data class NavigationRenderState(
    val previousStackId: String,
    val activeStackId: String,
    val paths: List<String>,
    val navigationType: String,
    val path: String,
    val stackSwitched: Boolean
)

class NavigationCoordinator {
    companion object {
        private const val TAG = "NavStack"
        private const val DEBUG_PREFIX = "[DEBUG-navstack]"
    }

    private val primaryStack = "home"
    private val stackPaths: MutableMap<String, MutableList<String>> = mutableMapOf(
        primaryStack to mutableListOf("/")
    )
    var activeStackId: String = primaryStack
        private set

    private fun rootPath(stack: String): String =
        if (stack == primaryStack) "/" else "/__stack__/$stack"

    private fun normalizedPath(raw: String?): String =
        raw?.takeIf { it.isNotBlank() } ?: "/"

    fun debugState(): String =
        "active=$activeStackId stacks=" + stackPaths.entries.joinToString(
            prefix = "{",
            postfix = "}"
        ) { (stack, paths) -> "$stack=${paths.joinToString(prefix = "[", postfix = "]")}" }

    private fun logDebug(message: String) {
        try {
            Log.d(TAG, message)
        } catch (_: RuntimeException) {
            // Local JVM unit tests do not provide android.util.Log.
        }
    }

    private fun snapshot(
        previousStackId: String,
        navigationType: String,
        path: String,
        stackSwitched: Boolean
    ): NavigationRenderState {
        val paths = stackPaths[activeStackId]?.toList() ?: listOf(rootPath(activeStackId))
        return NavigationRenderState(
            previousStackId = previousStackId,
            activeStackId = activeStackId,
            paths = paths,
            navigationType = navigationType,
            path = path,
            stackSwitched = stackSwitched
        )
    }

    fun onRouteChange(stack: String?, navigationType: String?, path: String?): NavigationRenderState {
        val stackId = stack?.takeIf { it.isNotBlank() } ?: primaryStack
        val navType = navigationType?.lowercase() ?: "push"
        val resolvedPath = normalizedPath(path)
        val previousStackId = activeStackId

        logDebug(
            "$DEBUG_PREFIX coordinator.onRouteChange.before stack=$stackId type=$navType path=$resolvedPath ${debugState()}"
        )

        val paths = stackPaths.getOrPut(stackId) { mutableListOf(rootPath(stackId)) }

        if (stackId != activeStackId) {
            val newPaths = paths.toMutableList()
            when {
                resolvedPath == rootPath(stackId) -> {
                    newPaths.clear()
                    newPaths.add(resolvedPath)
                }

                navType == "reset" -> {
                    newPaths.clear()
                    newPaths.add(resolvedPath)
                }

                stackId == primaryStack && resolvedPath == "/" -> {
                    newPaths.clear()
                    newPaths.add("/")
                }

                newPaths.isEmpty() -> newPaths.add(resolvedPath)

                navType == "push" && newPaths.last() != resolvedPath -> newPaths.add(resolvedPath)

                newPaths.last() != resolvedPath -> newPaths[newPaths.lastIndex] = resolvedPath
            }

            activeStackId = stackId
            stackPaths[stackId] = newPaths

            logDebug(
                "$DEBUG_PREFIX coordinator.onRouteChange.after stack=$stackId type=$navType path=$resolvedPath ${debugState()} canPop=${canPop()} stackSwitched=true"
            )

            return snapshot(previousStackId, navType, resolvedPath, stackSwitched = true)
        }

        when (navType) {
            "reset" -> {
                paths.clear()
                paths.add(resolvedPath)
            }

            "replace" -> {
                if (paths.isEmpty()) {
                    paths.add(resolvedPath)
                } else {
                    paths[paths.lastIndex] = resolvedPath
                }
            }

            "pop" -> {
                if (paths.size > 1) {
                    paths.removeAt(paths.lastIndex)
                }
            }

            else -> { // push (default)
                if (paths.isEmpty()) {
                    paths.add(resolvedPath)
                } else if (paths.last() != resolvedPath) {
                    paths.add(resolvedPath)
                }
            }
        }

        if (navType != "push" && resolvedPath == rootPath(stackId)) {
            paths.clear()
            paths.add(resolvedPath)
        }

        activeStackId = stackId
        stackPaths[stackId] = paths

        logDebug(
            "$DEBUG_PREFIX coordinator.onRouteChange.after stack=$stackId type=$navType path=$resolvedPath ${debugState()} canPop=${canPop()}"
        )

        return snapshot(previousStackId, navType, resolvedPath, stackSwitched = false)
    }

    fun canPop(): Boolean {
        val paths = stackPaths[activeStackId] ?: return false
        return paths.size > 1
    }

    fun pop(): String? {
        val paths = stackPaths[activeStackId] ?: return null
        if (paths.size <= 1) return null
        paths.removeAt(paths.lastIndex)
        return paths.lastOrNull().also { target ->
            logDebug("$DEBUG_PREFIX coordinator.pop target=$target ${debugState()} canPop=${canPop()}")
        }
    }
}
