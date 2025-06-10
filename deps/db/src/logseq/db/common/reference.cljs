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
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.rules :as rules]))

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

(defn- filter-refs-children-query
  [includes excludes class-ids]
  (let [clauses (concat
                 ['(block-parent ?b ?c)
                  ['?c :block/parent '?p]]
                 (build-include-exclude-query '?c includes excludes)
                 (when class-ids
                   (mapcat
                    (fn [class-id]
                      (map
                       (fn [var]
                         (list 'not [var :block/tags class-id]))
                       ['?b '?p '?c]))
                    class-ids)))]
    (into [:find '?b '?p '?c
           :in '$ '% '[?id ...]
           :where
           ['?b :block/refs '?id]]
          clauses)))

(defn- filter-refs-no-children-query
  [includes excludes class-ids]
  (let [clauses (concat
                 (build-include-exclude-query '?b includes excludes)
                 (for [class-id class-ids]
                   (list 'not ['?b :block/tags class-id])))]
    (into [:find '[?b ...]
           :in '$ '% '[?id ...]
           :where
           ['?b :block/refs '?id]
           (list 'not ['?c :block/parent '?b])]
          clauses)))

(defn- remove-hidden-ref
  [db page-id refs]
  (remove (fn [block] (common-initial-data/hidden-ref? db block page-id)) refs))

(defn get-linked-references
  [db id]
  (let [entity (d/entity db id)
        ids (set (cons id (ldb/get-block-alias db id)))
        page-filters (get-filters db entity)
        excludes (map :db/id (:excluded page-filters))
        includes (map :db/id (:included page-filters))
        filter-exists? (or (seq excludes) (seq includes))
        class-ids (when (ldb/class? entity)
                    (let [class-children (db-class/get-structured-children db id)]
                      (set (conj class-children id))))
        rules (rules/extract-rules rules/db-query-dsl-rules [:block-parent] {})
        non-children-query-result (d/q (filter-refs-no-children-query includes excludes class-ids) db rules ids)
        children-query-result (d/q (filter-refs-children-query includes excludes class-ids) db rules ids)
        ref-blocks (->> (map first children-query-result)
                        (concat non-children-query-result)
                        distinct
                        (map (fn [id] (d/entity db id)))
                        (remove-hidden-ref db id))
        children-ids (->>
                      (distinct (concat
                                 (map second children-query-result)
                                 (map last children-query-result)))
                      (remove (set (map :db/id ref-blocks))))
        ref-pages-count (when (seq ref-blocks)
                          (let [children (->> children-ids
                                              (map (fn [id] (d/entity db id)))
                                              (remove-hidden-ref db id))]
                            (->> (concat (mapcat :block/path-refs ref-blocks)
                                         (mapcat :block/refs children))
                                 frequencies
                                 (keep (fn [[ref size]]
                                         (when (and (ldb/page? ref)
                                                    (not= (:db/id ref) id)
                                                    (not= :block/tags (:db/ident ref))
                                                    (not (common-initial-data/hidden-ref? db ref id)))
                                           [(:block/title ref) size])))
                                 (sort-by second #(> %1 %2)))))]
    {:ref-pages-count ref-pages-count
     :ref-blocks ref-blocks
     :ref-matched-children-ids (when filter-exists?
                                 (set children-ids))}))

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
