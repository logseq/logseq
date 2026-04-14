;; src/main/frontend/modules/memo/schema.cljs
(ns frontend.modules.memo.schema
  (:require [logseq.memo.schema :as memo-schema]))

(def setting-schema memo-schema/setting-schema)
(def relation-types memo-schema/relation-types)
(def setting-types memo-schema/setting-types)