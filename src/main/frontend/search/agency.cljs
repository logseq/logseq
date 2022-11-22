(ns frontend.search.agency
  "Agent entry for search engine impls"
  (:require [frontend.search.protocol :as protocol]
            [frontend.search.browser :as search-browser]
            [frontend.search.node :as search-node]
            [frontend.search.plugin :as search-plugin]
            [frontend.state :as state]
            [frontend.util :as util]))

(defn get-registered-engines
  [repo]
  (-> (if (util/electron?)
        (search-node/->Node repo)
        (search-browser/->Browser repo))
      (cons
       [(when state/lsp-enabled?
          (for [s (state/get-all-plugin-services-with-type :search)]
            (search-plugin/->Plugin s repo)))])))

(deftype Agency [repo]
  protocol/Engine

  (query [_this q opts]
    (println "D:Search > Query blocks:" repo q opts)
    (let [[e1 e2] (get-registered-engines repo)]
      (doseq [e e2]
        (protocol/query e q opts))
      (protocol/query e1 q opts)))

  (rebuild-blocks-indice! [_this]
    (println "D:Search > Initial blocks indice!:" repo)
    (let [[e1 e2] (get-registered-engines repo)]
      (doseq [e e2]
        (protocol/rebuild-blocks-indice! e))
      (protocol/rebuild-blocks-indice! e1)))

  (transact-blocks! [_this data]
    (println "D:Search > Transact blocks!:" repo)
    (doseq [e (flatten (get-registered-engines repo))]
      (protocol/transact-blocks! e data)))

  (truncate-blocks! [_this]
    (println "D:Search > Truncate blocks!" repo)
    (doseq [e (flatten (get-registered-engines repo))]
      (protocol/truncate-blocks! e)))

  (remove-db! [_this]
    (println "D:Search > Remove Db!" repo)
    (doseq [e (flatten (get-registered-engines repo))]
      (protocol/remove-db! e))))


