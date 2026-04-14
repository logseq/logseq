;; deps/memo/src/logseq/memo/schema.cljs
(ns logseq.memo.schema)

(def setting-schema
  {:logseq.memo/id           {:db/type :db.type/string
                              :db/unique :db.unique/identity}
   :logseq.memo/type        {:db/type :db.type/keyword}
   :logseq.memo/importance  {:db/type :db.type/keyword}
   :logseq.memo/page-id     {:db/type :db.type/long}
   :logseq.memo/created-at  {:db/type :db.type/instant}
   :logseq.memo/relations   {:db/type :db.type/ref
                              :db/cardinality :db.cardinality/many}})

(def relation-types
  #{:friend :enemy :partner :family :mentor :colleague :rival})

(def setting-types
  #{:character :world :timeline :location :custom})