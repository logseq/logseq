(ns logseq.db.frontend.query
  "DB views for user query evaluation."
  (:require [datascript.core :as d]))

(defn recycled-eids
  "Entity ids that are recycle roots or descendants via :block/parent or :block/page.

  Roots are entities with :logseq.property/deleted-at. Descendants do not always
  carry that attribute, so query evaluation must collect the full subtree."
  [db]
  (let [roots (into #{} (map :e) (d/datoms db :avet :logseq.property/deleted-at))]
    (loop [seen roots
           pending (seq roots)]
      (if-let [eid (first pending)]
        (let [child-eids (into []
                               (comp cat (remove seen))
                               [(map :e (d/datoms db :avet :block/parent eid))
                                (map :e (d/datoms db :avet :block/page eid))])]
          (recur (into seen child-eids)
                 (concat (rest pending) child-eids)))
        seen))))

(defn- ref-idents
  [db]
  (into #{}
        (keep (fn [[attr spec]]
                (when (= :db.type/ref (:db/valueType spec))
                  attr)))
        (:schema db)))

(defn- build-without-recycled
  [db]
  (let [recycled (recycled-eids db)]
    (if (empty? recycled)
      db
      (let [ref-attr-idents (ref-idents db)]
        (d/filter db
                  (fn [_db datom]
                    (not (or (contains? recycled (:e datom))
                             (and (contains? ref-attr-idents (:a datom))
                                  (contains? recycled (:v datom)))))))))))

;; One-slot cache for the current Datascript snapshot. Renderer/query
;; paths often run many queries against the same db value; rebuilding
;; the recycled-id set is the expensive part. Do not memoize every db
;; (that would retain previous graphs).
(def ^:private *without-recycled-cache (volatile! nil))

(defn without-recycled
  "Return a DB in which recycled entities (and refs to them) are invisible.

  User queries should run against this view so soft-deleted rows cannot
  participate in joins, not, or, or aggregates. Recycle UI and internal
  lookups should keep using the raw DB.

  Recycled ids are collected once per db snapshot and reused while that
  snapshot is still being queried."
  [db]
  (let [cached @*without-recycled-cache]
    (if (identical? db (:source cached))
      (:query-db cached)
      (let [query-db (build-without-recycled db)]
        (vreset! *without-recycled-cache {:source db :query-db query-db})
        query-db))))
