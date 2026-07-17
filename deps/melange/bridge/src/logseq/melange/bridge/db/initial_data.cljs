(ns logseq.melange.bridge.db.initial-data
  "Provides db helper fns for graph initialization and lazy loading entities"
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private initial-read-api (.-InitialRead melange-db))
(def ^:private initial-data-workflow-api (.-InitialDataWorkflow melange-db))

;; FIXME: For DB graph built-in pages, look up by name -> uuid like
;; get-built-in-page instead of this approach which is more error prone
(defn get-first-page-by-name
  "Return the oldest page's db id for :block/name"
  [db page-name]
  ((.-oldestPageByNameInputWith initial-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   page-name))

(defn get-first-page-by-title
  "Return the oldest page's db id for :block/title"
  [db page-name]
  {:pre [(string? page-name)]}
  ((.-oldestPageByTitle initial-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   page-name))

(defn get-block-alias
  [db eid]
  (seq ((.-blockAliasesWith initial-read-api)
        (runtime/runtime-adapter)
        (d/adapter)
        db
        eid)))

(defn with-parent
  [db block]
  ((.-withParentWith initial-data-workflow-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   block))

(defn get-block-children-ids
  "Returns children ids, notice the result doesn't include property value children ids."
  [db block-eid & {:keys [include-collapsed-children?]
                   :or {include-collapsed-children? true}}]
  (let [result ((.-childrenIdsWith initial-read-api)
                (runtime/runtime-adapter)
                (d/adapter)
                db
                block-eid
                (boolean include-collapsed-children?))]
    (when (some? result)
      (set (seq result)))))

(defn get-block-children
  "Including nested children, notice the result doesn't include property values."
  {:arglists '([db eid & {:keys [include-collapsed-children?]}])}
  [db eid & {:keys [include-collapsed-children?]
             :or {include-collapsed-children? true}}]
  (some-> ((.-childrenEntitiesWith initial-read-api)
           (runtime/runtime-adapter)
           (d/adapter)
           db
           eid
           (boolean include-collapsed-children?))
          array-seq))

(defn get-block-full-children-ids
  "Including nested, collapsed and property value children."
  {:arglists '([db block-eid])}
  [db block-eid]
  ((.-fullChildrenWith initial-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   block-eid))

(defn get-block-refs
  [db id]
  (map identity
       (array-seq
        ((.-blockRefsWith initial-read-api)
         (runtime/runtime-adapter)
         (d/adapter)
         db
         id))))

(defn get-block-refs-count
  [db id]
  ((.-blockRefsCountWith initial-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   id))

(defn ^:large-vars/cleanup-todo get-block-and-children
  [db id-or-page-name {:keys [children? properties include-collapsed-children?]
                       :or {include-collapsed-children? false}}]
  ((.-blockAndChildrenWith initial-data-workflow-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   id-or-page-name
   (boolean children?)
   (or properties [])
   (boolean include-collapsed-children?)))

(defn get-latest-journals
  [db]
  (seq ((.-latestJournalsNowWith initial-read-api)
        (runtime/runtime-adapter)
        (d/adapter)
        db
        #(.now js/Date))))

(defn get-recent-updated-pages
  [db]
  (some-> ((.-recentPagesNullableWith initial-read-api)
           (runtime/runtime-adapter)
           (d/adapter)
           db)
          seq))

(defn get-initial-data
  "Returns current database schema and initial data"
  [db]
  (let [^js result ((.-getWith initial-data-workflow-api)
                    (runtime/runtime-adapter)
                    (d/adapter)
                    db)]
    {:schema (.-schema result)
     :initial-data (array-seq (.-initialData result))}))
