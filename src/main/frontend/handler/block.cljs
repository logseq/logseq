(ns frontend.handler.block
  (:require [clojure.string :as string]
            [cljs.reader :as reader]
            [frontend.state :as state]
            [frontend.db.utils :as db-utils]
            [frontend.db.react :as db-react]
            [clojure.set :as set]
            [frontend.extensions.sci :as sci]
            [frontend.handler.utils :as h-utils]
            [frontend.util :as util]
            [frontend.db.simple :as db-simple]
            [frontend.db.declares :as declares]
            [frontend.config :as config]
            [frontend.date :as date]
            [datascript.core :as d]
            [frontend.format.mldoc :as mldoc]
            [cljs-time.core :as t]))

(defn resolve-input
  [input]
  (cond
    (= :today input)
    (db-utils/date->int (t/today))
    (= :yesterday input)
    (db-utils/date->int (t/yesterday))
    (= :tomorrow input)
    (db-utils/date->int (t/plus (t/today) (t/days 1)))
    (= :current-page input)
    (string/lower-case (state/get-current-page))
    (and (keyword? input)
      (re-find #"^\d+d(-before)?$" (name input)))
    (let [input (name input)
          days (util/parse-int (subs input 0 (dec (count input))))]
      (db-utils/date->int (t/minus (t/today) (t/days days))))
    (and (keyword? input)
      (re-find #"^\d+d(-after)?$" (name input)))
    (let [input (name input)
          days (util/parse-int (subs input 0 (dec (count input))))]
      (db-utils/date->int (t/plus (t/today) (t/days days))))

    :else
    input))

(defn custom-query-aux
  [{:keys [query inputs] :as query'} query-opts]
  (try
    (let [inputs (map resolve-input inputs)
          repo (state/get-current-repo)
          k [:custom query']]
      (apply db-react/q repo k query-opts query inputs))
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
      (let [ref-blocks (db-react/get-block-referenced-blocks block)
            edges (concat
                    (map (fn [[p aliases]]
                           [block p]) ref-blocks))
            other-blocks (->> (concat (map first ref-blocks))
                              (remove nil?)
                              (set))
            other-blocks-edges (mapcat
                                 (fn [block]
                                   (let [ref-blocks (-> (map first (db-react/get-block-referenced-blocks block))
                                                        (set)
                                                        (set/intersection other-blocks))]
                                     (concat
                                       (map (fn [p] [block p]) ref-blocks))))
                                 other-blocks)
            edges (->> (concat edges other-blocks-edges)
                       (remove nil?)
                       (distinct)
                       (h-utils/build-edges))
            nodes (->> (concat
                         [block]
                         (map first ref-blocks))
                       (remove nil?)
                       (distinct)
                       (h-utils/build-nodes dark? block edges))]
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
           (db-simple/with-block-refs-count repo-url)))

(defn get-block-and-children-no-cache
  [repo block-uuid]
  (let [block (db-utils/entity repo [:block/uuid block-uuid])
        page (:db/id (:block/page block))
        pos (:start-pos (:block/meta block))
        level (:block/level block)]
    (-> (db-simple/get-block-and-children repo page pos)
        (block-and-children-transform repo block-uuid level))))

(defn get-block-full-content
  ([repo block-id]
   (get-block-full-content repo block-id (fn [block] (:block/content block))))
  ([repo block-id transform-fn]
   (let [blocks (get-block-and-children-no-cache repo block-id)]
     (->> blocks
          (map transform-fn)
          (apply util/join-newline)))))

(defn get-block-and-children-react
  ([repo block-uuid]
   (get-block-and-children-react repo block-uuid true))
  ([repo block-uuid use-cache?]
   (let [block (db-utils/entity repo [:block/uuid block-uuid])
         page (:db/id (:block/page block))
         level (:block/level block)
         pred (fn []
                (let [block (db-utils/entity repo [:block/uuid block-uuid])
                      pos (:start-pos (:block/meta block))]
                  (fn [data meta]
                    (>= (:start-pos meta) pos))))
         opts {:use-cache? use-cache?
               :transform-fn #(block-and-children-transform % repo block-uuid level)
               :inputs-fn (fn [] [page (pred)])}]
     (db-react/get-block-by-pred repo block-uuid opts))))

(defn get-block-immediate-children
  [repo block-uuid]
  (when (declares/get-conn repo)
    (let [ids (->> (:block/children (db-simple/get-block-by-uuid repo block-uuid))
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

(defn blocks->vec-tree [col]
  (let [col (map (fn [h] (cond->
                           h
                           (not (:block/dummy? h))
                           (dissoc h :block/meta))) col)]
    (loop [col (reverse col)
           children (list)]
      (if (empty? col)
        children
        (let [[item & others] col
              cur-level (:block/level item)
              bottom-level (:block/level (first children))
              pre-block? (:block/pre-block? item)]
          (cond
            (empty? children)
            (recur others (list item))

            (<= bottom-level cur-level)
            (recur others (conj children item))

            pre-block?
            (recur others (cons item children))

            (> bottom-level cur-level)                      ; parent
            (let [[children other-children] (split-with (fn [h]
                                                          (> (:block/level h) cur-level))
                                              children)

                  children (cons
                             (assoc item :block/children children)
                             other-children)]
              (recur others children))))))))

(defn- get-block-parents
  [repo block-id depth]
  (when-let [conn (declares/get-conn repo)]
    (loop [block-id block-id
           parents (list)
           d 1]
      (if (> d depth)
        parents
        (if-let [parent (db-simple/get-block-parent repo block-id)]
          (recur (:block/uuid parent) (conj parents parent) (inc d))
          parents)))))

(defn pre-block-with-only-title?
  [repo block-id]
  (when-let [block (db-simple/get-block-by-uuid repo block-id)]
    (let [properties (:page/properties (:block/page block))]
      (and (:title properties)
        (= 1 (count properties))
        (let [ast (mldoc/->edn (:block/content block) (mldoc/default-config (:block/format block)))]
          (or
            (empty? (rest ast))
            (every? (fn [[[typ break-lines]] _]
                      (and (= typ "Paragraph")
                        (every? #(= % ["Break_Line"]) break-lines))) (rest ast))))))))

(defn template-exists?
  [title]
  (when title
    (let [templates (keys (db-simple/get-all-templates))]
      (when (seq templates)
        (let [templates (map string/lower-case templates)]
          (contains? (set templates) (string/lower-case title)))))))