(ns frontend.handler.file-based.property
  "Property handlers for file based graphs"
  (:require [frontend.db :as db]
            [frontend.handler.block :as block-handler]
            [frontend.handler.file-based.property.util :as property-util]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(defn insert-property
  [format content key value & args]
  (apply property-util/insert-property format content key value args))

(defn remove-id-property
  [format content]
  (property-util/remove-id-property format content))

(def hidden-properties property-util/hidden-properties)
(def built-in-properties property-util/built-in-properties)

(defn batch-set-block-property-aux!
  "col: a collection of [block-id property-key property-value]."
  [col]
  (let [col' (group-by first col)]
    (p/do!
     (ui-outliner-tx/transact!
      {:outliner-op :save-block}
      (doseq [[block-id items] col']
        (let [block-id (if (string? block-id) (uuid block-id) block-id)
              new-properties (zipmap (map second items)
                                     (map last items))]
          (when-let [block (db/entity [:block/uuid block-id])]
            (let [format (:block/format block)
                  content (:block/title block)
                  properties (:block/properties block)
                  properties-text-values (:block/properties-text-values block)
                  properties (-> (merge properties new-properties)
                                 common-util/remove-nils-non-nested)
                  properties-text-values (-> (merge properties-text-values new-properties)
                                             common-util/remove-nils-non-nested)
                  property-ks (->> (concat (:block/properties-order block)
                                           (map second items))
                                   (filter (set (keys properties)))
                                   distinct
                                   vec)
                  content (property-util/remove-properties format content)
                  kvs (for [key property-ks] [key (or (get properties-text-values key)
                                                      (get properties key))])
                  content (property-util/insert-properties format content kvs)
                  content (property-util/remove-empty-properties content)
                  block {:block/uuid block-id
                         :block/properties properties
                         :block/properties-order property-ks
                         :block/properties-text-values properties-text-values
                         :block/title content}]
              (outliner-op/save-block! block {:retract-attributes? false}))))))
     (let [block-id (ffirst col)
           block-id (if (string? block-id) (uuid block-id) block-id)
           input-pos (or (state/get-edit-pos) :max)]
    ;; update editing input content
       (when-let [editing-block (state/get-edit-block)]
         (when (= (:block/uuid editing-block) block-id)
           (block-handler/edit-block! editing-block input-pos)))))))

(defn batch-set-block-property!
  [block-ids property-key property-value]
  (batch-set-block-property-aux! (map #(vector % property-key property-value) block-ids)))

(defn batch-remove-block-property!
  [block-ids property-key]
  (batch-set-block-property! block-ids property-key nil))

(defn remove-block-property!
  [block-id key]
  (let [key (keyword key)]
    (batch-set-block-property-aux! [[block-id key nil]])))

(defn set-block-property!
  [block-id key value]
  (let [key (keyword key)]
    (batch-set-block-property-aux! [[block-id key value]])))
