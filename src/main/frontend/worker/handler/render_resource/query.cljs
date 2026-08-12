(ns frontend.worker.handler.render-resource.query
  "DSL and Datalog query execution and result normalization."
  (:require [clojure.string :as string]
            [datascript.impl.entity :as de]
            [frontend.worker.handler.query :as query-handler]
            [frontend.worker.handler.render-resource.common :as common]
            [frontend.worker.handler.search :as search-handler]
            [frontend.worker.query-dsl :as query-dsl]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.outliner.tree :as otree]
            [sci.core :as sci]))

(defn- normalize-query-cell
  [cell]
  (cond
    (and (or (map? cell) (de/entity? cell))
         (uuid? (:block/uuid cell)))
    (:block/uuid cell)

    (or (map? cell) (de/entity? cell))
    (common/fail! "Renderer query result map has no UUID" {:value cell})

    (fn? cell)
    (common/fail! "Renderer query result contains a function" {})

    (set? cell)
    (into #{} (map normalize-query-cell) cell)

    (vector? cell)
    (mapv normalize-query-cell cell)

    (and (sequential? cell) (not (string? cell)))
    (mapv normalize-query-cell cell)

    :else
    cell))

(defn- normalize-query-row
  [row]
  (let [tuple (if (vector? row) row [row])
        tuple (mapv normalize-query-cell tuple)]
    (if (= 1 (count tuple))
      (first tuple)
      tuple)))

(def ^:private query-common-keys
  #{:kind
    :query
    :current-page-title
    :current-block-uuid
    :today-day
    :remove-block-children?
    :result-transform-edn})

(def ^:private query-dsl-keys
  (conj query-common-keys :cards?))

(def ^:private query-datalog-keys
  (conj query-common-keys :inputs :rules))

(defn- valid-today-day?
  [value]
  (and (integer? value)
       (<= 10000101 value 99991231)))

(defn- require-query-spec!
  [query-spec]
  (let [kind (:kind query-spec)
        allowed-keys (case kind
                       :dsl query-dsl-keys
                       :datalog query-datalog-keys
                       nil)]
    (when-not (and (map? query-spec)
                   allowed-keys
                   (every? allowed-keys (keys query-spec))
                   (or (not (contains? query-spec :current-page-title))
                       (and (string? (:current-page-title query-spec))
                            (not (string/blank?
                                  (:current-page-title query-spec)))))
                   (or (not (contains? query-spec :current-block-uuid))
                       (uuid? (:current-block-uuid query-spec)))
                   (or (not (contains? query-spec :today-day))
                       (valid-today-day? (:today-day query-spec)))
                   (or (not (contains? query-spec :remove-block-children?))
                       (boolean? (:remove-block-children? query-spec)))
                   (or (not (contains? query-spec :result-transform-edn))
                       (and (string? (:result-transform-edn query-spec))
                            (not (string/blank?
                                  (:result-transform-edn query-spec)))))
                   (case kind
                     :dsl
                     (and (string? (:query query-spec))
                          (or (not (contains? query-spec :cards?))
                              (boolean? (:cards? query-spec))))

                     :datalog
                     (and (vector? (:query query-spec))
                          (= :find (first (:query query-spec)))
                          (or (not (contains? query-spec :inputs))
                              (vector? (:inputs query-spec)))
                          (or (not (contains? query-spec :rules))
                              (vector? (:rules query-spec))))

                     false))
      (common/fail! "Invalid renderer query resource" {:query-spec query-spec})))
  query-spec)

(defn- quoted-query-text
  [query-string]
  (when (re-matches #"^\".*\"$" query-string)
    (let [value (common-util/safe-read-string {:log-error? false}
                                              query-string)]
      (when (and (string? value) (not (string/blank? value)))
        (string/trim value)))))

(defn- execute-query-spec
  [db query-spec {:keys [repo]}]
  (case (:kind query-spec)
    :dsl
    (let [query-string (:query query-spec)]
      (cond
        (string/blank? query-string)
        []

        (quoted-query-text query-string)
        (let [query-text (quoted-query-text query-string)]
          (when-not repo
            (common/fail! "Full-text query resource requires repository" {}))
          (mapv vector
                (search-handler/search-blocks
                 repo query-text
                 {:limit 30
                  :feature/enable-semantic-search? false})))

        :else
        (query-dsl/execute-query
         query-string
         db
         {:cards? (:cards? query-spec)
          :current-page-title (:current-page-title query-spec)
          :today-day (:today-day query-spec)
          :block-attrs [:db/id :block/uuid
                        {:block/parent [:db/id]}]})))

    :datalog
    (query-handler/execute-custom-query
     db query-spec (assoc query-spec :require-today-day? true))))

(defn- query-tuples
  [result]
  (mapv (fn [row]
          (cond
            (vector? row) row
            (map? row) [row]
            (and (sequential? row) (not (string? row))) (vec row)
            :else [row]))
        result))

(defn- block-query-result?
  [tuples]
  (and (seq tuples)
       (every? (fn [tuple]
                 (and (= 1 (count tuple))
                      (let [value (first tuple)]
                        (and (or (map? value) (de/entity? value))
                             (uuid? (:block/uuid value))))))
               tuples)))

(defn- filter-block-query-result
  [blocks {:keys [current-block-uuid remove-block-children?]}]
  (let [blocks (->> blocks
                    (remove ldb/hidden?)
                    (remove #(= current-block-uuid (:block/uuid %))))]
    (if (or (false? remove-block-children?)
            (not-every? #(integer? (:db/id %)) blocks))
      blocks
      (otree/filter-top-level-blocks blocks))))

(defn- apply-result-transform
  [rows result-transform-edn]
  (if result-transform-edn
    (let [transform (sci/eval-string result-transform-edn)]
      (when-not (fn? transform)
        (common/fail! "Query result transform is not a function"
               {:result-transform-edn result-transform-edn}))
      (let [result (transform rows)]
        (when-not (or (sequential? result) (set? result))
          (common/fail! "Query result transform must return rows"
                 {:result result}))
        result))
    rows))

(defn- query-result-rows
  [result query-spec]
  (let [tuples (query-tuples result)
        rows (if (block-query-result? tuples)
               (filter-block-query-result (map first tuples) query-spec)
               tuples)
        rows (apply-result-transform rows (:result-transform-edn query-spec))]
    (mapv normalize-query-row rows)))

(defn- dependency-watch
  [{:keys [attrs task-attrs tasks? opaque?]}]
  (let [watch-keys (cond-> (into #{} (map (fn [attr] [:attr attr])) attrs)
               (seq task-attrs)
               (into (map (fn [attr] [:task-attr attr])) task-attrs)
               tasks?
               (conj [:tasks]))]
    (if (or opaque? (empty? watch-keys))
      common/watch-all
      watch-keys)))

(defn- query-watch-keys
  [db query-spec]
  (dependency-watch
   (if (= :datalog (:kind query-spec))
     (query-handler/custom-query-watch-dependencies query-spec)
     (query-dsl/query-watch-dependencies (:query query-spec) db query-spec))))

(defn- query
  [db resource-key runtime]
  (let [query-spec (require-query-spec! (second resource-key))]
    [(query-watch-keys db query-spec)
     {:rows (query-result-rows (execute-query-spec db query-spec runtime)
                               query-spec)}]))

(def resource-renderers
  {:query (common/renderer 2 query)})
