(ns frontend.search.semantic
  "Browser implementation of search protocol"
  (:require [frontend.search.protocol :as protocol]
            [frontend.ai.vector-store :as vector-store]
            ;; [frontend.ai.text-encoder :as text-encoder]
            ;; [promesa.core :as p]
            ))

(defn template-comment-string
  "Accepts repo url and returns a string for the vector store comment"
  [url]
  (str "logseq-semsearch-vs-" url))

;; See protocol for full documentation
(defrecord Semantic [repo]
  protocol/Engine
  (query [_this q option]
    nil)
  (query-page [_this _q _opt]
    nil)
  (rebuild-blocks-indice! [_this]
    ;; Step 1: reset vector store
    ;; Step 2: Pull full block and page data
    ;; Step 3: Don't do anything (wait transact-pages! or transact-blocks! being called)
    nil)

  (transact-blocks! [_this {:keys [blocks-to-remove-set
                                   blocks-to-add]
                            :as data}]
    (prn "sematic: transact-blocks!") ;; TODO Junyi
    (prn data)
    (prn blocks-to-remove-set)
    (prn blocks-to-add))
  
  (transact-pages! [_this data]
    (prn "semantic: transact-pages!") ;; TODO Junyi
    (prn data))

  (truncate-blocks! [_this]
    (-> repo
        (template-comment-string)
        (vector-store/reset)))

  (remove-db! [_this]
    (-> repo
        (template-comment-string)
        (vector-store/reset))))
