(ns frontend.worker.export
  "Export data"
  (:require [logseq.db :as ldb]
            [logseq.outliner.tree :as otree]
            [frontend.worker.file.core :as worker-file]
            [datascript.core :as d]
            [logseq.graph-parser.property :as gp-property]))

(defn block->content
  "Converts a block including its children (recursively) to plain-text."
  [repo db root-block-uuid tree->file-opts context]
  (assert (uuid? root-block-uuid))
  (let [init-level (or (:init-level tree->file-opts)
                       (if (ldb/page? (d/entity db [:block/uuid root-block-uuid]))
                         0
                         1))
        blocks (ldb/get-block-and-children repo db root-block-uuid)
        tree (otree/blocks->vec-tree repo db blocks (str root-block-uuid))]
    (worker-file/tree->file-content repo db tree
                                    (assoc tree->file-opts :init-level init-level)
                                    context)))

(defn- safe-keywordize
  [block]
  (update block :block/properties
          (fn [properties]
            (when (seq properties)
              (->> (filter (fn [[k _v]]
                             (gp-property/valid-property-name? (str k))) properties)
                   (into {}))))))

(defn get-all-pages
  "Get all pages and their children blocks."
  [repo db]
  (->> (d/q '[:find (pull ?b [*])
              :in $
              :where
              [?b :block/original-name]
              [?b :block/name]] db)

       (map (fn [[{:block/keys [name] :as page}]]
              (let [whiteboard? (contains? (set (:block/type page)) "whiteboard")
                    blocks (ldb/get-page-blocks db name {})
                    blocks' (if whiteboard?
                              blocks
                              (map (fn [b]
                                     (let [b' (if (seq (:block/properties b))
                                                (update b :block/content
                                                        (fn [content]
                                                          (gp-property/remove-properties (:block/format b) content)))
                                                b)]
                                       (safe-keywordize b'))) blocks))
                    children (if whiteboard?
                               blocks'
                               (otree/blocks->vec-tree repo db blocks' (:db/id page)))
                    page' (safe-keywordize page)]
                (assoc page' :block/children children))))))

(defn get-all-page->content
  [repo db]
  (->> (d/datoms db :avet :block/name)
       (map (fn [d]
              (let [e (d/entity db (:e d))]
                [(:block/original-name e)
                 (block->content repo db (:block/uuid e) {} {})])))))
