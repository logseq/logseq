(ns frontend.worker.react
  "Compute reactive query affected keys"
  (:require [cljs.spec.alpha :as s]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.property :as db-property]))

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
;; get class's objects
(s/def ::objects (s/tuple #(= ::objects %) int?))
;; get block reactions
(s/def ::block-reactions (s/tuple #(= ::block-reactions %) int?))
;; recycle roots list
(s/def ::recycle-roots (s/tuple #(= ::recycle-roots %)))
;; custom react-query
(s/def ::custom any?)

(s/def ::react-query-keys (s/or :block ::block
                                :journals ::journals
                                :refs ::refs
                                :objects ::objects
                                :block-reactions ::block-reactions
                                :recycle-roots ::recycle-roots
                                :custom ::custom))

(s/def ::affected-keys (s/coll-of ::react-query-keys))

(defn- journal-page?
  [db eid journal-tag-id]
  (when (and db eid journal-tag-id)
    (some (fn [tag]
            (= journal-tag-id (:db/id tag)))
          (:block/tags (d/entity db eid)))))

(def ^:private block-query-affecting-attrs
  #{:logseq.property/order-list-type})

(def ^:private order-list-affecting-attrs
  #{:block/parent :block/page :block/order :logseq.property/order-list-type})

(defn- block-attr?
  [attr]
  (= "block" (namespace attr)))

(defn- block-query-affecting-attr?
  [attr]
  (or (block-attr? attr)
      (contains? block-query-affecting-attrs attr)))

(defn- block-key
  [block]
  [::block (:db/id block)])

(defn- order-list-type
  [block]
  (db-property/lookup block :logseq.property/order-list-type))

(defn- sibling-entities
  [block]
  (cond
    (:block/parent block)
    (some-> (:block/parent block) :block/_parent)

    (:block/page block)
    (some-> (:block/page block) :block/_page)

    :else
    nil))

(defn- ordered-siblings
  [block]
  (some->> (sibling-entities block)
           (sort-by :block/order)))

(defn- right-ordered-siblings
  [block]
  (when-let [siblings (seq (ordered-siblings block))]
    (->> siblings
         (drop-while #(not= (:db/id %) (:db/id block)))
         rest)))

(defn- collect-right-order-list-sibling-keys
  [siblings target-order-list-type]
  (when target-order-list-type
    (->> siblings
         (take-while #(= target-order-list-type (order-list-type %)))
         (map block-key))))

(defn- affected-right-order-list-sibling-keys
  [db block-id]
  (when-let [block (and db (d/entity db block-id))]
    (let [right-siblings (right-ordered-siblings block)
          right-sibling (first right-siblings)]
      (concat
       (collect-right-order-list-sibling-keys right-siblings (order-list-type block))
       (collect-right-order-list-sibling-keys right-siblings (order-list-type right-sibling))))))

(defn- affected-order-list-descendant-keys
  [db block-id]
  (when-let [block (and db (d/entity db block-id))]
    (letfn [(collect [parent]
              (when-let [parent-list-type (order-list-type parent)]
                (mapcat
                 (fn [child]
                   (when (= parent-list-type (order-list-type child))
                     (cons (block-key child) (collect child))))
                 (:block/_parent parent))))]
      (collect block))))

(defn- affected-block-keys
  [block]
  (let [page-id (or
                 (when (:block/name block) (:db/id block))
                 (:db/id (:block/page block)))
        blocks [(when-let [parent-id (:db/id (:block/parent block))]
                  [::block parent-id])
                [::block (:db/id block)]]
        refs (->> (keep (fn [ref]
                          (when-not (= (:db/id ref) page-id)
                            [[::refs (:db/id ref)]
                             [::block (:db/id ref)]])) (:block/refs block))
                  (apply concat))]
    (concat blocks refs)))

(defn get-affected-queries-keys
  "Get affected queries through transaction datoms."
  [{:keys [tx-data db-before db-after]}]
  {:post [(s/valid? ::affected-keys %)]}
  (let [blocks (->> (filter (fn [datom] (contains? #{:block/parent :block/page} (:a datom))) tx-data)
                    (map :v)
                    (distinct))
        refs (->> (filter (fn [datom]
                            (when (contains? #{:block/refs} (:a datom))
                              (not= (:v datom)
                                    (:db/id (:block/page (d/entity db-after (:e datom))))))) tx-data)
                  (map :v)
                  (distinct))
        tags (->> (filter (fn [datom] (= :block/tags (:a datom))) tx-data)
                  (map :v)
                  (distinct))
        journal-tag-id (:db/id (d/entity db-after :logseq.class/Journal))
        touched-eids (->> tx-data (map :e) distinct)
        journals? (or (some (fn [datom]
                              (and (= :block/tags (:a datom))
                                   (= journal-tag-id (:v datom))))
                            tx-data)
                      (some (fn [datom]
                              (= :block/journal-day (:a datom)))
                            tx-data)
                      (some (fn [eid]
                              (or (journal-page? db-before eid journal-tag-id)
                                  (journal-page? db-after eid journal-tag-id)))
                            touched-eids))
        reaction-targets (->> (filter (fn [datom]
                                        (= :logseq.property.reaction/target (:a datom))) tx-data)
                              (map :v)
                              (distinct))
        recycle-roots? (some (fn [datom]
                               (= :logseq.property/deleted-at (:a datom)))
                             tx-data)
        other-blocks (->> (filter (fn [datom] (block-query-affecting-attr? (:a datom))) tx-data)
                          (map :e))
        order-list-affected-blocks (->> (filter (fn [datom]
                                                  (contains? order-list-affecting-attrs (:a datom))) tx-data)
                                        (map :e)
                                        (distinct))
        blocks (-> (concat blocks other-blocks) distinct)
        block-entities (keep (fn [block-id]
                               (let [block-id (if (and (string? block-id) (common-util/uuid-string? block-id))
                                                [:block/uuid block-id]
                                                block-id)]
                                 (d/entity db-after block-id))) blocks)
        affected-keys (concat
                       (mapcat
                        affected-block-keys
                        block-entities)

                       (mapcat
                        (fn [ref]
                          [[::refs ref]
                           [::block ref]])
                        refs)

                       (mapcat
                        (fn [target-id]
                          [[::block-reactions target-id]
                           [::block target-id]])
                        reaction-targets)

                       (mapcat
                        (fn [block-id]
                          (concat
                           (affected-right-order-list-sibling-keys db-before block-id)
                           (affected-right-order-list-sibling-keys db-after block-id)
                           (affected-order-list-descendant-keys db-before block-id)
                           (affected-order-list-descendant-keys db-after block-id)))
                        order-list-affected-blocks)

                       (keep
                        (fn [tag]
                          (when tag [::objects tag]))
                        tags)

                       (when recycle-roots?
                         [[::recycle-roots]])

                       (when journals?
                         [[::journals]]))]
    (->>
     affected-keys
     (remove nil?)
     distinct)))
