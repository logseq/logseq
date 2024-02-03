(ns frontend.db.async.util
  "Async util helper"
  (:require [frontend.state :as state]
            [promesa.core :as p]
            [clojure.edn :as edn]
            [frontend.db.conn :as db-conn]
            [datascript.core :as d]))

(defn <q
  [graph & inputs]
  (assert (not-any? fn? inputs) "Async query inputs can't include fns because fn can't be serialized")
  (when-let [^Object sqlite @state/*db-worker]
    (p/let [result (.q sqlite graph (pr-str inputs))]
      (when result
        (let [result' (edn/read-string result)]
          (when (seq result')
            (when-let [conn (db-conn/get-db graph false)]
              (let [tx-data (if (and (coll? result')
                                     (coll? (first result'))
                                     (not (map? (first result'))))
                              (apply concat result')
                              result')]
                (d/transact! conn tx-data))))
          result')))))

(defn <pull
  ([graph id]
   (<pull graph '[*] id))
  ([graph selector id]
   (when-let [^Object sqlite @state/*db-worker]
     (p/let [result (.pull sqlite graph (pr-str selector) (pr-str id))]
       (when result
         (let [result' (edn/read-string result)]
           (when-let [conn (db-conn/get-db graph false)]
             (d/transact! conn [result']))
           result'))))))

(comment
  (defn <pull-many
   [graph selector ids]
   (assert (seq ids))
   (when-let [^Object sqlite @state/*db-worker]
     (p/let [result (.pull-many sqlite graph (pr-str selector) (pr-str ids))]
       (when result
         (edn/read-string result))))))
