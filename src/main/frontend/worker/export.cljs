(ns frontend.worker.export
  "Export data"
  (:require [cljs-bean.core :as bean]
            [datascript.core :as d]
            [frontend.common.file.core :as common-file]
            [logseq.db :as ldb]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.graph-parser.property :as gp-property]
            [logseq.outliner.tree :as otree]))

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
              [?b :block/title]
              [?b :block/name]] db)

       (map (fn [[page]]
              (let [whiteboard? (ldb/whiteboard? page)
                    blocks (ldb/get-page-blocks db (:db/id page))
                    blocks' (if whiteboard?
                              blocks
                              (map (fn [b]
                                     (let [b' (if (seq (:block/properties b))
                                                (update b :block/title
                                                        (fn [content]
                                                          (gp-property/remove-properties (get b :block/format :markdown) content)))
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
                [(:block/title e)
                 (common-file/block->content repo db (:block/uuid e) {} {})])))))

(defn get-debug-datoms
  [conn ^Object db]
  (some->> (.exec db #js {:sql "select content from kvs"
                          :rowMode "array"})
           bean/->clj
           (mapcat (fn [result]
                     (let [result (sqlite-util/transit-read (first result))]
                       (when (map? result)
                         (:keys result)))))
           (map (fn [[e a v t]]
                  (if (and (contains? #{:block/title :block/name} a)
                           (let [entity (d/entity @conn e)]
                             (and (not (:db/ident entity))
                                  (not (ldb/journal? entity)))))
                    (d/datom e a (str "debug " e) t)
                    (d/datom e a v t))))))
