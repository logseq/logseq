(ns logseq.common.profile
  "Utils for profiling"
  (:require-macros [logseq.common.profile]))

(def *key->call-count
  "key -> count"
  (volatile! {}))

(def *key->time-sum
  "docstring"
  (volatile! {}))
