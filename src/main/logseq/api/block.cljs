(ns logseq.api.block
  "Block related apis"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as conn]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.db-based.property.util :as db-pu]
            [frontend.handler.page :as page-handler]
            [frontend.handler.property :as property-handler]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [logseq.db.frontend.db-ident :as db-ident]
            [logseq.db.frontend.property :as db-property]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

(defn convert?to-built-in-property-name
  [property-name]
  (if (and (not (qualified-keyword? property-name))
        (contains? #{:background-color} property-name))
    (keyword :logseq.property property-name)
    property-name))

(defn sanitize-user-property-name
  [k]
  (if (string? k)
    (-> k (string/trim)
      (string/replace " " "")
      (string/replace #"^[:_\s]+" "")
      (#(cond-> %
          (not (string/includes? % "/"))
          (string/lower-case))))
    k))

(defn resolve-property-prefix-for-db
  [^js plugin]
  (->> (when (some-> js/window.LSPlugin (.-PluginLocal))
         (or (some->> plugin (.-id) (sanitize-user-property-name) (str "."))
           "._api"))
    (str "plugin.property")))

;; FIXME: This ns should not be creating idents. This allows for ident conflicts
;; and assumes that names directly map to idents which is incorrect and breaks for multiple
;; cases e.g. a property that has been renamed or sanitized. Instead it should
;; find a property's ident by looking up the property in the db by its title
(defn get-db-ident-for-user-property-name
  "Finds a property :db/ident for a given property name"
  ([property-name] (get-db-ident-for-user-property-name property-name "user.property"))
  ([property-name prefix]
   (let [property-name' (if (string? property-name)
                          (keyword property-name) property-name)
         property-name' (convert?to-built-in-property-name property-name')]
     (if (qualified-keyword? property-name') property-name'
       (db-ident/create-db-ident-from-name prefix (name property-name) false)))))

(defn plugin-property-key?
  [ident]
  (some-> ident (str)
    (string/starts-with? ":plugin.property.")))

(defn into-readable-db-properties
  [properties]
  (some-> properties
    (db-pu/readable-properties
      {:original-key? true :key-fn str})))

(defn into-properties
  ([block] (into-properties (state/get-current-repo) block))
  ([repo block]
   (if (some-> repo (config/db-based-graph?))
     (let [props (some->> block
                   (filter (fn [[k _]] (db-property/property? k)))
                   (into {})
                   (into-readable-db-properties))
           block (update block :block/properties merge props)
           block (apply dissoc (concat [block] (keys props)))]
       block)
     block)))

(defn parse-property-json-value-if-need
  [ident property-value]
  (when-let [prop (and (string? property-value)
                    (plugin-property-key? ident)
                    (some-> ident (db-utils/entity)))]
    (if (= (:logseq.property/type prop) :string)
      (try
        (js/JSON.parse property-value)
        (catch js/Error _e
          property-value))
      property-value)))

(defn infer-property-value-type-to-save!
  [ident value]
  (let [as-json? (coll? value)
        value-handle
        (fn [type multi?]
          (let [as-json? (or (= type :string) as-json?)]
            (if multi?
              (-> (for [v value]
                    (when-let [page (some-> v (str) (string/trim))]
                      (let [id (:db/id (ldb/get-case-page (conn/get-db) page))]
                        (if (nil? id)
                          (-> (page-handler/<create! page {:redirect? false})
                            (p/then #(:db/id %)))
                          id))))
                (p/all)
                (p/then (fn [vs] [ident :logseq.property/empty-placeholder vs true])))
              (let [value (if as-json? (js/JSON.stringify (bean/->js value)) value)]
                [ident value nil false]))))
        ent (db-utils/entity ident)]
    (if (not ent)
      (let [type (cond
                   (boolean? value) :checkbox
                   (number? value) :number
                   (coll? value) :string
                   :else :default)
            schema {:logseq.property/type type
                    :db/cardinality :one}]
        (p/chain
          (db-property-handler/upsert-property! ident schema {})
          (fn [] (value-handle type false))))
      (let [value-multi? (vector? value)
            ident (:db/ident ent)
            ent-type (:logseq.property/type ent)
            ent-type-str? (= ent-type :string)
            ent-multi? (= (:db/cardinality ent) :db.cardinality/many)
            cardinality-want-illegal-changed? (and (not value-multi?) ent-multi?)]
        (when cardinality-want-illegal-changed?
          (throw (js/Error. "Multiple property type can not be changed.")))
        (p/chain
          (db-property-handler/upsert-property! ident
            {:logseq.property/type ent-type
             :db/cardinality (if (and (not ent-type-str?) value-multi?) :many :one)}
            {})
          #(value-handle ent-type ent-multi?))))))

(defn save-db-based-block-properties!
  ([block properties] (save-db-based-block-properties! block properties nil))
  ([block properties ^js plugin]
   (when-let [block-id (and (seq properties) (:db/id block))]
     (let [properties (update-keys properties
                        (fn [k]
                          (let [prefix (resolve-property-prefix-for-db plugin)]
                            (get-db-ident-for-user-property-name k prefix))))
           *properties-page-refs (volatile! {})]
       (-> (for [ident (keys properties)]
             (p/let [ret (infer-property-value-type-to-save! ident (get properties ident))]
               ret))
         (p/all)
         (p/chain
           (fn [props]
             (->> props
               (reduce (fn [a [k v vs multi?]]
                         (if multi?
                           (do (vswap! *properties-page-refs assoc k vs) a)
                           (assoc a k v))) {})
               (db-property-handler/set-block-properties! block-id)))
           ;; handle page refs
           (fn []
             (when (seq @*properties-page-refs)
               (doseq [[ident refs] @*properties-page-refs]
                 (-> (property-handler/remove-block-property! (state/get-current-repo) block-id ident)
                   (p/then
                     (fn []
                       (if (seq refs)
                         (ui-outliner-tx/transact!
                           {:outliner-op :set-block-properties}
                           (doseq [eid refs]
                             (when (number? eid)
                               (property-handler/set-block-property!
                                 (state/get-current-repo) block-id ident eid))))
                         (db-property-handler/set-block-property! block-id ident :logseq.property/empty-placeholder))))))))))))))

(defn <sync-children-blocks!
  [block]
  (when block
    (db-async/<get-block (state/get-current-repo)
      (:block/uuid (:block/parent block)) {:children? true})))

(defn get_block
  [id-or-uuid ^js opts]
  (when-let [block (if (number? id-or-uuid)
                     (db-utils/pull id-or-uuid)
                     (and id-or-uuid (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error id-or-uuid))))]
    (when (or (true? (some-> opts (.-includePage)))
            (not (contains? block :block/name)))
      (when-let [uuid (:block/uuid block)]
        (let [{:keys [includeChildren]} (bean/->clj opts)
              repo (state/get-current-repo)
              block (if includeChildren
                      ;; nested children results
                      (let [blocks (->> (db-model/get-block-and-children repo uuid)
                                     (map (fn [b]
                                            (dissoc (db-utils/pull (:db/id b)) :block.temp/load-status))))]
                        (first (outliner-tree/blocks->vec-tree blocks uuid)))
                      ;; attached shallow children
                      (assoc block :block/children
                        (map #(list :uuid (:block/uuid %))
                          (db/get-block-immediate-children repo uuid))))
              block (into-properties repo block)]
          (bean/->js (sdk-utils/normalize-keyword-for-json block)))))))
