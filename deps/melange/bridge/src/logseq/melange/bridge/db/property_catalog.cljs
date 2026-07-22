(ns logseq.melange.bridge.db.property-catalog
  "CLJS map conversion for the typed Melange built-in property catalog."
  (:require ["@logseq/melange-js-api/db" :as db-api]
            [flatland.ordered.map :refer [ordered-map]]))

(def ^:private property-api (.-PropertyCatalog db-api))

(defn- keyword-set
  [values]
  (set (map keyword (seq values))))

(defn- decode-scalar
  [value]
  (case (aget value "kind")
    "keyword" (keyword (aget value "text"))
    "string" (aget value "text")
    "bool" (aget value "boolValue")
    "int" (aget value "intValue")
    (throw (js/Error. (str "Unknown built-in property scalar: "
                           (aget value "kind"))))))

(defn- decode-schema
  [schema]
  (let [cardinality (aget schema "cardinality")
        hide? (aget schema "hide")
        public? (aget schema "publicValue")
        view-context (aget schema "viewContext")
        ui-position (aget schema "uiPosition")
        classes (seq (aget schema "classes"))]
    (cond-> {:type (keyword (aget schema "typeName"))}
      (some? cardinality) (assoc :cardinality (keyword cardinality))
      (some? hide?) (assoc :hide? hide?)
      (some? public?) (assoc :public? public?)
      (some? view-context) (assoc :view-context (keyword view-context))
      (some? ui-position) (assoc :ui-position (keyword ui-position))
      (seq classes) (assoc :classes (set (map keyword classes))))))

(defn- decode-closed-value
  [value]
  (let [icon-type (aget value "iconType")
        properties-kind (aget value "propertiesKind")]
    (cond-> {:db-ident (keyword (aget value "ident"))
             :value (aget value "value")
             :uuid (uuid (aget value "uuid"))}
      (some? icon-type)
      (assoc :icon {:type (keyword icon-type)
                    :id (aget value "iconId")})

      (= "nil" properties-kind)
      (assoc :properties nil)

      (= "checkbox" properties-kind)
      (assoc :properties
             {:logseq.property/choice-checkbox-state
              (aget value "checkboxState")}))))

(defn closed-values
  [ident]
  (some->> ((.-closedValues property-api)
            (if (keyword? ident) (subs (str ident) 1) (str ident)))
           seq
           (mapv decode-closed-value)))

(def built-in-properties
  (into
   (ordered-map)
   (map (fn [entry]
          (let [title (aget entry "title")
                attribute (aget entry "attribute")
                queryable? (aget entry "queryable")
                properties (seq (aget entry "properties"))
                closed-value-entries (seq (aget entry "closedValues"))]
            [(keyword (aget entry "ident"))
             (cond-> {:schema (decode-schema (aget entry "schema"))}
               (some? title) (assoc :title title)
               (some? attribute) (assoc :attribute (keyword attribute))
               (some? queryable?) (assoc :queryable? queryable?)
               (seq properties)
               (assoc :properties
                      (into {}
                            (map (fn [[property value]]
                                   [(keyword property) (decode-scalar value)]))
                            properties))
               (seq closed-value-entries)
               (assoc :closed-values
                      (mapv decode-closed-value closed-value-entries))
               (aget entry "rtcIgnoreAttrWhenSyncing")
               (assoc :rtc {:rtc/ignore-attr-when-syncing true}))]))
        (seq (.-entries property-api)))))

(def public-built-in-properties
  (keyword-set (.-publicBuiltInProperties property-api)))

(def db-attribute-properties
  (keyword-set (.-dbAttributeProperties property-api)))

(def private-db-attribute-properties
  (keyword-set (.-privateDbAttributeProperties property-api)))

(def public-db-attribute-properties
  (keyword-set (.-publicDbAttributeProperties property-api)))

(def read-only-properties
  (keyword-set (.-readOnlyProperties property-api)))

(def schema-properties-map
  (into {}
        (map (fn [[schema-property property]]
               [(keyword schema-property) (keyword property)]))
        (seq (.-schemaPropertiesMap property-api))))

(def schema-properties
  (keyword-set (.-schemaProperties property-api)))

(def logseq-property-namespaces
  (set (seq (.-logseqPropertyNamespaces property-api))))
