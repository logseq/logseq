(ns frontend.handler.block
  (:require [clojure.string :as string]
            [cljs.reader :as reader]
            [frontend.state :as state]
            [frontend.db.utils :as db-utils]
            [frontend.db.react-queries :as react-queries]
            [clojure.set :as set]
            [frontend.extensions.sci :as sci]
            [frontend.handler.utils :as h-utils]
            [frontend.util :as util]
            [frontend.db.queries :as db-queries]
            [frontend.db.declares :as declares]
            [frontend.config :as config]
            [frontend.date :as date]
            [datascript.core :as d]))

(defn custom-query-aux
  [{:keys [query inputs] :as query'} query-opts]
  (try
    (let [inputs (map db-utils/resolve-input inputs)
          repo (state/get-current-repo)
          k [:custom query']]
      (apply react-queries/q repo k query-opts query inputs))
    (catch js/Error e
      (println "Custom query failed: ")
      (js/console.dir e))))


(defn custom-query
  ([query]
   (custom-query query {}))
  ([query query-opts]
   (when-let [query' (cond
                       (and (string? query)
                         (not (string/blank? query)))
                       (reader/read-string query)

                       (map? query)
                       query

                       :else
                       nil)]
     (custom-query-aux query' query-opts))))

(defn build-block-graph
  "Builds a citation/reference graph for a given block uuid."
  [block theme]
  (let [dark? (= "dark" theme)]
    (when-let [repo (state/get-current-repo)]
      (let [ref-blocks (react-queries/get-block-referenced-blocks block)
            edges (concat
                    (map (fn [[p aliases]]
                           [block p]) ref-blocks))
            other-blocks (->> (concat (map first ref-blocks))
                              (remove nil?)
                              (set))
            other-blocks-edges (mapcat
                                 (fn [block]
                                   (let [ref-blocks (-> (map first (react-queries/get-block-referenced-blocks block))
                                                        (set)
                                                        (set/intersection other-blocks))]
                                     (concat
                                       (map (fn [p] [block p]) ref-blocks))))
                                 other-blocks)
            edges (->> (concat edges other-blocks-edges)
                       (remove nil?)
                       (distinct)
                       (db-utils/build-edges))
            nodes (->> (concat
                         [block]
                         (map first ref-blocks))
                       (remove nil?)
                       (distinct)
                       (db-utils/build-nodes dark? block edges))]
        {:nodes nodes
         :links edges}))))

(defn custom-query-result-transform
  [query-result remove-blocks q]
  (let [repo (state/get-current-repo)
        result (db-utils/seq-flatten query-result)
        block? (:block/uuid (first result))]
    (if block?
      (let [result (if (seq remove-blocks)
                     (let [remove-blocks (set remove-blocks)]
                       (remove (fn [h]
                                 (contains? remove-blocks (:block/uuid h)))
                         result))
                     result)
            result (some->> result
                            (db-utils/with-repo repo)
                            (h-utils/with-block-refs-count repo)
                            (db-utils/sort-blocks))]
        (if-let [result-transform (:result-transform q)]
          (if-let [f (sci/eval-string (pr-str result-transform))]
            (sci/call-fn f result)
            result)
          (db-utils/group-by-page result)))
      result)))

(defn block-and-children-transform
  [result repo-url block-uuid level]
  (some->> result
           db-utils/seq-flatten
           (db-utils/sort-by-pos)
           (take-while (fn [h]
                         (or
                           (= (:block/uuid h)
                             block-uuid)
                           (> (:block/level h) level))))
           (db-utils/with-repo repo-url)
           (db-queries/with-block-refs-count repo-url)))

(defn get-block-and-children-no-cache
  [repo block-uuid]
  (let [block (db-utils/entity repo [:block/uuid block-uuid])
        page (:db/id (:block/page block))
        pos (:start-pos (:block/meta block))
        level (:block/level block)]
    (-> (db-queries/get-block-and-children repo page pos)
        (block-and-children-transform repo block-uuid level))))

(defn get-block-full-content
  ([repo block-id]
   (get-block-full-content repo block-id (fn [block] (:block/content block))))
  ([repo block-id transform-fn]
   (let [blocks (get-block-and-children-no-cache repo block-id)]
     (->> blocks
          (map transform-fn)
          (apply util/join-newline)))))

;; TODO: need to extract the query clause into react-query.cljs. @defclass
(defn get-block-and-children-react
  ([repo block-uuid]
   (get-block-and-children-react repo block-uuid true))
  ([repo block-uuid use-cache?]
   (let [block (db-utils/entity repo [:block/uuid block-uuid])
         page (:db/id (:block/page block))
         pos (:start-pos (:block/meta block))
         level (:block/level block)
         pred (fn []
                (let [block (db-utils/entity repo [:block/uuid block-uuid])
                      pos (:start-pos (:block/meta block))]
                  (fn [data meta]
                    (>= (:start-pos meta) pos))))]
     (some-> (react-queries/q repo [:block/block block-uuid]
               {:use-cache? use-cache?
                :transform-fn #(block-and-children-transform % repo block-uuid level)
                :inputs-fn (fn []
                             [page (pred)])}
               '[:find (pull ?block [*])
                 :in $ ?page ?pred
                 :where
                 [?block :block/page ?page]
                 [?block :block/meta ?meta]
                 [(?pred $ ?meta)]])
       react-queries/react))))


(defn get-block-immediate-children
  [repo block-uuid]
  (when (declares/get-conn repo)
    (let [ids (->> (:block/children (db-queries/get-block-by-uuid repo block-uuid))
                   (map :db/id))]
      (when (seq ids)
        (db-utils/pull-many repo '[*] ids)))))

(defn with-dummy-block
  ([blocks format]
   (with-dummy-block blocks format {} {}))
  ([blocks format default-option {:keys [journal? page-name]
                                  :or {journal? false}}]
   (let [format (or format (state/get-preferred-format) :markdown)
         blocks (if (and journal?
                      (seq blocks)
                      (when-let [title (second (first (:block/title (first blocks))))]
                        (date/valid-journal-title? title)))
                  (rest blocks)
                  blocks)
         blocks (vec blocks)]
     (cond
       (and (seq blocks)
         (or (and (> (count blocks) 1)
               (:block/pre-block? (first blocks)))
             (and (>= (count blocks) 1)
               (not (:block/pre-block? (first blocks))))))
       blocks

       :else
       (let [last-block (last blocks)
             end-pos (get-in last-block [:block/meta :end-pos] 0)
             dummy (merge last-block
                     (let [uuid (d/squuid)]
                       {:block/uuid uuid
                        :block/title ""
                        :block/content (config/default-empty-block format)
                        :block/format format
                        :block/level 2
                        :block/priority nil
                        :block/anchor (str uuid)
                        :block/meta {:start-pos end-pos
                                     :end-pos end-pos}
                        :block/body nil
                        :block/dummy? true
                        :block/marker nil
                        :block/pre-block? false})
                     default-option)]
         (conj blocks dummy))))))