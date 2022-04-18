(ns logseq.graph-parser.time-util
  "Time specific utilities"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]))

(defn time-ms
  []
  (tc/to-long (t/now)))
