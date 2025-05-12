(ns frontend.db.file-based.model
  "Core db functions for file graphs"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.file-based.db :as common-file-db]
            [frontend.db.utils :as db-utils]
            [frontend.db.conn :as conn]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.graph-parser.db :as gp-db]))

(def file-graph-block-attrs
  "In file graphs, use it to replace '*' for datalog queries"
  '[:db/id
    :block/uuid
    :block/parent
    :block/order
    :block/collapsed?
    :block/format
    :block/refs
    :block/_refs
    :block/path-refs
    :block/tags
    :block/link
    :block/title
    :block/marker
    :block/priority
    :block/properties
    :block/properties-order
    :block/properties-text-values
    :block/pre-block?
    :block/scheduled
    :block/deadline
    :block/repeated?
    :block/created-at
    :block/updated-at
    ;; TODO: remove this in later releases
    :block/heading-level
    :block/file
    {:block/page [:db/id :block/name :block/title :block/uuid :block/journal-day :block/type]}
    {:block/_parent ...}])

;; File-based only
;; Diverged of get-sorted-page-block-ids
(defn get-sorted-page-block-ids-and-levels
  "page-name: the page name, original name
   return: a list with elements in:
       :id    - a list of block ids, sorted by :block/order
       :level - the level of the block, 1 for root, 2 for children of root, etc."
  [page-name]
  {:pre [(string? page-name)]}
  (let [root (ldb/get-page (conn/get-db) page-name)]
    (loop [result []
           children (ldb/sort-by-order (:block/_parent root))
           ;; BFS log of walking depth
           levels (repeat (count children) 1)]
      (if (seq children)
        (let [child (first children)
              cur-level (first levels)
              next-children (ldb/sort-by-order (:block/_parent child))]
          (recur (conj result {:id (:db/id child) :level cur-level})
                 (concat
                  next-children
                  (rest children))
                 (concat
                  (repeat (count next-children) (inc cur-level))
                  (rest levels))))
        result))))

(defn get-page-file
  ([page-name]
   (get-page-file (state/get-current-repo) page-name))
  ([repo page-name]
   (when-let [db (conn/get-db repo)]
     (gp-db/get-page-file db page-name))))

(defn get-block-file-path
  [block]
  (when-let [page-id (:db/id (:block/page block))]
    (:file/path (:block/file (db-utils/entity page-id)))))

(defn get-file-page-id
  [file-path]
  (when-let [repo (state/get-current-repo)]
    (when-let [db (conn/get-db repo)]
      (some->
       (d/q
        '[:find ?page
          :in $ ?path
          :where
          [?file :file/path ?path]
          [?page :block/name]
          [?page :block/file ?file]]
        db file-path)
       db-utils/seq-flatten
       first))))

(defn- get-files-blocks
  [repo-url paths]
  (let [paths (set paths)
        pred (fn [_db e]
               (contains? paths e))]
    (-> (d/q '[:find ?block
               :in $ ?pred
               :where
               [?file :file/path ?path]
               [(?pred $ ?path)]
               [?p :block/file ?file]
               [?block :block/page ?p]]
             (conn/get-db repo-url) pred)
        db-utils/seq-flatten)))

(defn delete-blocks
  [repo-url files _delete-page?]
  (when (seq files)
    (let [blocks (->> (get-files-blocks repo-url files)
                      (remove nil?))]
      (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks))))

(defn get-file-page
  ([file-path]
   (get-file-page file-path true))
  ([file-path title?]
   (when-let [repo (state/get-current-repo)]
     (when-let [db (conn/get-db repo)]
       (some->
        (d/q
         (if title?
           '[:find ?page-name
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?page :block/file ?file]
             [?page :block/title ?page-name]]
           '[:find ?page-name
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?page :block/file ?file]
             [?page :block/name ?page-name]])
         db file-path)
        db-utils/seq-flatten
        first)))))

;; file-based only so it's safe to use :block/name lookup refs here
(defn delete-pages-by-files
  [files]
  (let [pages (->> (mapv get-file-page files)
                   (remove nil?))]
    (when (seq pages)
      (mapv (fn [page] [:db.fn/retractEntity [:block/name page]]) (map util/page-name-sanity-lc pages)))))

;; TODO: check whether this works when adding pdf back on Web
(defn get-pre-block
  [repo page-id]
  (-> (d/q '[:find (pull ?b [*])
             :in $ ?page
             :where
             [?b :block/page ?page]
             [?b :block/pre-block? true]]
           (conn/get-db repo)
           page-id)
      ffirst))

(defn- get-all-namespace-relation
  [repo]
  (gp-db/get-all-namespace-relation (conn/get-db repo)))

(defn get-all-namespace-parents
  [repo]
  (let [db (conn/get-db repo)]
    (->> (get-all-namespace-relation repo)
         (map (fn [[_ ?parent]]
                (db-utils/entity db ?parent))))))

(defn get-namespace-pages
  "Accepts both sanitized and unsanitized namespaces"
  [repo namespace]
  (common-file-db/get-namespace-pages (conn/get-db repo) namespace))

(defn- tree [flat-col root]
  (let [sort-fn #(sort-by :block/name %)
        children (group-by :block/namespace flat-col)
        namespace-children (fn namespace-children [parent-id]
                             (map (fn [m]
                                    (assoc m :namespace/children
                                           (sort-fn (namespace-children {:db/id (:db/id m)}))))
                                  (sort-fn (get children parent-id))))]
    (namespace-children root)))

(defn get-namespace-hierarchy
  "Unsanitized namespaces"
  [repo namespace]
  (let [children (get-namespace-pages repo namespace)
        namespace-id (:db/id (db-utils/entity [:block/name (util/page-name-sanity-lc namespace)]))
        root {:db/id namespace-id}
        col (conj children root)]
    (tree col root)))

(defn get-page-namespace
  [repo page]
  (:block/namespace (db-utils/entity repo [:block/name (util/page-name-sanity-lc page)])))

(defn get-page-namespace-routes
  [repo page]
  (assert (string? page))
  (when-let [db (conn/get-db repo)]
    (when-not (string/blank? page)
      (let [page (util/page-name-sanity-lc (string/trim page))
            page-exist? (db-utils/entity repo [:block/name page])
            ids (if page-exist?
                  '()
                  (->> (d/datoms db :aevt :block/name)
                       (filter (fn [datom]
                                 (string/ends-with? (:v datom) (str "/" page))))
                       (map :e)))]
        (when (seq ids)
          (db-utils/pull-many repo
                              '[:db/id :block/name :block/title
                                {:block/file [:db/id :file/path]}]
                              ids))))))
