(ns logseq.db.common.reference
  "References"
  (:require [cljs.reader :as reader]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.log :as log]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.frontend.class :as db-class]))

(defn get-filters
  [db page]
  (let [db-based? (entity-plus/db-based-graph? db)]
    (if db-based?
      (let [included-pages (:logseq.property.linked-references/includes page)
            excluded-pages (:logseq.property.linked-references/excludes page)]
        (when (or (seq included-pages) (seq excluded-pages))
          {:included included-pages
           :excluded excluded-pages}))
      (let [k :filters
            properties (:block/properties page)
            properties-str (or (get properties k) "{}")]
        (try (let [result (reader/read-string properties-str)]
               (when (seq result)
                 (let [excluded-pages (->> (filter #(false? (second %)) result)
                                           (keep first)
                                           (keep #(ldb/get-page db %)))
                       included-pages (->> (filter #(true? (second %)) result)
                                           (keep first)
                                           (keep #(ldb/get-page db %)))]
                   {:included included-pages
                    :excluded excluded-pages})))
             (catch :default e
               (log/error :syntax/filters e)))))))

(defn- build-include-exclude-query
  [variable includes excludes]
  (concat
   (for [include includes]
     [variable :block/path-refs include])
   (for [exclude excludes]
     (list 'not [variable :block/path-refs exclude]))))

(defn- filter-refs-query
  [attribute includes excludes class-ids]
  (let [clauses (concat
                 (build-include-exclude-query '?b includes excludes)
                 (for [class-id class-ids]
                   (list 'not ['?b :block/tags class-id])))]
    (into [:find '[?b ...]
           :in '$ '[?id ...]
           :where
           ['?b attribute '?id]]
          clauses)))

(defn- get-ref-pages-count
  [db id ref-blocks children-ids]
  (when (seq ref-blocks)
    (let [children (->> children-ids
                        (map (fn [id] (d/entity db id))))]
      (->> (concat (mapcat :block/path-refs ref-blocks)
                   (mapcat :block/refs children))
           frequencies
           (keep (fn [[ref size]]
                   (when (and (ldb/page? ref)
                              (not= (:db/id ref) id)
                              (not= :block/tags (:db/ident ref))
                              (not (common-initial-data/hidden-ref? db ref id)))
                     [(:block/title ref) size])))
           (sort-by second #(> %1 %2))))))

(defn- get-block-parents-until-top-ref
  [db id ref-id ref-block-ids *result]
  (loop [eid ref-id
         parents' []]
    (when eid
      (cond
        (contains? @*result eid)
        (swap! *result into parents')

        (contains? ref-block-ids eid)
        (when-not (common-initial-data/hidden-ref? db (d/entity db eid) id)
          (swap! *result into (conj parents' eid)))
        :else
        (let [e (d/entity db eid)]
          (recur (:db/id (:block/parent e)) (conj parents' eid)))))))

(defn get-linked-references
  [db id]
  (let [entity (d/entity db id)
        ids (set (cons id (ldb/get-block-alias db id)))
        page-filters (get-filters db entity)
        excludes (map :db/id (:excluded page-filters))
        includes (map :db/id (:included page-filters))
        class-ids (when (ldb/class? entity)
                    (let [class-children (db-class/get-structured-children db id)]
                      (set (conj class-children id))))
        full-ref-block-ids (->> (mapcat (fn [id] (map :db/id (:block/_refs (d/entity db id)))) ids)
                                set)
        matched-ref-block-ids (set (d/q (filter-refs-query :block/path-refs includes excludes class-ids) db ids))
        matched-refs-with-children-ids (let [*result (atom #{})]
                                         (doseq [ref-id matched-ref-block-ids]
                                           (get-block-parents-until-top-ref db id ref-id full-ref-block-ids *result))
                                         @*result)
        ref-blocks (->> (set/intersection full-ref-block-ids matched-refs-with-children-ids)
                        (map (fn [id] (d/entity db id))))
        filter-exists? (or (seq excludes) (seq includes))
        children-ids (set (remove full-ref-block-ids matched-refs-with-children-ids))]
    {:ref-blocks ref-blocks
     :ref-pages-count (get-ref-pages-count db id ref-blocks children-ids)
     :ref-matched-children-ids (when filter-exists? children-ids)}))

(defn get-unlinked-references
  [db id]
  (let [entity (d/entity db id)
        title (string/lower-case (:block/title entity))]
    (when-not (string/blank? title)
      (let [ids (->> (d/datoms db :avet :block/title)
                     (keep (fn [d]
                             (when (and (not= id (:e d)) (string/includes? (string/lower-case (:v d)) title))
                               (:e d)))))]
        (keep
         (fn [eid]
           (let [e (d/entity db eid)]
             (when-not (or (some #(= id %) (map :db/id (:block/refs e)))
                           (:block/link e)
                           (ldb/built-in? e))
               e)))
         ids)))))
