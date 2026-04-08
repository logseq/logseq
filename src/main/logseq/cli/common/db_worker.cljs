(ns logseq.cli.common.db-worker
  "Cli fns for use with db-worker"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]))

(defn- minimal-list-item
  [e]
  (cond-> {:db/id (:db/id e)
           :block/title (:block/title e)
           :block/created-at (:block/created-at e)
           :block/updated-at (:block/updated-at e)}
    (:db/ident e) (assoc :db/ident (:db/ident e))
    (:logseq.property/type e) (assoc :logseq.property/type (:logseq.property/type e))))

(defn- normalize-cardinality
  [value]
  (or value :db.cardinality/one))

(defn list-properties
  "List properties for CLI"
  [db {:keys [expand include-built-in] :as options}]
  (let [include-built-in? (if (contains? options :include-built-in) include-built-in true)]
    (->> (d/datoms db :avet :block/tags :logseq.class/Property)
         (map #(d/entity db (:e %)))
         (remove (fn [e]
                   (and (not include-built-in?)
                        (ldb/built-in? e))))
         #_((fn [x] (prn :prop-keys (distinct (mapcat keys x))) x))
         (map (fn [e]
                (if expand
                  (cond-> (assoc (into {} e) :db/id (:db/id e))
                    true
                    (dissoc :block/tags :block/order :block/refs :block/name :db/index
                            :logseq.property.embedding/hnsw-label-updated-at :logseq.property/default-value)
                    true
                    (update :block/uuid str)
                    (:logseq.property/classes e)
                    (update :logseq.property/classes #(mapv :db/ident %))
                    (:logseq.property/description e)
                    (update :logseq.property/description db-property/property-value-content))
                  ;; Keep property type and cardinality in default list output (without --expand).
                  (assoc (minimal-list-item e)
                         :logseq.property/type (:logseq.property/type e)
                         :db/cardinality (normalize-cardinality (:db/cardinality e)))))))))

(defn list-tags
  "List tags for CLI"
  [db {:keys [expand include-built-in] :as options}]
  (let [include-built-in? (if (contains? options :include-built-in) include-built-in true)]
    (->> (d/datoms db :avet :block/tags :logseq.class/Tag)
         (map #(d/entity db (:e %)))
         (remove (fn [e]
                   (and (not include-built-in?)
                        (ldb/built-in? e))))
         (map (fn [e]
                (if expand
                  (cond-> (assoc (into {} e) :db/id (:db/id e))
                    true
                    (dissoc :block/tags :block/order :block/refs :block/name
                            :logseq.property.embedding/hnsw-label-updated-at)
                    true
                    (update :block/uuid str)
                    (:logseq.property.class/extends e)
                    (update :logseq.property.class/extends #(mapv :db/ident %))
                    (:logseq.property.class/properties e)
                    (update :logseq.property.class/properties #(mapv :db/ident %))
                    (:logseq.property.view/type e)
                    (assoc :logseq.property.view/type (:db/ident (:logseq.property.view/type e)))
                    (:logseq.property/description e)
                    (update :logseq.property/description db-property/property-value-content))
                  (minimal-list-item e)))))))

(defn- ref->ident
  [value]
  (cond
    (keyword? value) value
    (map? value) (:db/ident value)
    :else nil))

(defn- minimal-task-item
  [e]
  (cond-> (minimal-list-item e)
    true (assoc :logseq.property/status (ref->ident (:logseq.property/status e))
                :logseq.property/priority (ref->ident (:logseq.property/priority e))
                :logseq.property/scheduled (:logseq.property/scheduled e)
                :logseq.property/deadline (:logseq.property/deadline e))))

(defn list-tasks
  "List task nodes (both pages and blocks) tagged with :logseq.class/Task."
  [db {:keys [status priority content]}]
  (let [status* (ref->ident status)
        priority* (ref->ident priority)
        content* (some-> content str string/lower-case)]
    (->> (d/datoms db :avet :block/tags :logseq.class/Task)
         (map #(d/entity db (:e %)))
         (remove (fn [e]
                   (and status*
                        (not= status* (ref->ident (:logseq.property/status e))))))
         (remove (fn [e]
                   (and priority*
                        (not= priority* (ref->ident (:logseq.property/priority e))))))
         (remove (fn [e]
                   (and (seq content*)
                        (not (string/includes? (string/lower-case (or (:block/title e) ""))
                                               content*)))))
         (map minimal-task-item))))

(defn- schema-definition-entity?
  [entity]
  (let [tag-idents (->> (:block/tags entity)
                        (map :db/ident)
                        set)]
    (or (contains? tag-idents :logseq.class/Tag)
        (contains? tag-idents :logseq.class/Property))))

(defn- ordinary-node-entities
  [db]
  (let [pages (->> (d/datoms db :avet :block/name)
                   (map #(d/entity db (:e %))))
        blocks (->> (d/datoms db :avet :block/page)
                    (map #(d/entity db (:e %))))]
    (->> (concat pages blocks)
         (remove schema-definition-entity?)
         (reduce (fn [acc entity]
                   (assoc acc (:db/id entity) entity))
                 {})
         vals)))

(defn- has-all-tag-ids?
  [entity tag-ids]
  (if (seq tag-ids)
    (let [node-tag-ids (->> (:block/tags entity)
                            (map :db/id)
                            set)]
      (every? node-tag-ids tag-ids))
    true))

(defn- has-all-properties?
  [entity property-idents]
  (if (seq property-idents)
    (every? #(contains? entity %) property-idents)
    true))

(defn- minimal-node-item
  [entity]
  (let [page (:block/page entity)
        block? (some? page)]
    (cond-> (assoc (minimal-list-item entity)
                   :node/type (if block? "block" "page")
                   :block/uuid (:block/uuid entity))
      (:db/ident entity) (assoc :db/ident (:db/ident entity))
      block? (assoc :block/page-id (:db/id page)
                    :block/page-title (:block/title page)))))

(defn list-nodes
  "List ordinary nodes (pages and blocks) filtered by tags/properties."
  [db {:keys [tag-ids property-idents]}]
  (let [tag-ids (->> tag-ids (remove nil?) vec)
        property-idents (->> property-idents (remove nil?) vec)]
    (->> (ordinary-node-entities db)
         (filter #(has-all-tag-ids? % tag-ids))
         (filter #(has-all-properties? % property-idents))
         (map minimal-node-item))))

(defn- parse-time
  [value]
  (cond
    (number? value) value
    (string? value) (let [ms (js/Date.parse value)]
                      (when-not (js/isNaN ms) ms))
    :else nil))

(defn list-pages
  "List pages for CLI"
  [db {:keys [expand include-hidden include-built-in include-journal journal-only created-after updated-after] :as options}]
  (let [include-hidden? (boolean include-hidden)
        include-built-in? (if (contains? options :include-built-in) include-built-in true)
        include-journal? (if (contains? options :include-journal) include-journal true)
        journal-only? (boolean journal-only)
        created-after-ms (parse-time created-after)
        updated-after-ms (parse-time updated-after)]
    (->> (d/datoms db :avet :block/name)
         (map #(d/entity db (:e %)))
         (remove (fn [e]
                   (and (not include-hidden?)
                        (entity-util/hidden? e))))
         (remove (fn [e]
                   (and (not include-built-in?)
                        (ldb/built-in? e))))
         (remove (fn [e]
                   (let [is-journal? (ldb/journal? e)]
                     (cond
                       journal-only? (not is-journal?)
                       (false? include-journal?) is-journal?
                       :else false))))
         (remove (fn [e]
                   (and created-after-ms
                        (<= (:block/created-at e 0) created-after-ms))))
         (remove (fn [e]
                   (and updated-after-ms
                        (<= (:block/updated-at e 0) updated-after-ms))))
         (map (fn [e]
                (if expand
                  ;; Until there are options to limit pages, return minimal info to avoid
                  ;; exceeding max payload size
                  (-> (select-keys e [:block/uuid :block/title :block/created-at :block/updated-at])
                      (assoc :db/id (:db/id e))
                      (cond-> (:db/ident e) (assoc :db/ident (:db/ident e)))
                      (update :block/uuid str))
                  (minimal-list-item e)))))))
