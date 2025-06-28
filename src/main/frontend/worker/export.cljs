(ns frontend.worker.export
  "Export data"
  (:require [datascript.core :as d]
            [frontend.common.file.core :as common-file]
            [logseq.db :as ldb]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
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
  [repo db options]
  (let [filter-fn (if (ldb/db-based-graph? db)
                    (fn [ent]
                      (or (not (:logseq.property/built-in? ent))
                          (contains? sqlite-create-graph/built-in-pages-names (:block/title ent))))
                    (constantly true))]
    (->> (d/datoms db :avet :block/name)
         (map #(d/entity db (:e %)))
         (filter filter-fn)
         (map (fn [e]
                [(:block/title e)
                 (common-file/block->content repo db (:block/uuid e) {} options)])))))

(defn get-debug-datoms
  [conn]
  (some->> (d/datoms @conn :eavt)
           (map (fn [{:keys [e a v t]}]
                  (cond
                    (= :url (:logseq.property/type (d/entity @conn a)))
                    (d/datom e a "https://logseq.com" t)

                    (and (contains? #{:block/title :block/name} a)
                         (let [entity (d/entity @conn e)]
                           (and (not (:db/ident entity))
                                (not (ldb/journal? entity))
                                (not (:logseq.property/built-in? entity))
                                (not (= :logseq.property/query (:db/ident (:logseq.property/created-from-property entity)))))))
                    (d/datom e a (str "debug " e) t)

                    :else
                    (d/datom e a v t))))))
