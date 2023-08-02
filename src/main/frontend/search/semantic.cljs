(ns frontend.search.semantic
  "Browser implementation of search protocol"
  (:require ["@logseq/logmind" :refer [taskQueue]]
            [frontend.search.protocol :as protocol]
            [frontend.ai.vector-store :as vector-store]
            [frontend.ai.text-encoder :as text-encoder]
            [promesa.core :as p]
            [frontend.state :as state]
            [logseq.graph-parser.util :as gp-util]))

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
          addtask-fn (fn [block] (.addTask taskQueue (:uuid block)
                                       (fn [] ;; Promise factory
                                         ;; TODO Junyi: Block Chunker
                                         (p/let [data  {:snippet (gp-util/safe-subs (:content block) 0 20)
                                                        :page    (:page block)
                                                        :id      (:id block)}
                                                 embed (text-encoder/text-encode (:content block) encoder-name)]
                                           (vector-store/add store-conn embed (:uuid block) data)))))]
      (mapv addtask-fn blocks-to-add)))
  
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
