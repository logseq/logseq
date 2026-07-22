(ns logseq.melange.bridge.db.validation
  "DB validation representation boundary."
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.db.property :as melange-property]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private validation-identity-api (.-ValidationIdentity melange-db))
(def ^:private validation-datom-api (.-ValidationDatom melange-db))
(def ^:private validation-entity-api (.-ValidationEntity melange-db))
(def ^:private validation-database-api (.-ValidationDatabase melange-db))
(def ^:private validation-property-api (.-ValidationProperty melange-db))
(def ^:private validation-schema-api (.-ValidationSchema melange-db))

(def required-properties
  "Set of properties required directly by closed entity schemas."
  (set (map keyword
            (seq (.-requiredProperties validation-property-api)))))

(defn user-property?
  "Returns true when the keyword is a qualified user-property ident."
  [value]
  ((.-isUserPropertyIdent validation-identity-api)
   (namespace value)
   (qualified-keyword? value)))

(defn class?
  "Returns true when the keyword is a qualified class ident."
  [value]
  ((.-isClassIdent validation-identity-api)
   (namespace value)
   (qualified-keyword? value)))

(defn internal-ident?
  "Returns true when the keyword ident is owned by Logseq."
  [value]
  ((.-isInternalIdent validation-identity-api)
   (namespace value)
   (if (keyword? value) (subs (str value) 1) (str value))))

(defn datoms->entity-maps
  "Returns entity maps for `:eavt` datoms, indexed by DB id.

  `:entity-fn` optionally resolves a property ident to its entity. Without it,
  entities from the datom collection are used."
  [datoms & {:keys [entity-fn]}]
  ((.-entityMapsWith validation-datom-api)
   (runtime/runtime-adapter)
   (d/adapter)
   (to-array datoms)
   entity-fn))

(defn datoms->entities
  "Returns entity maps with `:db/id` for the supplied `:eavt` datoms."
  [datoms & {:keys [entity-fn]}]
  (vec
   (array-seq
    ((.-entitiesWith validation-datom-api)
     (runtime/runtime-adapter)
     (d/adapter)
     (to-array datoms)
     entity-fn))))

(defn entity-dispatch-key
  "Returns the closed validation schema key for an entity, or nil."
  [db entity]
  (let [kind ((.-dispatchWith validation-entity-api)
              (runtime/runtime-adapter)
              (d/adapter)
              db
              entity)]
    (some-> kind keyword)))

(defn update-properties-in-ents
  "Prepares entity properties for closed DB validation."
  [db entities]
  (vec
   (array-seq
    ((.-prepareEntitiesWith validation-property-api)
     (runtime/runtime-adapter)
     (d/adapter)
     db
     (to-array entities)))))

(defn validate-property-value
  "Validates a prepared property tuple through typed validation decisions."
  [db validate-fn [property property-value]
   & {:keys [new-closed-value? closed-values-validate?]
      :as validate-options}]
  ((.-validatePropertyValueWith validation-property-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   property
   property-value
   #js {:newClosedValue (boolean new-closed-value?)
        :closedValuesValidate (boolean closed-values-validate?)
        :skipStrictUrlValidate false}
   (fn [value]
     (boolean (validate-fn value)))
   (fn [value]
     (boolean (validate-fn db value validate-options)))))

(defn property-value-error-message
  "Returns the stable validation message for a property type."
  [property-type]
  ((.-errorMessage validation-property-api)
   (if (keyword? property-type)
     (name property-type)
     (str property-type))))

(defn property-value-valid?
  "Validates a property tuple without constructing a Malli schema."
  [db [property property-value]
   & {:keys [new-closed-value?
             closed-values-validate?
             skip-strict-url-validate?]}]
  ((.-valueValidWith validation-property-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   property
   property-value
   #js {:newClosedValue (boolean new-closed-value?)
        :closedValuesValidate (boolean closed-values-validate?)
        :skipStrictUrlValidate (boolean skip-strict-url-validate?)}))

(defn- validation-options->js
  [{:keys [closed-schema? dispatch-key new-closed-value?
           closed-values-validate? skip-strict-url-validate?]
    :or {closed-schema? true}}]
  #js {:dispatchKey (some-> dispatch-key runtime/to-string)
       :closedSchema (boolean closed-schema?)
       :newClosedValue (boolean new-closed-value?)
       :closedValuesValidate (boolean closed-values-validate?)
       :skipStrictUrlValidate (boolean skip-strict-url-validate?)})

(defn- validation-result->map
  [^js result]
  (let [error-details
        (mapv (fn [^js error]
                {:attribute (some-> (.-attribute error) keyword)
                 :category (keyword (.-category error))
                 :message (.-message error)})
              (seq (.-errorDetails result)))
        error-groups (seq (.-errors result))]
    {:dispatch-key (some-> (.-dispatchKey result) keyword)
     :errors
     (when error-groups
       (into {}
             (map (fn [^js group]
                    [(if-let [attribute (.-attribute group)]
                       (keyword attribute)
                       :entity)
                     (vec (seq (.-messages group)))])
                  error-groups)))
     :error-details error-details}))

(defn validate-entity-map
  "Validates one prepared entity map and returns typed error details."
  [db entity & {:as validate-options}]
  (-> ((.-validateEntityWith validation-schema-api)
       (runtime/runtime-adapter)
       (d/adapter)
       db
       entity
       (validation-options->js validate-options))
      validation-result->map))

(defn- entity-errors->maps
  [errors]
  (mapv (fn [^js error]
          (assoc (validation-result->map error)
                 :entity (.-entity error)))
        (seq errors)))

(defn validate-tx-report
  "Validates changed entities in a DataScript transaction report."
  [report {:keys [closed-schema?]}]
  (let [^js result
        ((.-validateTransactionWith validation-schema-api)
         (runtime/runtime-adapter)
         (d/adapter)
         report
         (validation-options->js
          {:closed-schema? (boolean closed-schema?)
           :skip-strict-url-validate? true}))]
    (if (.-valid result)
      [true nil]
      [false (entity-errors->maps (.-errors result))])))

(defn validate-db
  "Validates every entity in a DataScript DB using closed OCaml schemas."
  [db]
  (let [^js result
        ((.-validateDatabaseWith validation-schema-api)
         (runtime/runtime-adapter)
         (d/adapter)
         db
         (validation-options->js {:closed-schema? true}))
        errors (entity-errors->maps (.-errors result))]
    (cond-> {:datom-count (.-datomCount result)
             :entities (vec (seq (.-entities result)))}
      (seq errors) (assoc :errors errors))))

(defn graph-counts
  "Calculates graph-wide entity and property counts."
  [db entities]
  (js->clj
   ((.-graphCountsWith validation-database-api)
    (runtime/runtime-adapter)
    (d/adapter)
    db
    (to-array entities))
   :keywordize-keys true))

(defn validate-local-db!
  "Validates a local non-RTC DataScript DB."
  [db & {:keys [db-name open-schema verbose]}]
  (let [^js result
        ((.-validateLocalDatabaseAndLogWith validation-schema-api)
         (runtime/runtime-adapter)
         (d/adapter)
         db
         (validation-options->js
          {:closed-schema? (not open-schema)
           :closed-values-validate? true})
         (boolean verbose)
         db-name
         (fn [database-name counts]
           (println
            "Read graph"
            (str database-name " with counts: "
                 (pr-str (js->clj counts :keywordize-keys true))))))
        errors (entity-errors->maps (.-errors result))]
    (when (seq errors)
      {:errors errors})))
