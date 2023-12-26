(ns logseq.db
  "Main namespace for public db fns"
  (:require [logseq.db.frontend.default :as default-db]
            [logseq.db.frontend.schema :as db-schema]
            [datascript.core :as d]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.util :as db-property-util]
            [logseq.db.sqlite.util :as sqlite-util]
            [clojure.string :as string]
            [logseq.graph-parser.util :as gp-util]
            [logseq.db.frontend.content :as db-content]))

;; Use it as an input argument for datalog queries
(def block-attrs
  '[:db/id
    :block/uuid
    :block/parent
    :block/left
    :block/collapsed?
    :block/collapsed-properties
    :block/format
    :block/refs
    :block/_refs
    :block/path-refs
    :block/tags
    :block/link
    :block/content
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
    {:block/page [:db/id :block/name :block/original-name :block/journal-day]}
    {:block/_parent ...}])


(defn create-default-pages!
  "Creates default pages if one of the default pages does not exist. This
   fn is idempotent"
  [db-conn {:keys [db-graph?]}]
  (when-not (d/entity @db-conn [:block/name "card"])
    (let [time (tc/to-long (t/now))
          built-in-pages (map
                          (fn [m]
                            (cond-> (-> m
                                        (assoc :block/created-at time)
                                        (assoc :block/updated-at time))
                              db-graph?
                              (assoc :block/format :markdown)))
                          default-db/built-in-pages)]
      (d/transact! db-conn built-in-pages))))

(defn create-built-in-properties!
  [conn]
  (let [txs (mapcat
             (fn [[k-keyword {:keys [schema original-name] :as property-config}]]
               (let [k-name (name k-keyword)]
                 (if (:closed-values property-config)
                   (db-property-util/build-closed-values
                    (or original-name k-name)
                    (assoc property-config :block/uuid (d/squuid))
                    {})
                   [(sqlite-util/build-new-property
                     {:block/schema schema
                      :block/original-name (or original-name k-name)
                      :block/name (string/lower-case k-name)
                      :block/uuid (d/squuid)})])))
             db-property/built-in-properties)]
    (when (seq txs)
      (d/transact! conn txs))))

(defn start-conn
  "Create datascript conn with schema and default data"
  [& {:keys [create-default-pages? schema file-based?]
      :or {create-default-pages? true
           schema db-schema/schema}}]
  (let [db-conn (d/create-conn schema)
        file-based? (or (= schema db-schema/schema) file-based?)]
    (when create-default-pages?
      (create-default-pages! db-conn {}))
    (when-not file-based?
      (create-built-in-properties! db-conn))
    db-conn))

(defn sort-by-left
  ([blocks parent]
   (sort-by-left blocks parent {:check? true}))
  ([blocks parent {:keys [_check?]}]
   (let [blocks (gp-util/distinct-by :db/id blocks)
         left->blocks (reduce (fn [acc b] (assoc acc (:db/id (:block/left b)) b)) {} blocks)]
     (loop [block parent
            result []]
       (if-let [next (get left->blocks (:db/id block))]
         (recur next (conj result next))
         (vec result))))))

(defn try-sort-by-left
  [blocks parent]
  (let [result' (sort-by-left blocks parent {:check? false})]
    (if (= (count result') (count blocks))
      result'
      blocks)))

;; TODO: use the tree directly
(defn flatten-tree
  [blocks-tree]
  (if-let [children (:block/_parent blocks-tree)]
    (cons (dissoc blocks-tree :block/_parent) (mapcat flatten-tree children))
    [blocks-tree]))

;; TODO: performance enhance
(defn get-block-and-children
  [repo db block-uuid]
  (some-> (d/q
           '[:find [(pull ?block ?block-attrs) ...]
             :in $ ?id ?block-attrs
             :where
             [?block :block/uuid ?id]]
           db
           block-uuid
           block-attrs)
          first
          flatten-tree
          (->> (map #(db-content/update-block-content repo db % (:db/id %))))))
