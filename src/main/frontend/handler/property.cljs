(ns frontend.handler.property
  "Block properties handler."
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.util :as util]
            [frontend.format.block :as block]
            [clojure.string :as string]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.block :as gp-block]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.transaction :as outliner-tx]))

(defn toggle-properties
  [id]
  (state/update-state! [:ui/properties-show? id] not))

(defn add-property!
  [block-db-id key]
  (let [block (db/pull block-db-id)
        key (string/trim key)
        key-name (util/page-name-sanity-lc key)
        property (db/entity [:block/name key-name])]
    (when-not (or
               (= (:block/name block) key-name)
               (and property
                    (or
                     (= (:block/type property) "tag")
                     (= (:db/id property) (:db/id block)))))
      (let [property-uuid (db/new-block-id)]
        (db/transact! (state/get-current-repo)
          [
           ;; property
           {:block/uuid property-uuid
            :block/type "property"
            :block/original-name key
            :block/name key-name}

           {:block/uuid (:block/uuid block)
            :block/properties (assoc (:block/properties block)
                                     property-uuid "")}])))))

(defn set-namespace!
  [page-db-id page-name]
  (let [page-name (util/page-name-sanity-lc page-name)
        page (db/entity [:block/name page-name])]
    (when page
      (db/transact! (state/get-current-repo)
        [{:db/id page-db-id
          :block/namespace (:db/id page)}]))))

;; TODO spec
(defn set-property-schema!
  [entity key value]
  (let [schema (assoc (:block/property-schema entity) key value)]
    (db/transact! (state/get-current-repo)
      [{:db/id (:db/id entity)
        :block/property-schema schema}])))

(defn- extract-refs
  [entity properties]
  (let [property-values (->>
                         (map (fn [v]
                                (if (coll? v)
                                  v
                                  [v]))
                           (vals properties))
                         (apply concat)
                         (filter string?))
        block-text (string/join " "
                                (cons
                                 (:block/content entity)
                                 property-values))
        ast-refs (gp-mldoc/get-references block-text (gp-mldoc/default-config :markdown))
        refs (map #(or (gp-block/get-page-reference % #{})
                       (gp-block/get-block-reference %)) ast-refs)
        refs' (->> refs
                   (remove string/blank?)
                   distinct)]
    (map #(if (util/uuid-string? %)
            [:block/uuid (uuid %)]
            (block/page-name->map % true)) refs')))

(defn add-property-value!
  [entity property-id property-value]
  (when (not= property-id (:block/uuid entity))
    (let [properties (:block/properties entity)
          properties' (assoc properties property-id property-value)
          refs (extract-refs entity properties')]
      (outliner-tx/transact!
        {:outliner-op :save-block}
        (outliner-core/save-block!
         {:block/uuid (:block/uuid entity)
          :block/properties properties'
          :block/refs refs})))))

(defn delete-property!
  [entity property-id]
  (when (and entity (uuid? property-id))
    (let [properties' (dissoc (:block/properties entity) property-id)
          refs (extract-refs entity properties')]
      (outliner-tx/transact!
        {:outliner-op :save-block}
        (outliner-core/save-block!
         {:block/uuid (:block/uuid entity)
          :block/properties properties'
          :block/refs refs})))))
