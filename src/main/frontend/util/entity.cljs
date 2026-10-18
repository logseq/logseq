(ns frontend.util.entity
  "Plain-map entity helpers for renderer code.")

(defn as-block-map
  "View rows are UUIDs. Callers that read :block/uuid need a map."
  [block-or-id]
  (cond
    (uuid? block-or-id)
    {:block/uuid block-or-id}

    (and (map? block-or-id)
         (nil? (:block/uuid block-or-id))
         (uuid? (:uuid block-or-id)))
    (assoc block-or-id :block/uuid (:uuid block-or-id))

    :else
    block-or-id))

(defn- tag-ident
  [tag]
  (cond
    (keyword? tag) tag
    (map? tag) (:db/ident tag)
    :else nil))

(defn tagged-with?
  [entity expected-ident]
  (when (map? entity)
    (some (fn [tag]
            (= expected-ident (tag-ident tag)))
          (:block/tags entity))))

(defn internal-page?
  [entity]
  (tagged-with? entity :logseq.class/Page))

(defn class?
  [entity]
  (tagged-with? entity :logseq.class/Tag))

(defn property?
  [entity]
  (tagged-with? entity :logseq.class/Property))

(defn journal?
  [entity]
  (tagged-with? entity :logseq.class/Journal))

(defn page?
  [entity]
  (or (internal-page? entity)
      (journal? entity)
      (class? entity)
      (property? entity)))

(defn library-outline-child-uuids
  "Library outlines nested pages, not normal blocks."
  [child-blocks]
  (into []
        (keep (fn [block]
                (when (and block (page? block))
                  (:block/uuid block))))
        child-blocks))

(defn url-property-value?
  "URL-type property values are leaves. They must not have child blocks
  or expose sub-block UX when zoomed."
  [entity]
  (= :url (:logseq.property/type (:logseq.property/created-from-property entity))))

(defn- ref-db-id
  [value]
  (cond
    (number? value) value
    (map? value) (:db/id value)
    :else nil))

(defn default-value-block?
  "A property's :logseq.property/default-value block is a leaf. It must not
  have child blocks or expose sub-block UX."
  [entity]
  (when (map? entity)
    (let [parent (:block/parent entity)
          parent-default-id (ref-db-id (:logseq.property/default-value parent))
          entity-id (:db/id entity)]
      (boolean
       (or (and entity-id parent-default-id (= entity-id parent-default-id))
           (and (nil? (:block/closed-value-property entity))
                (let [parent-id (ref-db-id parent)
                      from-id (ref-db-id (:logseq.property/created-from-property entity))]
                  (and parent-id from-id (= parent-id from-id)
                       (property? (or parent
                                      (:logseq.property/created-from-property entity)))))))))))

(defn leaf-property-value?
  "Property values that keep the block editor but must not have children."
  [entity]
  (or (url-property-value? entity)
      (default-value-block? entity)))

(defn get-entity-types
  [entity]
  (cond-> #{}
    (internal-page? entity) (conj :page)
    (journal? entity) (conj :journal)
    (class? entity) (conj :class)
    (property? entity) (conj :property)))
