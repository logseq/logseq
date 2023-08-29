(ns frontend.search.agency
  "Agent entry for search engine impls"
  (:require [frontend.search.protocol :as protocol]
            [frontend.search.browser :as search-browser]
            [frontend.search.node :as search-node]
            [frontend.search.plugin :as search-plugin]
            [frontend.search.semantic :as search-semantic]
            [frontend.state :as state]
            [frontend.util :as util]))

(defn get-registered-engines
  [repo]
  [(if (util/electron?)
     (search-node/->Node repo)
     (search-browser/->Browser repo))
   (when state/lsp-enabled?
     (for [s (state/get-all-plugin-services-with-type :search)]
       (search-plugin/->Plugin s repo)))
   (when (state/semsearch-enabled?)
     (search-semantic/->Semantic repo))])

(defn- get-flatten-registered-engines
  [repo]
  (->> (flatten (get-registered-engines repo))
       (remove nil?)))

(deftype Agency [repo]
  protocol/Engine

  (query [_this q opts]
    (println "D:Search > Query blocks:" repo q opts)
    (let [[e1 e2 e3] (get-registered-engines repo)]
      (doseq [e e2] ;; Plugin Engines
        (protocol/query e q opts))
      (when e3 ;; Semantic Engine
        (protocol/query e3 q opts))
      ;; Return the promise of the integrated search
      (protocol/query e1 q opts)))

  (query-page [_this q opts]
    (println "D:Search > Query-page contents:" repo q opts)
    (let [[e1 e2 e3] (get-registered-engines repo)]
      (doseq [e e2] ;; Plugin Engines
        (protocol/query-page e q opts))
      (when e3 ;; Semantic Engine
        (protocol/query-page e3 q opts))
      ;; Return the promise of the integrated search
      (protocol/query-page e1 q opts)))

  (rebuild-blocks-indice! [_this]
    (println "D:Search > Initial blocks indice!:" repo)
    (let [[e1 e2 e3] (get-registered-engines repo)]
      (doseq [e e2] ;; Plugin Engines
        (protocol/rebuild-blocks-indice! e))
      (when e3 ;; Semantic Engine
        (protocol/rebuild-blocks-indice! e3))
      ;; Return the promise of the integrated search
      (protocol/rebuild-blocks-indice! e1)))

  (transact-blocks! [_this data]
    (doseq [e (get-flatten-registered-engines repo)]
      (protocol/transact-blocks! e data)))

  (transact-pages! [_this data]
    (doseq [e (get-flatten-registered-engines repo)]
      (protocol/transact-pages! e data)))

  (truncate-blocks! [_this]
    (println "D:Search > Truncate blocks!" repo)
    (doseq [e (get-flatten-registered-engines repo)]
      (protocol/truncate-blocks! e)))

  (remove-db! [_this]
    (println "D:Search > Remove Db!" repo)
    (doseq [e (get-flatten-registered-engines repo)]
      (protocol/remove-db! e))))
