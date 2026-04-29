;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns com.logseq.commands
  (:require [com.logseq.core :as core]))

(def api-proxy (aget js/logseq "Commands"))

(defn- register-impl
  [id options action]
  (let [method (aget api-proxy "register")
        args [id options action]]
    (core/call-method api-proxy method args)))

(defn register
  "Register a plugin command with one or more placements.\n\nv1 keeps compatibility with the existing command APIs by mapping placements\nto palette commands, shortcuts, slash commands, and context-menu entries.\n`when` is stored as command metadata for future host-side evaluation."
  ([id options]
   (register-impl id options nil))
  ([id options action]
   (register-impl id options action)))

(defn execute
  "Execute a built-in or plugin command.\n\nBuilt-in commands use the existing `logseq.*` ids. Plugin commands can be\naddressed as `plugin-id/key`, `plugin-id.commands.key`, or a local command\nkey registered by the current plugin."
  [id & args]
  (let [method (aget api-proxy "execute")
        rest-args (vec args)
        args (into [id] rest-args)]
    (core/call-method api-proxy method args)))
