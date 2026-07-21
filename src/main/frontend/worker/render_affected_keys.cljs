(ns frontend.worker.render-affected-keys
  "Derive explicit renderer resource invalidations from one transaction report."
  (:require [clojure.string :as string]
            [datascript.core :as d]))

(def ^:private page-identity-attrs
  #{:block/name :block/uuid})

(def ^:private visibility-attrs
  #{:block/closed-value-property
    :logseq.property/built-in?
    :logseq.property/deleted-at
    :logseq.property/hide?})

(def ^:private page-membership-attrs
  (into page-identity-attrs (conj visibility-attrs :block/tags)))

(def ^:private reference-row-attrs
  (into visibility-attrs
        #{:block/order
          :block/page
          :block/parent
          :block/refs
          :block/title}))

(def ^:private unlinked-index-attrs
  (into visibility-attrs
        #{:block/link :block/refs :block/title :db/ident}))

(def ^:private comments-attrs
  #{:block/order
    :block/tags
    :logseq.property.comments/blocks
    :logseq.property/deleted-at})

(def ^:private children-membership-attrs
  #{:block/closed-value-property
    :block/order
    :block/parent
    :logseq.property/deleted-at})

(def ^:private route-candidate-attrs
  #{:block/page
    :block/refs
    :block/tags
    :block/title
    :logseq.property/heading})

(def ^:private bidirectional-property-config-attrs
  #{:db/ident
    :db/valueType
    :logseq.property/classes
    :logseq.property/deleted-at})

(def ^:private bidirectional-class-config-attrs
  #{:block/created-at
    :block/tags
    :block/title
    :logseq.property.class/bidirectional-property-title
    :logseq.property.class/enable-bidirectional?
    :logseq.property/built-in?
    :logseq.property/deleted-at})

