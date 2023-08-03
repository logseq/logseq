(ns frontend.search.semantic
  "Browser implementation of search protocol"
  (:require ["@logseq/logmind" :refer [taskQueue]]
            [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.search.protocol :as protocol]
            [frontend.ai.vector-store :as vector-store]
            [frontend.ai.text-encoder :as text-encoder]
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
                                   blocks-to-add]}]
    ;; Step 1: create vector store handler
    ;; Step 2: deal with blocks-to-remove-set
    ;; Step 3: deal with blocks-to-add
    ;; {:blocks-to-remove-set #{16634}, :blocks-to-add ({:id 16634, :uuid "647dcfc7-2aba-4015-8b71-cdf73c552761", :page 12, :content "adding me 2"})}
    ;; Handling blocks to add
    (let [encoder      (state/get-semsearch-encoder)
          encoder-name (:name encoder)
          encoder-dim  (get-in encoder [:opts :modelDim])
          store-conn   (if encoder-dim
                         (vector-store/create (idstr-template-string repo) encoder-dim)
                         (throw (js/Error. (str "record modelDim is not found in options of registrated encoder " encoder-name))))
          eid-del->vs (fn [eid]
                       ;; Would replace existing promise in queue (if any)
                       ;; If the promise is already in pending state, 
                       ;; there's a race condition that the promise executed
                       ;; before the pending promise is resolved
                       (let [del->vs (fn [] ;; Promise factory
                                       (vector-store/rm store-conn (str eid)))]
                         (.addTask taskQueue (str eid) del->vs)))
          block-add->vs (fn [block] 
                       ;; Would replace the task if there is already a task with the same id in the queue
                       ;; Here we use stringified id as key to keep consistency with the logMind type annotation
                       (let [add->vs (fn []
                                    (p/let [metadata  {:snippet (gp-util/safe-subs (:content block) 0 20)
                                                       :page    (:page block)
                                                       :id      (:id block)
                                                       :uuid    (:uuid block)}
                                            embeds    (text-encoder/text-encode (:content block) encoder-name)
                                            _         (vector-store/rm store-conn (str (:id block)))
                                            emb-add->vs   (fn [embed]
                                                            (vector-store/add store-conn embed (str (:id block)) (bean/->js metadata)))]
                                      (p/all (mapv emb-add->vs embeds))))]
                         (.addTask taskQueue (str (:id block)) add->vs)))]
      ;; Delete first, then add
      (mapv eid-del->vs blocks-to-remove-set)
      (mapv block-add->vs blocks-to-add)))
  
  (transact-pages! [_this data] 
    (prn "semantic: transact-pages!") ;; TODO Junyi
    (prn data))

  (truncate-blocks! [_this]
                    (-> repo
                        (idstr-template-string)
                        (vector-store/reset))
                    (.clean taskQueue))

  (remove-db! [_this]
              (-> repo
                  (idstr-template-string)
                  (vector-store/reset))
              (.clean taskQueue)))
