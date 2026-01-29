(ns frontend.worker.undo-redo
  "Undo redo validate"
  (:require [clojure.set :as set]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]))

(def ^:private structural-attrs
  #{:block/uuid :block/parent :block/page})

(def ^:private ref-attrs
  #{:block/parent :block/page})

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

(defn- db-issues
  [db]
  (let [ents (->> (d/q '[:find [?e ...]
                         :where
                         [?e :block/uuid]]
                       db)
                  (map (fn [e] (d/entity db e))))
        uuid-required-ids (->> (concat
                                (d/q '[:find [?e ...]
                                       :where
                                       [?e :block/title]]
                                     db)
                                (d/q '[:find [?e ...]
                                       :where
                                       [?e :block/page]]
                                     db)
                                (d/q '[:find [?e ...]
                                       :where
                                       [?e :block/parent]]
                                     db))
                               distinct)]
    (concat
     (for [e uuid-required-ids
           :let [ent (d/entity db e)]
           :when (nil? (:block/uuid ent))]
       {:type :missing-uuid :e e})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and (not (ldb/page? ent)) (nil? parent))]
       {:type :missing-parent :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and (not (ldb/page? ent)) parent (nil? (:block/uuid parent)))]
       {:type :missing-parent-ref :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 page (:block/page ent)]
           :when (and (not (ldb/page? ent)) (nil? page))]
       {:type :missing-page :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 page (:block/page ent)]
           :when (and (not (ldb/page? ent)) page (not (ldb/page? page)))]
       {:type :page-not-page :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)
                 page (:block/page ent)
                 expected-page (when parent
                                 (if (ldb/page? parent) parent (:block/page parent)))]
           :when (and (not (ldb/page? ent))
                      parent
                      page
                      expected-page
                      (not= (:block/uuid expected-page) (:block/uuid page)))]
       {:type :page-mismatch :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and parent (= uuid (:block/uuid parent)))]
       {:type :self-parent :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)]
           :when (and (not (ldb/page? ent))
                      (parent-cycle? ent))]
       {:type :cycle :uuid uuid}))))

(defn- issues-for-entity-ids
  [db ids]
  (let [id->ent (->> ids
                     (keep (fn [id]
                             (when-let [ent (d/entity db id)]
                               (when (:db/id ent)
                                 [id ent]))))
                     (into {}))
        ents (vals id->ent)
        uuid-required-ids (keep (fn [[id ent]]
                                  (when (or (:block/title ent)
                                            (:block/page ent)
                                            (:block/parent ent))
                                    id))
                                id->ent)]
    (concat
     (for [e uuid-required-ids
           :let [ent (get id->ent e)]
           :when (nil? (:block/uuid ent))]
       {:type :missing-uuid :e e})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and (not (ldb/page? ent)) (nil? parent))]
       {:type :missing-parent :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and (not (ldb/page? ent)) parent (nil? (:block/uuid parent)))]
       {:type :missing-parent-ref :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 page (:block/page ent)]
           :when (and (not (ldb/page? ent)) (nil? page))]
       {:type :missing-page :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 page (:block/page ent)]
           :when (and (not (ldb/page? ent)) page (not (ldb/page? page)))]
       {:type :page-not-page :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)
                 page (:block/page ent)
                 expected-page (when parent
                                 (if (ldb/page? parent) parent (:block/page parent)))]
           :when (and (not (ldb/page? ent))
                      parent
                      page
                      expected-page
                      (not= (:block/uuid expected-page) (:block/uuid page)))]
       {:type :page-mismatch :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and parent (= uuid (:block/uuid parent)))]
       {:type :self-parent :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)]
           :when (and (not (ldb/page? ent))
                      (parent-cycle? ent))]
       {:type :cycle :uuid uuid}))))

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

(defn valid-undo-redo-tx?
  [conn tx-data]
  (try
    (if-not (structural-tx? tx-data)
      true
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
          (log/warn ::undo-redo-invalid {:issues (take 5 new-issues)}))
        (empty? new-issues)))
    (catch :default e
      (log/error ::undo-redo-validate-failed e)
      false)))
