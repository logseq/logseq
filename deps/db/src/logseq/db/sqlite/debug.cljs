(ns logseq.db.sqlite.debug
  "SQLite debug fns"
  (:require [cljs-bean.core :as bean]
            [clojure.set]
            [logseq.db.sqlite.util :as sqlite-util]))

(defn find-missing-addresses
  "Find missing addresses from the kvs table"
  [^Object db]
  (let [schema (some->> (.exec db #js {:sql "select content from kvs where addr = 0"
                                       :rowMode "array"})
                        bean/->clj
                        ffirst
                        sqlite-util/transit-read)
        result (->> (.exec db #js {:sql "select addr, addresses from kvs"
                                   :rowMode "array"})
                    bean/->clj
                    (keep (fn [[addr addresses]]
                            [addr (bean/->clj (js/JSON.parse addresses))])))
        used-addresses (set (concat (mapcat second result)
                                    [0 1 (:eavt schema) (:avet schema) (:aevt schema)]))]
    (clojure.set/difference used-addresses (set (map first result)))))
