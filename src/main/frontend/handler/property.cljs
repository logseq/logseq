(ns frontend.handler.property
  "Block properties handler."
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.util :as util]
            [frontend.format.block :as block]
            [clojure.string :as string]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.handler.notification :as notification]))

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
                         properties
                         (map (fn [[k v]]
                                (let [schema (:block/property-schema (db/pull [:block/uuid k]))
                                      object? (= (:type schema) "object")
                                      f (if object? page-ref/->page-ref identity)]
                                  (->> (if (coll? v)
                                         v
                                         [v])
                                       (map f)))))
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

(defn validate
  "Check whether the `value` validate against the `schema`."
  [schema value]
  (if (string/blank? value)
    [true value]
    (case (:type schema)
      "any" [true value]
      "number" (when-let [n (parse-double value)]
                 (let [[min-n max-n] [(:min schema) (:max schema)]
                       min-result (if min-n (>= n min-n) true)
                       max-result (if max-n (<= n max-n) true)]
                   (cond
                     (and min-result max-result)
                     [true n]

                     (false? min-result)
                     [false (str "the min value is " min-n)]

                     (false? max-result)
                     [false (str "the max value is " max-n)]

                     :else
                     n)))
      "date" (if-let [result (js/Date. value)]
               (if (not= (str result) "invalid Date")
                 [true value]
                 [false "invalid date"])
               [false "invalid date"])
      "url" (if (gp-util/url? value)
              [true value]
              [false "invalid URL"])
      "object" (if-let [page-name (page-ref/get-page-name value)]
                 [true page-name]
                 [false "invalid Object"]))))

(defn add-property-value!
  [entity property-id property-value]
  (when (not= property-id (:block/uuid entity))
    (when-let [property (db/pull [:block/uuid property-id])]
      (let [schema (:block/property-schema property)
            [success? property-value-or-error] (validate schema property-value)
            multiple-values? (:multiple-values? schema)
            object? (= "object" (:type schema))]
        (if success?
          (let [properties (:block/properties entity)
                property-value (get properties property-id)
                value (if multiple-values?
                        (conj (if (coll? property-value) (set property-value) #{property-value}) property-value-or-error)
                        property-value-or-error)
                refs (extract-refs entity (assoc properties property-id value))
                value (if (and multiple-values? object?)
                        (->> (map util/page-name-sanity-lc value)
                             (remove string/blank?)
                             (set))
                        value)
                properties' (assoc properties property-id value)]
            (outliner-tx/transact!
              {:outliner-op :save-block}
              (outliner-core/save-block!
               {:block/uuid (:block/uuid entity)
                :block/properties properties'
                :block/refs refs})))
          (notification/show!
           (str (:block/original-name property) ": " property-value-or-error)
           :warning))
        (state/clear-editor-action!)
        (state/clear-edit!)))))

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
