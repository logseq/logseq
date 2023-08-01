(ns frontend.search.semantic
  "Browser implementation of search protocol"
  (:require [frontend.search.protocol :as protocol]
            [frontend.ai.vector-store :as vector-store]
            [frontend.ai.text-encoder :as text-encoder]
            [promesa.core :as p]
            
            [frontend.state :as state]))

(defn idstr-template-string
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
    ;; Step 1: encoding all sentences
    ;; Step 2: inference vec length
    ;; Step 3: create vector store (optional)
    ;; Setp 4: add to vec store
    ;; {:blocks-to-remove-set #{16634}, :blocks-to-add ({:id 16634, :uuid "647dcfc7-2aba-4015-8b71-cdf73c552761", :page 12, :content "adding me 2"})}
    ;; Handling blocks to add
    (let [encoder      (state/get-semsearch-encoder)
          encoder-name (:name encoder)
          encoder-dim  (get-in encoder [:opts :modelDim])
          store-conn   (if encoder-dim
                         (vector-store/create (idstr-template-string repo) encoder-dim)
                         (throw (js/Error. (str "record modelDim is not found in options of registrated encoder " encoder-name))))
          block->promise (fn [block]
                           ;; TODO Junyi: Chunker
                           (p/let [embed (text-encoder/text-encode (:content block) encoder-name)
                                   _     (vector-store/add store-conn embed (:uuid block))]))
          embed-promises (map block->promise blocks-to-add)])
                    (p/let [uuids (map  blocks-to-add)
                            store-handler (vector-store/try-create )]
                      (vector-store/add store-handler embed uuid))
                    (prn "sematic: transact-blocks!") ;; TODO Junyi
                    (prn data)
                    (prn blocks-to-remove-set)
                    (prn blocks-to-add))
  
  (transact-pages! [_this data]
                   
                   (vector-store/create "test" 128)
    (prn "semantic: transact-pages!") ;; TODO Junyi
    (prn data))

  (truncate-blocks! [_this]
    (-> repo
        (idstr-template-string)
        (vector-store/reset)))

  (remove-db! [_this]
    (-> repo
        (idstr-template-string)
        (vector-store/reset))))
