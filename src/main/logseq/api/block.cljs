(ns logseq.api.block
  "Block related apis"
  (:require [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [cljs-bean.core :as bean]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.db :as db]
            [logseq.db.frontend.property :as db-property]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.db-based.property.util :as db-pu]
            [logseq.sdk.utils :as sdk-utils]))

(defn- into-properties
  [repo block]
  (if (some-> repo (config/db-based-graph?))
    (let [props (some->> block
                  (filter (fn [[k _]] (db-property/property? k)))
                  (into {})
                  (db-pu/readable-properties))
          block (update block :block/properties merge props)
          block (apply dissoc (concat [block] (keys props)))]
      block)
    block))

(defn save-db-based-block-properties!
  [block properties]
  (when-let [block-id (and (seq properties) (:db/id block))]
    (some->>
      (update-keys properties
        (fn [k]
          (if (qualified-keyword? k) k
            (db-property/create-user-property-ident-from-name (name k)))))
      (db-property-handler/set-block-properties! block-id))))

(defn get_block
  [id-or-uuid ^js opts]
  (when-let [block (if (number? id-or-uuid)
                     (db-utils/pull id-or-uuid)
                     (and id-or-uuid (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error id-or-uuid))))]
    (when-not (contains? block :block/name)
      (when-let [uuid (:block/uuid block)]
        (let [{:keys [includeChildren]} (bean/->clj opts)
              repo  (state/get-current-repo)
              block (if includeChildren
                      ;; nested children results
                      (first (outliner-tree/blocks->vec-tree
                              (db-model/get-block-and-children repo uuid) uuid))
                      ;; attached shallow children
                      (assoc block :block/children
                             (map #(list :uuid (:block/uuid %))
                               (db/get-block-immediate-children repo uuid))))
              block (into-properties repo block)]
          (bean/->js (sdk-utils/normalize-keyword-for-json block)))))))
