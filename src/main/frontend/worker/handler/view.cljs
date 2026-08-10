(ns frontend.worker.handler.view
  "View operations for the db worker."
  (:require [datascript.core :as d]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.plain-value :as worker-plain]
            [frontend.worker.state :as worker-state]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.entity-util :as entity-util]))

(defn- view-filter-operators
  [property]
  (if (contains? #{:block/created-at :block/updated-at} (:db/ident property))
    [:before :after]
    (vec
     (concat
      [:is :is-not]
      (case (:logseq.property/type property)
        (:datetime)
        [:before :after]
        (:default :url :node)
        [:text-contains :text-not-contains]
        (:date)
        [:date-before :date-after]
        :number
        [:number-gt :number-lt :number-gte :number-lte :between]
        nil)))))

(defn- view-filter-value-after-operator-change
  [operator value]
  (case operator
    (:is :is-not)
    (when (set? value) value)

    (:text-contains :text-not-contains)
    (when (string? value) value)

    (:number-gt :number-lt :number-gte :number-lte)
    (when (number? value) value)

    :between
    (when (and (vector? value) (every? number? value))
      value)

    (:date-before :date-after :before :after)
    (when (number? value) value)))

(defn- view-filter-value-source
  [property operator]
  (let [type (:logseq.property/type property)]
    (cond
      (contains? #{:before :after} operator)
      :timestamp

      (= :checkbox type)
      :checkbox

      (contains? #{:data :datetime :checkbox} type)
      nil

      :else
      :property-values)))

(defn- view-filter-many?
  [property operator]
  (not (or (contains? #{:date-before :date-after :before :after} operator)
           (= :checkbox (:logseq.property/type property)))))

(defn- normalize-view-filter-value
  [value]
  (if (map? (:value value))
    (assoc value :value (:block/uuid (:value value)))
    value))

(defn view-filter-data
  [db {:keys [property property-ident operator value] :as option}]
  (let [property (or property
                     (some-> (d/entity db property-ident)
                             entity-util/entity->map))
        operator (or operator :is)
        value-source (view-filter-value-source property operator)
        values (when (= :property-values value-source)
                 (mapv normalize-view-filter-value
                       (db-view/get-property-values db (:db/ident property) option)))]
    {:operators (view-filter-operators property)
     :value-source value-source
     :many? (view-filter-many? property operator)
     :values values
     :value-after-operator-change (view-filter-value-after-operator-change operator value)}))

(def-thread-api :thread-api/get-view-filter-data
  [repo option]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (view-filter-data @conn option)))

(def-thread-api :thread-api/get-view-data
  [repo view-id option]
  (let [db @(worker-state/get-datascript-conn repo)]
    (worker-plain/worker-plain-value db (db-view/get-view-data db view-id option))))
