;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns com.logseq.experiments
  (:require [com.logseq.core :as core]))

(def api-proxy (aget js/logseq "Experiments"))

(defn invoke-exper-method
  [type & args]
  (let [method (aget api-proxy "invokeExperMethod")
        rest-args (vec args)
        args (into [type] rest-args)]
    (core/call-method api-proxy method args)))

(defn load-scripts
  [& scripts]
  (let [method (aget api-proxy "loadScripts")
        rest-scripts (vec scripts)
        args (into [] rest-scripts)]
    (core/call-method api-proxy method args)))

(defn register-fenced-code-renderer
  [lang opts]
  (let [method (aget api-proxy "registerFencedCodeRenderer")
        args [lang opts]]
    (core/call-method api-proxy method args)))

(defn register-daemon-renderer
  [key opts]
  (let [method (aget api-proxy "registerDaemonRenderer")
        args [key opts]]
    (core/call-method api-proxy method args)))

(defn register-hosted-renderer
  [key opts]
  (let [method (aget api-proxy "registerHostedRenderer")
        args [key opts]]
    (core/call-method api-proxy method args)))

(defn register-sidebar-renderer
  [key opts]
  (let [method (aget api-proxy "registerSidebarRenderer")
        args [key opts]]
    (core/call-method api-proxy method args)))

(defn register-route-renderer
  [key opts]
  (let [method (aget api-proxy "registerRouteRenderer")
        args [key opts]]
    (core/call-method api-proxy method args)))

(defn register-extensions-enhancer
  [type enhancer]
  (let [method (aget api-proxy "registerExtensionsEnhancer")
        args [type enhancer]]
    (core/call-method api-proxy method args)))

(defn ensure-host-scope
  []
  (let [method (aget api-proxy "ensureHostScope")
        args []]
    (core/call-method api-proxy method args)))
