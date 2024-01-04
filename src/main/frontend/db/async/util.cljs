(ns frontend.db.async.util
  "Async util helper"
  (:require [frontend.persist-db.browser :as db-browser]
            [cljs-bean.core :as bean]
            [promesa.core :as p]))

(defn <q
  [graph & inputs]
  (assert (not-any? fn? inputs) "Async query inputs can't include fns because fn can't be serialized")
  (when-let [sqlite @db-browser/*sqlite]
    (p/let [result (.q sqlite graph (pr-str inputs))]
      (bean/->clj result))))
