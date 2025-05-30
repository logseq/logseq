(ns logseq.db.sqlite.debug
  "SQLite debug fns"
  (:require [cljs-bean.core :as bean]
            [clojure.set]
            [logseq.db.sqlite.util :as sqlite-util]))

(defn find-missing-addresses
  "WASM version to find missing addresses from the kvs table"
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

(defn find-missing-addresses-node-version
  "Node version to find missing addresses from the kvs table"
  [^Object db]
  (let [schema (let [stmt (.prepare db "select content from kvs where addr = ?")
                     content (.-content (.get stmt 0))]
                 (sqlite-util/transit-read content))
        stmt (.prepare db "select addr, addresses from kvs")
        result (->> (.all ^Object stmt)
                    bean/->clj
                    (keep (fn [{:keys [addr addresses]}]
                            [addr (bean/->clj (js/JSON.parse addresses))])))
        used-addresses (set (concat (mapcat second result)
                                    [0 1 (:eavt schema) (:avet schema) (:aevt schema)]))]
    (clojure.set/difference used-addresses  (set (map first result)))))
