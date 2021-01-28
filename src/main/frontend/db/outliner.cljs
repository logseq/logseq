(ns frontend.db.outliner
  (:require [datascript.core :as d]))

(defn get-by-id
  [conn id]
  (let [r (d/q '[:find (pull ?a [*])
                 :in $ ?id
                 :where
                 [?a :block/id ?id]]
               @conn id)]
    (ffirst r)))

(defn get-by-parent-id
  [conn id]
  (let [r (d/q '[:find (pull ?a [*])
                 :in $ ?id
                 :where
                 [?a :block/parent-id ?id]]
               @conn id)]
    (flatten r)))

(defn get-by-left-id
  [conn id]
  (let [r (d/q '[:find (pull ?a [*])
                 :in $ ?id
                 :where
                 [?a :block/left-id ?id]]
               @conn id)]
    (ffirst r)))