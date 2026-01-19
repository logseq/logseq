(ns frontend.worker.rtc.skeleton
  "Validate skeleton data between server and client"
  (:require [clojure.data :as data]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]))

(defn- get-builtin-db-idents
  [db]
  (d/q '[:find [?i ...]
         :in $
         :where
         [?b :db/ident ?i]
         [?b :block/uuid]
         [?b :logseq.property/built-in?]]
       db))

(defn calibrate-graph-skeleton
  [server-schema-version server-builtin-db-idents db]
  (let [client-builtin-db-idents (set (get-builtin-db-idents db))
        client-schema-version (ldb/get-graph-schema-version db)]
    (when-not (zero? (db-schema/compare-schema-version client-schema-version server-schema-version))
      (log/warn "RTC schema error: client version doesn't match server's version"
                [client-schema-version server-schema-version]))
    (let [[client-only server-only _]
          (data/diff client-builtin-db-idents server-builtin-db-idents)]
      (when (or (seq client-only) (seq server-only))
        (log/warn :db-idents-diff {:client-only client-only
                                   :server-only server-only})))))
