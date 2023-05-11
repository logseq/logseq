(ns frontend.handler.editor.property
  "Property related fns for the editor"
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.drawer :as drawer]
            [frontend.util.property :as property]
            [goog.object :as gobj]
            [logseq.graph-parser.util :as gp-util]))

(defn clear-selection!
  []
  (state/clear-selection!))

(defn- get-edit-input-id-with-block-id
  [block-id]
  (when-let [first-block (util/get-first-block-by-id block-id)]
    (string/replace (gobj/get first-block "id")
                    "ls-block"
                    "edit-block")))

(defn- text-range-by-lst-fst-line [content [direction pos]]
  (case direction
    :up
    (let [last-new-line (or (string/last-index-of content \newline) -1)
          end (+ last-new-line pos 1)]
      (subs content 0 end))
    :down
    (-> (string/split-lines content)
        first
        (or "")
        (subs 0 pos))))

(defn edit-block!
  ([block pos id]
   (edit-block! block pos id nil))
  ([block pos id {:keys [custom-content tail-len move-cursor? retry-times]
                  :or {tail-len 0
                       move-cursor? true
                       retry-times 0}
                  :as opts}]
   (when-not (> retry-times 2)
     (when-not config/publishing?
       (when-let [block-id (:block/uuid block)]
         (let [block (or (db/pull [:block/uuid block-id]) block)
               edit-input-id (if (uuid? id)
                               (get-edit-input-id-with-block-id id)
                               (-> (str (subs id 0 (- (count id) 36)) block-id)
                                   (string/replace "ls-block" "edit-block")))
               content (or custom-content (:block/content block) "")
               content-length (count content)
               text-range (cond
                            (vector? pos)
                            (text-range-by-lst-fst-line content pos)

                            (and (> tail-len 0) (>= (count content) tail-len))
                            (subs content 0 (- (count content) tail-len))

                            (or (= :max pos) (<= content-length pos))
                            content

                            :else
                            (subs content 0 pos))
               content (-> (property/remove-built-in-properties (:block/format block)
                                                                content)
                           (drawer/remove-logbook))]
           (clear-selection!)
           (if edit-input-id
             (state/set-editing! edit-input-id content block text-range move-cursor?)
             ;; Block may not be rendered yet
             (js/setTimeout (fn [] (edit-block! block pos id (update opts :retry-times inc))) 10))))))))

(defn batch-set-block-property!
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
                   content (property/remove-properties format content)
                   kvs (for [key property-ks] [key (or (get properties-text-values key)
                                                       (get properties key))])
                   content (property/insert-properties format content kvs)
                   content (property/remove-empty-properties content)
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
          (edit-block! editing-block
                       input-pos
                       (state/get-edit-input-id)))))))

(defn batch-add-block-property!
  [block-ids property-key property-value]
  (batch-set-block-property! (map #(vector % property-key property-value) block-ids)))

(defn batch-remove-block-property!
  [block-ids property-key]
  (batch-set-block-property! (map #(vector % property-key nil) block-ids)))

(defn remove-block-property!
  [block-id key]
  (let [key (keyword key)]
    (batch-set-block-property! [[block-id key nil]])))

(defn set-block-property!
  [block-id key value]
  (let [key (keyword key)]
    (batch-set-block-property! [[block-id key value]])))