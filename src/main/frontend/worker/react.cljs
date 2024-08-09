(ns frontend.worker.react
  "Compute reactive query affected keys"
  (:require [datascript.core :as d]
            [logseq.common.util :as common-util]
            [cljs.spec.alpha :as s]))

;;; keywords specs for reactive query, used by `react/q` calls
;; ::block
;; pull-block react-query
(s/def ::block (s/tuple #(= ::block %) int?))

;; ::journals
;; get journal-list react-query
(s/def ::journals (s/tuple #(= ::journals %)))
;; ::refs
;; get BLOCKS referencing PAGE or BLOCK
(s/def ::refs (s/tuple #(= ::refs %) int?))
;; get class's Objects
(s/def ::objects (s/tuple #(= ::objects %) int?))
;; custom react-query
(s/def ::custom any?)

(s/def ::react-query-keys (s/or :block ::block
                                :journals ::journals
                                :refs ::refs
                                :objects ::objects
                                :custom ::custom))

(s/def ::affected-keys (s/coll-of ::react-query-keys))

(defn get-affected-queries-keys
  "Get affected queries through transaction datoms."
  [{:keys [tx-data db-after]}]
  {:post [(s/valid? ::affected-keys %)]}
  (let [blocks (->> (filter (fn [datom] (contains? #{:block/parent :block/page} (:a datom))) tx-data)
                    (map :v)
                    (distinct))
        refs (->> (filter (fn [datom]
                            (when (contains? #{:block/refs :block/path-refs} (:a datom))
                              (not= (:v datom)
                                    (:db/id (:block/page (d/entity db-after (:e datom))))))) tx-data)
                  (map :v)
                  (distinct))
        tags (->> (filter (fn [datom] (contains? #{:block/tags} (:a datom))) tx-data)
                  (map :v)
                  (distinct))
        other-blocks (->> (filter (fn [datom] (= "block" (namespace (:a datom)))) tx-data)
                          (map :e))
        blocks (-> (concat blocks other-blocks) distinct)
        block-entities (keep (fn [block-id]
                               (let [block-id (if (and (string? block-id) (common-util/uuid-string? block-id))
                                                [:block/uuid block-id]
                                                block-id)]
                                 (d/entity db-after block-id))) blocks)
        affected-keys (concat
                       (mapcat
                        (fn [block]
                          (let [page-id (or
                                         (when (:block/name block) (:db/id block))
                                         (:db/id (:block/page block)))
                                blocks [(when-let [parent-id (:db/id (:block/parent block))]
                                          [::block parent-id])
                                        [::block (:db/id block)]]
                                path-refs (:block/path-refs block)
                                path-refs' (->> (keep (fn [ref]
                                                        (when-not (= (:db/id ref) page-id)
                                                          [[::refs (:db/id ref)]
                                                           [::block (:db/id ref)]])) path-refs)
                                                (apply concat))]
                            (concat blocks path-refs')))
                        block-entities)

                       (mapcat
                        (fn [ref]
                          [[::refs ref]
                           [::block ref]])
                        refs)

                       (keep
                        (fn [tag]
                          (when tag [::objects tag]))
                        tags))]
    (->>
     affected-keys
     (remove nil?)
     distinct)))
