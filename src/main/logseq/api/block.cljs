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
            [logseq.db.frontend.property :as db-property]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

(defn- encode-user-property-name
  [k]
  (if (string? k)
    (-> k (string/trim)
        (string/replace "/" "")
        (string/replace " " ""))
    k))

(defn convert?to-built-in-property-name
  [property-name]
  (if (and (not (qualified-keyword? property-name))
           (contains? #{:background-color} property-name))
    (keyword :logseq.property property-name)
    property-name))

;; FIXME: This ns should not be creating idents. This allows for ident conflicts
;; and assumes that names directly map to idents which is incorrect and breaks for multiple
;; cases e.g. a property that has been renamed or sanitized. Instead it should
;; find a property's ident by looking up the property in the db by its title
(defn get-db-ident-for-user-property-name
  "Finds a property :db/ident for a given property name"
  [property-name]
  (let [property-name' (if (string? property-name)
                         (keyword property-name) property-name)
        property-name' (convert?to-built-in-property-name property-name')]
    (if (qualified-keyword? property-name')
      property-name'
      (keyword "plugin.property" (encode-user-property-name property-name)))))

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

(defn infer-property-value-type-to-save!
  [ident value]
  (let [multi? (coll? value)
        value-handle
        (fn []
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
            [ident value nil false]))]
    (if (not (db-utils/entity ident))
      (let [type (cond
                   (boolean? value) :checkbox
                   (number? value) :number
                   (coll? value) :node
                   :else :default)
            schema {:type type :cardinality (if multi? :many :one)}]
        (p/chain
         (db-property-handler/upsert-property! ident schema {})
         value-handle))
      (value-handle))))

(defn save-db-based-block-properties!
  [block properties]
  (when-let [block-id (and (seq properties) (:db/id block))]
    (let [properties (update-keys properties
                                  (fn [k] (get-db-ident-for-user-property-name k)))
          *properties-page-refs (volatile! {})]
      (-> (for [ident (keys properties)]
            (p/let [ret (infer-property-value-type-to-save! ident (get properties ident))] ret))
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
                          (db-property-handler/set-block-property! block-id ident :logseq.property/empty-placeholder)))))))))))))

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
                      (let [blocks (db-model/get-block-and-children repo uuid)]
                        (first (outliner-tree/blocks->vec-tree blocks uuid)))
                      ;; attached shallow children
                      (assoc block :block/children
                             (map #(list :uuid (:block/uuid %))
                                  (db/get-block-immediate-children repo uuid))))
              block (into-properties repo block)]
          (bean/->js (sdk-utils/normalize-keyword-for-json block)))))))
