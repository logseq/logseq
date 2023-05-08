(ns frontend.modules.ai.plugin
  (:require [frontend.modules.ai.protocol :as ai-protocol]
            [frontend.search.protocol :as search-protocol]))

;; TODO: move this to logseq-ai-plugin

(defrecord AIProxySolution [repo]
  ai-protocol/AI
  (generate-text [_this q opts]
    (-generate-text q opts token))
  (chat [_this conversation opts]
    (-chat conversation opts token))
  (generate-image [this description opts]
    (-generate-image description opts token))
  (speech-to-text [this audio opts])

  search-protocol/Engine
  (query [_this q opts])
  (rebuild-blocks-indice! [_this])
  (transact-blocks! [_this data])
  (truncate-blocks! [_this])
  (remove-db! [_this])
  (query-page [_this q opts])
  (transact-pages! [_this data]))
