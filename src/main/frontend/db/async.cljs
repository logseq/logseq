(ns frontend.db.async
  "Async queries"
  (:require [promesa.core :as p]
            [frontend.state :as state]
            [frontend.config :as config]
            [clojure.string :as string]
            [logseq.common.util.page-ref :as page-ref]
            [frontend.util :as util]
            [frontend.db.utils :as db-utils]
            [frontend.db.async.util :as db-async-util]
            [frontend.db.file-based.async :as file-async]
            [frontend.db :as db]
            [frontend.persist-db.browser :as db-browser]
            [clojure.edn :as edn]
            [datascript.core :as d]))

(def <q db-async-util/<q)

(defn <get-files
  [graph]
  (p/let [result (<q
                  graph
                  '[:find ?path ?modified-at
                    :where
                    [?file :file/path ?path]
                    [(get-else $ ?file :file/last-modified-at 0) ?modified-at]])]
    (->> result seq reverse)))

(defn <get-all-templates
  [graph]
  (p/let [result (<q graph
                     '[:find ?t ?b
                       :where
                       [?b :block/properties ?p]
                       [(get ?p :template) ?t]])]
    (into {} result)))

(defn <db-based-get-all-properties
  ":block/type could be one of [property, class]."
  [graph]
  (<q graph
      '[:find [?n ...]
        :where
        [?e :block/type "property"]
        [?e :block/original-name ?n]]))

(defn <get-all-properties
  "Returns a seq of property name strings"
  []
  (when-let [graph (state/get-current-repo)]
    (if (config/db-based-graph? graph)
      (<db-based-get-all-properties graph)
      (file-async/<file-based-get-all-properties graph))))

(comment
  (defn <get-pages
    [graph]
    (p/let [result (<q graph
                       '[:find [?page-original-name ...]
                         :where
                         [?page :block/name ?page-name]
                         [(get-else $ ?page :block/original-name ?page-name) ?page-original-name]])]
      (remove db-model/hidden-page? result))))

(defn <get-db-based-property-values
  [graph property]
  (let [property-name (if (keyword? property)
                        (name property)
                        (util/page-name-sanity-lc property))]
    (p/let [result (<q graph
                       '[:find ?prop-type ?v
                         :in $ ?prop-name
                         :where
                         [?b :block/properties ?bp]
                         [?prop-b :block/name ?prop-name]
                         [?prop-b :block/uuid ?prop-uuid]
                         [?prop-b :block/schema ?prop-schema]
                         [(get ?prop-schema :type) ?prop-type]
                         [(get ?bp ?prop-uuid) ?v]]
                       property-name)]
      (->> result
           (map (fn [[prop-type v]] [prop-type (if (coll? v) v [v])]))
           (mapcat (fn [[prop-type vals]]
                     (case prop-type
                       :default
                       ;; Remove multi-block properties as there isn't a supported approach to query them yet
                       (map str (remove uuid? vals))
                       (:page :date)
                       (map #(page-ref/->page-ref (:block/original-name (db-utils/entity graph [:block/uuid %])))
                            vals)
                       :number
                       vals
                       ;; Checkboxes returned as strings as builder doesn't display boolean values correctly
                       (map str vals))))
           ;; Remove blanks as they match on everything
           (remove string/blank?)
           (distinct)
           (sort)))))

(defn <get-property-values
  [graph property]
  (if (config/db-based-graph? graph)
    (<get-db-based-property-values graph property)
    (file-async/<get-file-based-property-values graph property)))

(defn <get-block-and-children
  [graph name-or-uuid &loading? & {:keys [children?]
                                   :or {children? true}}]
  (when-let [^Object sqlite @db-browser/*worker]
    (p/let [name' (str name-or-uuid)
            result (.get-block-and-children sqlite graph name' children?)
            {:keys [block children] :as result'} (edn/read-string result)
            conn (db/get-db graph false)
            _ (d/transact! conn (cons block children))]
      (reset! &loading? false)
      (if children?
        block
        result'))))
