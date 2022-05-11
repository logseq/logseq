(ns ^:nbb-compatible logseq.graph-parser.date-time-util
  "cljs-time util fns for graph-parser"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]))

(defn time-ms
  "Copy of util/time-ms. Too basic to couple this to main app"
  []
  (tc/to-long (t/now)))
