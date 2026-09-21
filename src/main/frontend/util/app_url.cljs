(ns frontend.util.app-url
  "Helpers for the Desktop privileged renderer origin (lsp://logseq.com).

  Production Electron loads the renderer at lsp://logseq.com/index.html, so
  window.location.href looks like lsp://logseq.com/index.html#/graph. That
  string must never be inserted as journal/block content."
  (:require [clojure.string :as string]))

(def privileged-renderer-protocol "lsp:")
(def privileged-renderer-host "logseq.com")

(defn- parse-url
  [url]
  (when (and (string? url) (not (string/blank? url)))
    (try
      (js/URL. (string/trim url))
      (catch :default _
        nil))))

(defn privileged-renderer-url?
  "True when `url` is the Desktop privileged renderer origin (lsp://logseq.com/...).
   These URLs are the app's own window location and must not be inserted as block content."
  [url]
  (boolean
   (when-let [parsed (parse-url url)]
     (and (= privileged-renderer-protocol (.-protocol parsed))
          (= privileged-renderer-host (.-hostname parsed))))))

(defn insertable-block-content?
  "False when `text` is the privileged renderer origin and must not be stored as a block title."
  [text]
  (not (privileged-renderer-url? text)))

(defn- renderer-hash-path
  [url]
  (when-let [parsed (parse-url url)]
    (let [hash (.-hash parsed)]
      (when (string/starts-with? hash "#")
        (subs hash 1)))))

(defn open-url-action
  "How open-url / quickCapture should handle `url`.

  - :proceed — not a renderer origin URL; handle normally
  - :redirect-graph — renderer origin with the Graph View hash
  - :ignore — renderer origin that must not be inserted as content"
  [url]
  (cond
    (not (privileged-renderer-url? url))
    :proceed

    (= "/graph" (first (string/split (or (renderer-hash-path url) "") #"\?")))
    :redirect-graph

    :else
    :ignore))

(defn protocol-open-url?
  "True when an OS/open-url string should be handled by the desktop protocol handler.
   Includes logseq:// deep links and the privileged renderer origin."
  [url]
  (or (and (string? url)
           (string/starts-with? url "logseq:"))
      (privileged-renderer-url? url)))