(defn- semantic-datoms
  [tx-data]
  (remove #(= :block/tx-id (:a %)) tx-data))

(defn- entity-at
  [db entity-id]
  (when db
    (d/entity db entity-id)))

(defn- entity-uuid-at
  [db entity-id]
  (:block/uuid (entity-at db entity-id)))

(defn- ref-uuid-at
  [db ref-id]
  (some-> (entity-at db ref-id) :block/uuid))

(defn- values
  [value]
  (cond
    (nil? value) []
    (and (coll? value) (not (map? value))) value
    :else [value]))

(defn- datom-entity-ids
  [datoms]
  (into #{} (map :e) datoms))

(defn- tagged-with-ident?
  [entity ident]
  (some #(= ident (:db/ident %)) (values (:block/tags entity))))

(defn- page?
  [entity]
  (string? (:block/name entity)))

(defn- journal?
  [entity]
  (or (some? (:block/journal-day entity))
      (tagged-with-ident? entity :logseq.class/Journal)))

(defn- class-entity?
  [entity]
  (or (seq (:logseq.property.class/extends entity))
      (= "logseq.class" (some-> entity :db/ident namespace))
      (tagged-with-ident? entity :logseq.class/Tag)))

(defn- property-entity?
  [entity]
  (when-let [ident (:db/ident entity)]
    (and (qualified-keyword? ident)
         (string/includes? (namespace ident) ".property"))))

(defn- recycled?
  [entity]
  (loop [entity entity
         seen #{}]
    (let [entity-id (:db/id entity)]
      (cond
        (nil? entity) false
        (:logseq.property/deleted-at entity) true
        (or (nil? entity-id) (contains? seen entity-id)) false
        :else (recur (:block/parent entity) (conj seen entity-id))))))

(defn- entity-before-or-after?
  [pred db-before db-after entity-id]
  (or (pred (entity-at db-before entity-id))
      (pred (entity-at db-after entity-id))))

(defn- parent-uuid-at
  [db entity-id]
  (some-> (entity-at db entity-id) :block/parent :block/uuid))

(defn- children-keys
  [db-before db-after datoms]
  (let [entity-ids (into #{}
                         (comp
                          (filter #(contains? children-membership-attrs (:a %)))
                          (map :e))
                         datoms)]
    (into #{}
          (comp
           (mapcat (fn [entity-id]
                     [(parent-uuid-at db-before entity-id)
                      (parent-uuid-at db-after entity-id)]))
           (keep (fn [parent-uuid]
                   (when (uuid? parent-uuid)
                     [:children parent-uuid]))))
          entity-ids)))

(defn- route-candidate?
  [entity]
  (and (some? (:logseq.property/heading entity))
       (string? (:block/title entity))))

(defn- route-page-keys
  [db-before db-after datoms]
  (let [entity-ids (into #{}
                         (comp
                          (filter #(contains? route-candidate-attrs (:a %)))
                          (map :e)
                          (filter #(entity-before-or-after? route-candidate?
                                                            db-before
                                                            db-after
                                                            %)))
                         datoms)]
    (into #{}
          (comp
           (mapcat (fn [entity-id]
                     [(some-> (entity-at db-before entity-id)
                              :block/page
                              :block/uuid)
                      (some-> (entity-at db-after entity-id)
                              :block/page
                              :block/uuid)]))
           (keep (fn [page-uuid]
                   (when (uuid? page-uuid)
                     [:route-page page-uuid]))))
          entity-ids)))

(defn- entity-keys
  [db-before db-after entity-ids]
  (into #{}
        (comp
         (mapcat (fn [entity-id]
                   [(entity-uuid-at db-before entity-id)
                    (entity-uuid-at db-after entity-id)]))
         (keep (fn [entity-uuid]
                 (when (uuid? entity-uuid)
                   [:entity entity-uuid]))))
        entity-ids))

(defn- attribute-keys
  [datoms]
  (into #{}
        (mapcat (fn [datom]
                  [[:attr (:a datom)]
                   [:property-membership (:a datom)]]))
        datoms))

(defn- page-lookup-keys
  [datoms]
  (into #{}
        (keep (fn [datom]
                (when (and (contains? page-identity-attrs (:a datom))
                           (or (uuid? (:v datom))
                               (string? (:v datom))))
                  [:page-lookup (:v datom)])))
        datoms))

(defn- page-membership-key
  [db-before db-after datoms]
  (when (some (fn [datom]
                (and (contains? page-membership-attrs (:a datom))
                     (or (contains? page-identity-attrs (:a datom))
                         (entity-before-or-after? page?
                                                  db-before
                                                  db-after
                                                  (:e datom)))))
              datoms)
    #{[:page-membership]}))

(defn- journal-key
  [db-before db-after datoms]
  (when (some (fn [datom]
                (or (= :block/journal-day (:a datom))
                    (and (contains? (conj visibility-attrs :block/tags :block/uuid)
                                    (:a datom))
                         (entity-before-or-after? journal?
                                                  db-before
                                                  db-after
                                                  (:e datom)))))
              datoms)
    #{[:journals]}))

(defn- reaction-keys
  [db-before db-after entity-ids]
  (into #{}
        (comp
         (mapcat (fn [entity-id]
                   [(some-> (entity-at db-before entity-id)
                            :logseq.property.reaction/target
                            :block/uuid)
                    (some-> (entity-at db-after entity-id)
                            :logseq.property.reaction/target
                            :block/uuid)]))
         (keep (fn [target-uuid]
                 (when (uuid? target-uuid)
                   [:reactions target-uuid]))))
        entity-ids))

(defn- comments-keys
  [db-before db-after datoms]
  (into #{}
        (comp
         (filter #(contains? comments-attrs (:a %)))
         (map :e)
         (mapcat (fn [entity-id]
                   (mapcat (fn [db]
                             (let [comments-area (entity-at db entity-id)]
                               (when (tagged-with-ident? comments-area :logseq.class/Comments)
                                 (keep (fn [target]
                                         (when-let [target-uuid (:block/uuid target)]
                                           [:comments target-uuid]))
                                       (values (:logseq.property.comments/blocks comments-area))))))
                           [db-before db-after]))))
        datoms))

(defn- task-time-keys
  [db-before db-after entity-ids]
  (into #{}
        (comp
         (mapcat (fn [entity-id]
                   [(some-> (entity-at db-before entity-id)
                            :logseq.property.history/block
                            :block/uuid)
                    (some-> (entity-at db-after entity-id)
                            :logseq.property.history/block
                            :block/uuid)]))
         (keep (fn [block-uuid]
                 (when (uuid? block-uuid)
                   [:task-time block-uuid]))))
        entity-ids))

(defn- status-property?
  [db entity-id]
  (= :logseq.property/status (:db/ident (entity-at db entity-id))))

(defn- status-value?
  [db entity-id]
  (when db
    (or (seq (d/datoms db :avet :logseq.property/status entity-id))
        (= entity-id
           (some-> (d/entity db :logseq.property/status)
                   :logseq.property/default-value
                   :db/id)))))

(defn- class-has-status-property?
  [db class-id]
  (let [status-property-id (:db/id (d/entity db :logseq.property/status))]
    (loop [classes (keep #(entity-at db %) [class-id])
           seen #{}]
      (when-let [class (first classes)]
        (let [class-id (:db/id class)]
          (if (contains? seen class-id)
            (recur (rest classes) seen)
            (or (some #(= status-property-id (:db/id %))
                      (values (:logseq.property.class/properties class)))
                (recur (concat (rest classes)
                               (values (:logseq.property.class/extends class)))
                       (conj seen class-id)))))))))

(defn- task-query-changed?
  [db-before db-after datoms]
  (some (fn [{:keys [e a v]}]
          (or (= :logseq.property/status a)
              (and (= :block/tags a)
                   (or (class-has-status-property? db-before v)
                       (class-has-status-property? db-after v)))
              (and (= :logseq.property.class/extends a)
                   (or (class-has-status-property? db-before e)
                       (class-has-status-property? db-after e)
                       (class-has-status-property? db-before v)
                       (class-has-status-property? db-after v)))
              (and (= :logseq.property.class/properties a)
                   (or (status-property? db-before v)
                       (status-property? db-after v)))
              (and (contains? #{:db/ident
                                :logseq.property/default-value
                                :logseq.property/public?}
                              a)
                   (or (status-property? db-before e)
                       (status-property? db-after e)
                       (status-property? db-before v)
                       (status-property? db-after v)))
              (and (contains? #{:block/title :logseq.property/value} a)
                   (or (status-value? db-before e)
                       (status-value? db-after e)))))
        datoms))

(defn- task-entity?
  [db entity-id]
  (when db
    (or (seq (d/datoms db :eavt entity-id :logseq.property/status))
        (some #(class-has-status-property? db (:db/id %))
              (values (:block/tags (entity-at db entity-id)))))))

(defn- task-attribute-keys
  [db-before db-after datoms]
  (reduce-kv
   (fn [keys entity-id entity-datoms]
     (if (or (task-entity? db-before entity-id)
             (task-entity? db-after entity-id))
       (into keys (map (fn [datom] [:task-attr (:a datom)])) entity-datoms)
       keys))
   #{}
   (group-by :e datoms)))

(defn- display-property-keys
  [db-before db-after datoms]
  (into #{}
        (keep (fn [{:keys [e a]}]
                (when (or (contains? #{:block/tags
                                       :block/closed-value-property}
                                     a)
                          (property-entity? (entity-at db-before a))
                          (property-entity? (entity-at db-after a)))
                  (when-let [block-uuid (or (entity-uuid-at db-after e)
                                            (entity-uuid-at db-before e))]
                    [:display-properties block-uuid]))))
        datoms))

(defn- enabled-bidirectional-class-ids
  [source]
  (into #{}
        (keep (fn [class]
                (when (and (tagged-with-ident? class :logseq.class/Tag)
                           (true? (:logseq.property.class/enable-bidirectional? class))
                           (not (:logseq.property/built-in? class))
                           (not (recycled? class)))
                  (:db/id class))))
        (values (:block/tags source))))

(defn- bidirectional-property?
  [db attr enabled-class-ids]
  (when (and (qualified-keyword? attr)
             (string/includes? (namespace attr) ".property"))
    (let [property (entity-at db attr)
          property-class-ids (into #{} (keep :db/id)
                                   (values (:logseq.property/classes property)))]
      (and (= :db.type/ref (:db/valueType property))
           (not (recycled? property))
           (some property-class-ids enabled-class-ids)))))

(defn- bidirectional-target-uuids
  [db source-id]
  (let [source (entity-at db source-id)
        enabled-class-ids (enabled-bidirectional-class-ids source)]
    (when (and source
               (seq enabled-class-ids)
               (not (recycled? source))
               (not (tagged-with-ident? source :logseq.class/Tag))
               (not (tagged-with-ident? source :logseq.class/Property)))
      (into #{}
            (comp
             (filter (fn [[attr _]]
                       (bidirectional-property? db attr enabled-class-ids)))
             (mapcat (comp values val))
             (keep (fn [target]
                     (when (and (not= source-id (:db/id target))
                                (not (:logseq.property/created-from-property target)))
                       (:block/uuid target)))))
            source))))

(defn- source-ids-for-property
  [db property-id]
  (when-let [property-ident (:db/ident (entity-at db property-id))]
    (into #{} (map :e) (d/datoms db :aevt property-ident))))

(defn- source-ids-for-class
  [db class-id]
  (into #{} (map :e) (d/datoms db :avet :block/tags class-id)))

(defn- bidirectional-keys
  [db-before db-after datoms touched-entity-ids]
  (let [property-ids (into #{}
                           (comp
                            (filter #(contains? bidirectional-property-config-attrs (:a %)))
                            (map :e)
                            (filter #(or (property-entity? (entity-at db-before %))
                                         (property-entity? (entity-at db-after %)))))
                           datoms)
        class-ids (into #{}
                        (comp
                         (filter #(contains? bidirectional-class-config-attrs (:a %)))
                         (map :e)
                         (filter #(or (class-entity? (entity-at db-before %))
                                      (class-entity? (entity-at db-after %)))))
                        datoms)
        source-ids (into touched-entity-ids
                         (concat
                          (mapcat #(source-ids-for-property db-before %) property-ids)
                          (mapcat #(source-ids-for-property db-after %) property-ids)
                          (mapcat #(source-ids-for-class db-before %) class-ids)
                          (mapcat #(source-ids-for-class db-after %) class-ids)))]
    (into #{}
          (comp
           (mapcat (fn [source-id]
                     (concat (bidirectional-target-uuids db-before source-id)
                             (bidirectional-target-uuids db-after source-id))))
           (keep (fn [target-uuid]
                   (when (uuid? target-uuid)
                     [:bidirectional target-uuid]))))
          source-ids)))

(defn- view-key-at
  [db entity-id]
  (let [view (entity-at db entity-id)
        owner-uuid (some-> view :logseq.property/view-for :block/uuid)
        feature-type (:logseq.property.view/feature-type view)]
    (when (and (uuid? owner-uuid) (keyword? feature-type))
      [:views owner-uuid feature-type])))

(defn- view-keys
  [db-before db-after entity-ids]
  (into #{}
        (mapcat (fn [entity-id]
                  (keep identity [(view-key-at db-before entity-id)
                                  (view-key-at db-after entity-id)])))
        entity-ids))

(defn- class-membership-keys
  [db-before db-after datoms]
  (into #{}
        (comp
         (filter #(= :block/tags (:a %)))
         (mapcat (fn [datom]
                   [(ref-uuid-at db-before (:v datom))
                    (ref-uuid-at db-after (:v datom))]))
         (keep (fn [class-uuid]
                 (when (uuid? class-uuid)
                   [:class-membership class-uuid]))))
        datoms))

(defn- class-tree?
  [db-before db-after datoms]
  (some (fn [datom]
          (or (= :logseq.property.class/extends (:a datom))
              (and (contains? #{:block/tags :block/uuid :db/ident} (:a datom))
                   (entity-before-or-after? class-entity?
                                            db-before
                                            db-after
                                            (:e datom)))))
        datoms))

(defn- ref-target-keys
  [db-before db-after datoms]
  (let [direct-target-uuids
        (mapcat (fn [datom]
                  (when (= :block/refs (:a datom))
                    [(ref-uuid-at db-before (:v datom))
                     (ref-uuid-at db-after (:v datom))]))
                datoms)
        ref-block-uuids
        (mapcat (fn [datom]
                  (when (contains? reference-row-attrs (:a datom))
                    (mapcat (fn [db]
                              (map :block/uuid
                                   (values (:block/refs (entity-at db (:e datom))))))
                            [db-before db-after])))
                datoms)]
    (into #{}
          (keep (fn [target-uuid]
                  (when (uuid? target-uuid)
                    [:refs target-uuid])))
          (concat direct-target-uuids ref-block-uuids))))

(defn affected-keys
  "Return the exact renderer resource keys affected by `tx-report`."
  [{:keys [db-before db-after tx-data]}]
  (let [datoms (vec (semantic-datoms tx-data))
        touched-entity-ids (datom-entity-ids datoms)
        class-tree-changed? (class-tree? db-before db-after datoms)
        ref-scope-changed? (or class-tree-changed?
                               (some #(= :block/alias (:a %)) datoms))]
    (into #{[:graph]}
          (concat
           (entity-keys db-before db-after touched-entity-ids)
           (attribute-keys datoms)
           (children-keys db-before db-after datoms)
           (route-page-keys db-before db-after datoms)
           (page-lookup-keys datoms)
           (page-membership-key db-before db-after datoms)
           (journal-key db-before db-after datoms)
           (reaction-keys db-before db-after touched-entity-ids)
           (comments-keys db-before db-after datoms)
           (task-time-keys db-before db-after touched-entity-ids)
           (when (task-query-changed? db-before db-after datoms) [[:tasks]])
           (task-attribute-keys db-before db-after datoms)
           (display-property-keys db-before db-after datoms)
           (bidirectional-keys db-before db-after datoms touched-entity-ids)
           (view-keys db-before db-after touched-entity-ids)
           (class-membership-keys db-before db-after datoms)
           (when class-tree-changed? [[:class-tree]])
           (ref-target-keys db-before db-after datoms)
           (when ref-scope-changed? [[:ref-scope]])
           (when (some #(contains? unlinked-index-attrs (:a %)) datoms)
             [[:unlinked-index]])))))
