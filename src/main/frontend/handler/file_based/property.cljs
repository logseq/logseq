(ns frontend.handler.file-based.property
  "Properties handler for file graphs and file graph specific feature implementations"
  (:require [frontend.handler.file-based.property.util :as property]
            [frontend.config :as config]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.graph-parser.util :as gp-util]
            [frontend.handler.block :as block-handler]))

;; Why need these XXX-when-file-based fns?
;; there're a lot of usages of property-related fns(e.g. property/insert-property) in the whole codebase.
;; I want to minimize extensive modifications as much as possible when we add db-based graph support.

;; (def insert-property
;;   (fn-when-file-based property/insert-property [format content key value & args]))
(defn insert-property
  [format content key value & args]
  (apply property/insert-property format content key value args))

(defn insert-properties-when-file-based
  [repo format content kvs]
  (if (config/db-based-graph? repo)
    content
    (property/insert-properties format content kvs)))

(defn remove-property-when-file-based
  [repo format key content & args]
  (if (config/db-based-graph? repo)
    content
    (apply property/remove-property format key content args)))

(defn remove-properties-when-file-based
  [repo format content]
  (if (config/db-based-graph? repo)
    content
    (property/remove-properties format content)))

(defn remove-id-property
  [format content]
  (property/remove-id-property format content))

(defn remove-built-in-properties-when-file-based
  [repo format content]
  (if (config/db-based-graph? repo)
    content
    (property/remove-built-in-properties format content)))

(defn remove-empty-properties-when-file-based
  [repo content]
  (if (config/db-based-graph? repo)
    content
    (property/remove-empty-properties content)))

(defn with-built-in-properties-when-file-based
  [repo properties content format]
  (if (config/db-based-graph? repo)
    content
    (property/with-built-in-properties properties content format)))


(def hidden-properties property/hidden-properties)
(def built-in-properties property/built-in-properties)
(def properties-hidden? property/properties-hidden?)
(def property-key-exist?-when-file-based property/property-key-exist?)
(def goto-properties-end-when-file-based property/goto-properties-end)
(def front-matter?-when-file-based property/front-matter?)

(defn batch-set-block-property-aux!
  "col: a collection of [block-id property-key property-value]."
  [col]
  #_:clj-kondo/ignore
  (when-let [repo (state/get-current-repo)]
    (let [col' (group-by first col)]
      (outliner-tx/transact!
       {:outliner-op :save-block}
       (doseq [[block-id items] col']
         (let [block-id (if (string? block-id) (uuid block-id) block-id)
               new-properties (zipmap (map second items)
                                      (map last items))]
           (when-let [block (db/entity [:block/uuid block-id])]
             (let [format (:block/format block)
                   content (:block/content block)
                   properties (:block/properties block)
                   properties-text-values (:block/properties-text-values block)
                   properties (-> (merge properties new-properties)
                                  gp-util/remove-nils-non-nested)
                   properties-text-values (-> (merge properties-text-values new-properties)
                                              gp-util/remove-nils-non-nested)
                   property-ks (->> (concat (:block/properties-order block)
                                            (map second items))
                                    (filter (set (keys properties)))
                                    distinct
                                    vec)
                   content (remove-properties-when-file-based repo format content)
                   kvs (for [key property-ks] [key (or (get properties-text-values key)
                                                       (get properties key))])
                   content (insert-properties-when-file-based repo format content kvs)
                   content (remove-empty-properties-when-file-based repo content)
                   block {:block/uuid block-id
                          :block/properties properties
                          :block/properties-order property-ks
                          :block/properties-text-values properties-text-values
                          :block/content content}]
               (outliner-core/save-block! block)))))))

    (let [block-id (ffirst col)
          block-id (if (string? block-id) (uuid block-id) block-id)
          input-pos (or (state/get-edit-pos) :max)]
      ;; update editing input content
      (when-let [editing-block (state/get-edit-block)]
        (when (= (:block/uuid editing-block) block-id)
          (block-handler/edit-block! editing-block
                                     input-pos
                                     (state/get-edit-input-id)))))))

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
