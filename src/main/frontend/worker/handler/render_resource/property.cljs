(ns frontend.worker.handler.render-resource.property
  "Property-related renderer resources."
  (:require [datascript.core :as d]
            [frontend.worker.handler.property :as property-handler]
            [frontend.worker.handler.render-resource.common :as common]
            [logseq.db :as ldb]))

(def ^:private display-context-keys
  #{:gallery-view?
    :page-title?
    :sidebar-properties?
    :tag-dialog?
    :publishing?
    :state-hide-empty-properties?
    :show-empty-and-hidden-properties?})

(defn- require-display-context!
  [context]
  (when-not (and (map? context)
                 (= display-context-keys (set (keys context)))
                 (every? boolean? (vals context)))
    (common/fail! "Invalid block display properties context" {:context context}))
  context)

(defn- normalize-entity-value
  [value]
  (letfn [(normalize-coll [values initial]
            (reduce
             (fn [[normalized uuids] item]
               (let [[item uuids'] (normalize-entity-value item)]
                 [(conj normalized item) (into uuids uuids')]))
             [initial #{}]
             values))]
    (cond
      (and (map? value) (uuid? (:block/uuid value)))
      [(:block/uuid value) #{(:block/uuid value)}]

      (set? value)
      (normalize-coll value #{})

      (vector? value)
      (normalize-coll value [])

      (and (sequential? value) (not (string? value)))
      (normalize-coll value [])

      (map? value)
      (common/fail! "Renderer property value has no UUID" {:value value})

      :else
      [value #{}])))

(defn- normalize-display-property-row
  [{:keys [property value]}]
  (let [property-uuid (common/require-uuid! :property-uuid (:block/uuid property))
        property-ident (:db/ident property)
        closed-value-uuids
        (mapv (fn [closed-value]
                (common/require-uuid! :closed-value-uuid
                               (:block/uuid closed-value)))
              (:property/closed-values property))
        [normalized-value value-uuids] (normalize-entity-value value)]
    (when-not (keyword? property-ident)
      (common/fail! "Renderer property has no ident" {:property-uuid property-uuid}))
    [{:property-uuid property-uuid
      :property-ident property-ident
      :value normalized-value}
     (into #{[:entity property-uuid]}
           (map (fn [block-uuid] [:entity block-uuid]))
           (concat value-uuids closed-value-uuids))]))

(defn- normalize-display-property-rows
  [rows]
  (reduce
   (fn [[normalized watch-keys] row]
     (let [[row row-watch-keys] (normalize-display-property-row row)]
       [(conj normalized row) (into watch-keys row-watch-keys)]))
   [[] #{}]
   rows))

(defn- optional-entity-uuid
  [label entity]
  (when entity
    (common/require-uuid! label (:block/uuid entity))))

(defn- block-display-properties
  [db resource-key _runtime]
  (let [[_ block-uuid context] resource-key
        block (common/entity-by-uuid! db :block-uuid block-uuid)
        context (require-display-context! context)
        show-empty-and-hidden-properties?
        (:show-empty-and-hidden-properties? context)
        result (property-handler/display-properties
                db
                block
                (dissoc context :show-empty-and-hidden-properties?)
                show-empty-and-hidden-properties?)
        [full-properties full-watch-keys]
        (normalize-display-property-rows (:full-properties result))
        [hidden-properties hidden-watch-keys]
        (normalize-display-property-rows (:hidden-properties result))
        watch-keys (into #{[:display-properties block-uuid]
                           [:class-tree]
                           [:property-config]
                           [:property-membership :block/closed-value-property]}
                         (concat full-watch-keys hidden-watch-keys))]
    [watch-keys
     {:full-properties full-properties
      :hidden-properties hidden-properties
      :description-property-uuid
      (optional-entity-uuid :description-property-uuid
                            (:description-property result))
      :class-properties-property-uuid
      (optional-entity-uuid :class-properties-property-uuid
                            (:class-properties-property result))}]))

(defn- property-uuid!
  [property]
  (common/require-uuid! :property-uuid (:block/uuid property)))

(defn- block-positioned-properties
  [db resource-key _runtime]
  (let [[_ block-uuid position] resource-key
        block (common/entity-by-uuid! db :block-uuid block-uuid)]
    (when-not (contains? (set property-handler/render-property-positions)
                         position)
      (common/fail! "Invalid block property position" {:position position}))
    (let [properties (property-handler/block-positioned-properties
                      db (:db/id block) position)
          candidate-properties
          (keep #(d/entity db %)
                (property-handler/direct-block-property-ids db (:db/id block)))
          property-uuids (mapv property-uuid! properties)
          watch-uuids (into (set property-uuids)
                            (map property-uuid!)
                            candidate-properties)]
      [(into #{[:entity block-uuid]
               [:property-config]}
             (map (fn [property-uuid] [:entity property-uuid]))
             watch-uuids)
       property-uuids])))

(defn- block-bidirectional-properties
  [db resource-key _runtime]
  (let [block-uuid (second resource-key)
        block (common/entity-by-uuid! db :block-uuid block-uuid)
        groups (ldb/get-bidirectional-properties db (:db/id block))]
    [#{[:bidirectional block-uuid]}
     (mapv (fn [{:keys [class entities]}]
             {:class-uuid (common/require-uuid! :class-uuid (:block/uuid class))
              :entity-uuids (mapv #(common/require-uuid! :entity-uuid
                                                 (:block/uuid %))
                                  entities)})
           groups)]))

(def resource-renderers
  {:block-display-properties (common/renderer 3 block-display-properties)
   :block-positioned-properties (common/renderer 3 block-positioned-properties)
   :block-bidirectional-properties (common/renderer 2 block-bidirectional-properties)})
