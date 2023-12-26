(ns frontend.worker.react
  "Compute reactive query affected keys"
  (:require [datascript.core :as d]
            [frontend.worker.util :as util]
            [cljs.spec.alpha :as s]))

;;; keywords specs for reactive query, used by `react/q` calls
;; ::block
;; pull-block react-query
(s/def ::block (s/tuple #(= ::block %) int?))
;; ::block-and-children
;; get block&children react-query
(s/def ::block-and-children (s/tuple #(= ::block-and-children %) uuid?))

;; ::journals
;; get journal-list react-query
(s/def ::journals (s/tuple #(= ::journals %)))
;; ::page<-pages
;; get PAGES referencing PAGE
(s/def ::page<-pages (s/tuple #(= ::page<-pages %) int?))
;; ::refs
;; get BLOCKS referencing PAGE or BLOCK
(s/def ::refs (s/tuple #(= ::refs %) int?))
;; custom react-query
(s/def ::custom any?)

(s/def ::react-query-keys (s/or :block ::block
                                :block-and-children ::block-and-children
                                :journals ::journals
                                :page<-pages ::page<-pages
                                :refs ::refs
                                :custom ::custom))

(s/def ::affected-keys (s/coll-of ::react-query-keys))

(defn- get-block-parents
  [db id]
  (let [get-parent (fn [id] (:db/id (:block/parent (d/entity db id))))]
    (loop [result [id]
           id id]
      (if-let [parent (get-parent id)]
        (recur (conj result parent) parent)
        result))))

(defn- get-blocks-parents-from-both-dbs
  [db-after db-before block-entities]
  (let [current-db-parent-ids (->> (set (keep :block/parent block-entities))
                                   (mapcat (fn [parent]
                                             (get-block-parents db-after (:db/id parent)))))
        before-db-parent-ids (->> (map :db/id block-entities)
                                  (mapcat (fn [id]
                                            (get-block-parents db-before id))))]
    (set (concat current-db-parent-ids before-db-parent-ids))))

(defn get-affected-queries-keys
  "Get affected queries through transaction datoms."
  [{:keys [tx-data db-before db-after]} {:keys [current-page-id query-keys]}]
  {:post [(s/valid? ::affected-keys %)]}
  (let [blocks (->> (filter (fn [datom] (contains? #{:block/left :block/parent :block/page} (:a datom))) tx-data)
                    (map :v)
                    (distinct))
        refs (->> (filter (fn [datom]
                            (when (contains? #{:block/refs :block/path-refs} (:a datom))
                              (not= (:v datom)
                                    (:db/id (:block/page (d/entity db-after (:e datom))))))) tx-data)
                  (map :v)
                  (distinct))
        other-blocks (->> (filter (fn [datom] (= "block" (namespace (:a datom)))) tx-data)
                          (map :e))
        blocks (-> (concat blocks other-blocks) distinct)
        block-entities (keep (fn [block-id]
                               (let [block-id (if (and (string? block-id) (util/uuid-string? block-id))
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

                       (when current-page-id
                         [[::page<-pages current-page-id]]))
        parent-ids (get-blocks-parents-from-both-dbs db-after db-before block-entities)
        block-children-keys (->>
                             query-keys
                             (keep (fn [ks]
                                     (when (and (= ::block-and-children (second ks))
                                                (contains? parent-ids (last ks)))
                                       (vec (rest ks))))))]
    (->>
     (concat
      affected-keys
      block-children-keys)
     (remove nil?)
     distinct)))
