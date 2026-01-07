(ns logseq.worker-sync.test-sql
  (:require [clojure.string :as string]))

(defn- js-row [m]
  (let [o (js-obj)]
    (doseq [[k v] m]
      (aset o (name k) v))
    o))

(defn- js-rows [rows]
  (into-array (map js-row rows)))

(defn make-sql []
  (let [state (atom {:tx-log {}
                     :meta {}})]
    #js {:exec (fn [sql & args]
                 (cond
                   (string/includes? sql "insert into tx_log")
                   (let [[t tx created-at] args]
                     (swap! state update :tx-log assoc t {:t t :tx tx :created_at created-at})
                     nil)

                   (string/includes? sql "select t, tx from tx_log")
                   (let [since (first args)
                         rows (->> (:tx-log @state)
                                   vals
                                   (filter (fn [row] (> (:t row) since)))
                                   (sort-by :t)
                                   (map (fn [row] {:t (:t row) :tx (:tx row)})))]
                     (js-rows rows))

                   (string/includes? sql "insert into sync_meta")
                   (let [[k v] args]
                     (swap! state update :meta assoc k v)
                     nil)

                   (string/includes? sql "select value from sync_meta")
                   (let [k (first args)
                         value (get-in @state [:meta k])]
                     (if (some? value)
                       (js-rows [{:value value}])
                       (js-rows [])))

                   :else
                   nil))}))
