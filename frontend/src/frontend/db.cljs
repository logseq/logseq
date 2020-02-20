(ns frontend.db
  (:require [datascript.core :as d]
            [frontend.util :as util]
            [medley.core :as medley]))

(def conn (d/create-conn))

;; links
[:link/id
 :link/label
 :link/link]

;; TODO: added_at, started_at, schedule, deadline
(def qualified-map
  {:file :heading/file
   :anchor :heading/anchor
   :title :heading/title
   :marker :heading/marker
   :priority :heading/priority
   :level :heading/level
   :timestamps :heading/timestamps
   :children :heading/children
   :tags :heading/tags
   :meta :heading/meta
   :parent-title :heading/parent-title})

(def schema
  [{:db/ident       :heading/uuid
    :db/valueType   :db.type/uuid
    :db/cardinality :db.cardinality/one
    :db/unique      :db.unique/value}

   {:db/ident       :heading/file
    :db/valueType   :db.type/string
    :db/cardinality :db.cardinality/one}

   {:db/ident       :heading/anchor
    :db/valueType   :db.type/string
    :db/cardinality :db.cardinality/one}

   {:db/ident       :heading/marker
    :db/valueType   :db.type/string
    :db/cardinality :db.cardinality/one}

   {:db/ident       :heading/priority
    :db/valueType   :db.type/string
    :db/cardinality :db.cardinality/one}

   {:db/ident       :heading/level
    :db/valueType   :db.type/long
    :db/cardinality :db.cardinality/one}

   {:db/ident       :heading/tags
    :db/valueType   :db.type/ref
    :db/cardinality :db.cardinality/many
    :db/isComponent true}               ;TODO: not working as Datomic, can't search :tag/name in datalog queries

   {:db/ident       :task/scheduled
    ;; :db/valueType   :db.type/string
    :db/index       true}

   {:db/ident       :task/deadline
    ;; :db/valueType   :db.type/string
    :db/index       true}

   {:db/ident       :tag/name
    :db/valueType   :db.type/string
    :db/cardinality :db.cardinality/one
    :db/unique      :db.unique/identity}

   ;; {:db/ident       :heading/title
   ;;  :db/valueType   :db.type/string
   ;;  :db/cardinality :db.cardinality/one}

   ;; {:db/ident       :heading/parent-title
   ;;  :db/valueType   :db.type/string
   ;;  :db/cardinality :db.cardinality/one}

   ;; TODO: timestamps, meta
   ;; scheduled, deadline
   ])

(defn ->tags
  [tags]
  (map (fn [tag]
         {:db/id tag
          :tag/name tag})
    tags))

(defn extract-timestamps
  [{:keys [meta] :as heading}]
  (let [{:keys [pos timestamps]} meta]
    ))

(defn- safe-headings
  [headings]
  (mapv (fn [heading]
          (let [heading (-> (util/remove-nils heading)
                            (assoc :heading/uuid (d/squuid)))
                heading (assoc heading :tags
                                (->tags (:tags heading)))]
            (medley/map-keys
             (fn [k] (get qualified-map k k))
             heading)))
        headings))

(defn init
  []
  (d/transact! conn [{:tx-data schema}]))

;; transactions
(defn transact-headings!
  [headings]
  (prn "headings: " headings)
  (let [headings (safe-headings headings)]
    (d/transact! conn headings)))

;; queries

(defn- distinct-result
  [query-result]
  (-> query-result
      seq
      flatten
      distinct))

(def seq-flatten (comp flatten seq))

(defn get-all-tags
  []
  (distinct-result
   (d/q '[:find ?tags
          :where
          [?h :heading/tags ?tags]]
     @conn)))

(defn get-all-headings
  []
  (seq-flatten
   (d/q '[:find (pull ?h [*])
          :where
          [?h :heading/title]]
     @conn)))

;; marker should be one of: TODO, DOING, IN-PROGRESS
;; time duration
(defn get-agenda
  [time]
  (let [duration (case time
                   :today []
                   :week  []
                   :month [])]
    (d/q '[:find (pull ?h [*])
           :where
           (or [?h :heading/marker "TODO"]
               [?h :heading/marker "DOING"]
               [?h :heading/marker "IN-PROGRESS"])]
      @conn)))

(defn search-headings-by-title
  [title])

(defn get-headings-by-tag
  [tag]
  (let [pred (fn [db tags]
               (some #(= tag %) tags))]
    (d/q '[:find (flatten (pull ?h [*]))
           :in $ ?pred
           :where
           [?h :heading/tags ?tags]
           [(?pred $ ?tags)]]
      @conn pred)))

(comment
  (frontend.handler/initial-db!)
  )
