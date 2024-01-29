(ns frontend.db.async.util
  "Async util helper"
  (:require [frontend.state :as state]
            [promesa.core :as p]
            [clojure.edn :as edn]))

(defn <q
  [graph & inputs]
  (assert (not-any? fn? inputs) "Async query inputs can't include fns because fn can't be serialized")
  (when-let [sqlite @state/*db-worker]
    (p/let [result (.q sqlite graph (pr-str inputs))]
      (when result
        (edn/read-string result)))))
