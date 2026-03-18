(ns logseq.undo-redo-validate
  "Undo redo validate"
  (:require [clojure.set :as set]
            [datascript.core :as d]
            [logseq.db :as ldb]))

(def ^:private structural-attrs
  #{:block/uuid :block/parent :block/page})

(def ^:private ref-attrs
  #{:block/parent :block/page})

(def ^:private recycle-attrs
  #{:logseq.property/deleted-at
    :logseq.property/deleted-by-ref
    :logseq.property.recycle/original-parent
    :logseq.property.recycle/original-page
    :logseq.property.recycle/original-order})

(defn- recycle-tx-item?
  [item]
  (cond
    (map? item)
    (some recycle-attrs (keys item))

    (vector? item)
    (contains? recycle-attrs (nth item 2 nil))

    (d/datom? item)
    (contains? recycle-attrs (:a item))

    :else false))

(defn- recycle-tx?
  [tx-data]
  (boolean (some recycle-tx-item? tx-data)))

(defn- structural-tx-item?
  [item]
  (cond
    (map? item)
    (some structural-attrs (keys item))

    (vector? item)
    (let [op (first item)
          a (nth item 2 nil)]
      (or (= :db/retractEntity op)
          (contains? structural-attrs a)))

    (d/datom? item)
    (contains? structural-attrs (:a item))

    :else false))

(defn- structural-tx?
  [tx-data]
  (boolean (some structural-tx-item? tx-data)))

(defn- resolve-entity-id
  [db value]
  (cond
    (int? value) value
    (vector? value) (d/entid db value)
    :else nil))

(defn- tx-entity-ids
  [db tx-data]
  (->> tx-data
       (keep (fn [item]
               (cond
                 (vector? item)
                 (let [e (second item)]
                   (resolve-entity-id db e))

                 (d/datom? item)
                 (resolve-entity-id db (:e item))

                 (map? item)
                 (or (resolve-entity-id db (:db/id item))
                     (resolve-entity-id db [:block/uuid (:block/uuid item)]))

                 :else nil)))
       (remove nil?)
       set))

(defn- entities-exist?
  [db tx-data]
  (every? (fn [id]
            (when id
              (d/entity db id)))
          (tx-entity-ids db tx-data)))

(defn- entity-has-identity?
  [ent]
  (or (:block/uuid ent)
      (:db/ident ent)))

(defn- recycle-entities-valid?
  [db tx-data]
  (every? (fn [id]
            (when-let [ent (d/entity db id)]
              (entity-has-identity? ent)))
          (tx-entity-ids db tx-data)))

(defn- parent-cycle?
  [ent]
  (let [start (:block/uuid ent)]
    (loop [current ent
           seen #{start}
           steps 0]
      (cond
        (>= steps 200) true
        (nil? (:block/parent current)) false
        :else (let [next-ent (:block/parent current)
                    next-uuid (:block/uuid next-ent)]
                (if (contains? seen next-uuid)
                  true
                  (recur next-ent (conj seen next-uuid) (inc steps))))))))

(defn- issues-for-entity-ids
  [db ids]
  (let [id->ent (->> ids
                     (keep (fn [id]
                             (when-let [ent (d/entity db id)]
                               (when (:db/id ent)
                                 [id ent]))))
                     (into {}))
        ents (vals id->ent)
        structural-ids (->> id->ent
                            (keep (fn [[id ent]]
                                    (when (or (:block/title ent)
                                              (:block/page ent)
                                              (:block/parent ent)
                                              (:block/order ent))
                                      id)))
                            set)]
    (concat
     (for [e structural-ids
           :let [ent (get id->ent e)]
           :when (nil? (:block/uuid ent))]
       {:type :missing-uuid :e e})
     (for [ent ents
           :let [block-uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and (contains? structural-ids (:db/id ent))
                      (not (ldb/page? ent))
                      (nil? parent))]
       {:type :missing-parent :uuid block-uuid})
     (for [ent ents
           :let [block-uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and (contains? structural-ids (:db/id ent))
                      (not (ldb/page? ent))
                      parent
                      (nil? (:block/uuid parent)))]
       {:type :missing-parent-ref :uuid block-uuid})
     (for [ent ents
           :let [block-uuid (:block/uuid ent)
                 page (:block/page ent)]
           :when (and (contains? structural-ids (:db/id ent))
                      (not (ldb/page? ent))
                      (nil? page))]
       {:type :missing-page :uuid block-uuid})
     (for [ent ents
           :let [block-uuid (:block/uuid ent)
                 page (:block/page ent)]
           :when (and (contains? structural-ids (:db/id ent))
                      (not (ldb/page? ent))
                      page
                      (not (ldb/page? page)))]
       {:type :page-not-page :uuid block-uuid})
     (for [ent ents
           :let [block-uuid (:block/uuid ent)
                 parent (:block/parent ent)
                 page (:block/page ent)
                 expected-page (when parent
                                 (if (ldb/page? parent) parent (:block/page parent)))]
           :when (and (contains? structural-ids (:db/id ent))
                      (not (ldb/page? ent))
                      parent
                      page
                      expected-page
                      (not= (:block/uuid expected-page) (:block/uuid page)))]
       {:type :page-mismatch :uuid block-uuid})
     (for [ent ents
           :let [block-uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and (contains? structural-ids (:db/id ent))
                      parent
                      (= block-uuid (:block/uuid parent)))]
       {:type :self-parent :uuid block-uuid})
     (for [ent ents
           :let [block-uuid (:block/uuid ent)]
           :when (and (contains? structural-ids (:db/id ent))
                      (not (ldb/page? ent))
                      (parent-cycle? ent))]
       {:type :cycle :uuid block-uuid}))))

(defn- retract-entity-ids
  [db-before tx-data]
  (->> tx-data
       (keep (fn [item]
               (when (and (vector? item) (= :db/retractEntity (first item)))
                 (second item))))
       (map (fn [id] (d/entid db-before id)))
       (filter int?)))

(defn- affected-entity-ids
  [db-before {:keys [tx-data]} original-tx-data]
  (let [tx-ids (->> tx-data
                    (mapcat (fn [[e a v _tx _added]]
                              (cond-> #{e}
                                (and (contains? ref-attrs a) (int? v)) (conj v)
                                (and (contains? ref-attrs a) (vector? v))
                                (conj (d/entid db-before v)))))
                    (remove nil?)
                    set)
        retract-ids (retract-entity-ids db-before original-tx-data)
        child-ids (mapcat (fn [id]
                            (when-let [ent (d/entity db-before id)]
                              (map :db/id (:block/_parent ent))))
                          retract-ids)]
    (-> tx-ids
        (into retract-ids)
        (into child-ids))))

(defn- warn-invalid!
  [data]
  (js/console.warn "undo-redo-invalid" (clj->js data)))

(defn- log-validate-error!
  [error]
  (js/console.error "undo-redo-validate-failed" error))

(defn valid-undo-redo-tx?
  [conn tx-data]
  (try
    (if (recycle-tx? tx-data)
      (if (recycle-entities-valid? @conn tx-data)
        true
        (do
          (warn-invalid! {:reason :invalid-recycle-entities})
          false))
      (if-not (structural-tx? tx-data)
        (if (entities-exist? @conn tx-data)
          true
          (do
            (warn-invalid! {:reason :missing-entities})
            false))
        (let [db-before @conn
              tx-report (d/with db-before tx-data)
              db-after (:db-after tx-report)
              affected-ids (affected-entity-ids db-before tx-report tx-data)
              baseline-issues (if (seq affected-ids)
                                (set (issues-for-entity-ids db-before affected-ids))
                                #{})
              after-issues (if (seq affected-ids)
                             (set (issues-for-entity-ids db-after affected-ids))
                             #{})
              new-issues (seq (set/difference after-issues baseline-issues))]
          (when (seq new-issues)
            (warn-invalid! {:issues (take 5 new-issues)}))
          (empty? new-issues))))
    (catch :default e
      (log-validate-error! e)
      false)))
