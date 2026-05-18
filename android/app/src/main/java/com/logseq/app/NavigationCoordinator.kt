package com.logseq.app

import android.util.Log

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

    private fun defaultPath(stack: String): String =
        if (stack == primaryStack) "/" else "/__stack__/$stack"

    private fun normalizedPath(raw: String?): String =
        raw?.takeIf { it.isNotBlank() } ?: "/"

    fun debugState(): String =
        "active=$activeStackId stacks=" + stackPaths.entries.joinToString(
            prefix = "{",
            postfix = "}"
        ) { (stack, paths) -> "$stack=${paths.joinToString(prefix = "[", postfix = "]")}" }

    fun onRouteChange(stack: String?, navigationType: String?, path: String?) {
        val stackId = stack?.takeIf { it.isNotBlank() } ?: primaryStack
        val navType = navigationType?.lowercase() ?: "push"
        val resolvedPath = normalizedPath(path)

        Log.d(
            TAG,
            "$DEBUG_PREFIX coordinator.onRouteChange.before stack=$stackId type=$navType path=$resolvedPath ${debugState()}"
        )

        val paths = stackPaths.getOrPut(stackId) { mutableListOf(defaultPath(stackId)) }

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

        // Special case: reset home stack to root when path is "/"
        if (stackId == primaryStack && resolvedPath == "/") {
            paths.clear()
            paths.add("/")
        }

        activeStackId = stackId
        stackPaths[stackId] = paths

        Log.d(
            TAG,
            "$DEBUG_PREFIX coordinator.onRouteChange.after stack=$stackId type=$navType path=$resolvedPath ${debugState()} canPop=${canPop()}"
        )
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
            Log.d(TAG, "$DEBUG_PREFIX coordinator.pop target=$target ${debugState()} canPop=${canPop()}")
        }
    }
}
