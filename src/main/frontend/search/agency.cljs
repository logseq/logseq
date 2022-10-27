(ns frontend.search.agency
  "Agent entry for search engine impls"
  (:require [frontend.search.protocol :as protocol]
            [frontend.search.browser :as search-browser]
            [frontend.search.node :as search-node]
            [frontend.util :as util]))


(defn get-registered-engines
  [repo]
  (-> (if (util/electron?)
        (search-node/->Node repo)
        (search-browser/->Browser repo))
      (cons [[]])))

(deftype Agency [repo]
  protocol/Engine

  (query [_this q opts]
    (prn "D:Search > Do Search Blocks:" repo q opts)
    (let [[e1 e2] (get-registered-engines repo)]
      (doseq [e e2]
        (protocol/query e q opts))
      (protocol/query e1 q opts)))

  (rebuild-blocks-indice! [_this]
    (prn "D:Search > Initial blocks indice!:" repo)
    (let [[e1 e2] (get-registered-engines repo)]
      (doseq [e e2]
        (protocol/rebuild-blocks-indice! e))
      (protocol/rebuild-blocks-indice! e1)))

  (transact-blocks! [_this data]
    (prn "D:Search > Transact blocks!:" data)
    (doseq [e (flatten (get-registered-engines repo))]
      (protocol/transact-blocks! e data)))

  (truncate-blocks! [_this]
    (prn "D:Search > Truncate blocks!")
    (doseq [e (flatten (get-registered-engines repo))]
      (protocol/truncate-blocks! e)))

  (remove-db! [_this]
    (prn "D:Search > Remove DB!")
    (doseq [e (flatten (get-registered-engines repo))]
      (protocol/remove-db! e))))


