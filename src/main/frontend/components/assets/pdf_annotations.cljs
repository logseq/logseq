(ns frontend.components.assets.pdf-annotations
  "PDF annotation row data helpers for Asset tables."
  (:require [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.state :as state]))

(def empty-pdf-annotation-asset-index
  "Empty PDF annotation index keyed by image asset and PDF asset ids."
  {:image-id->annotation {}
   :pdf-id->annotations {}})

(defn- annotation-position-value
  [annotation k]
  (or (get-in annotation [:logseq.property.pdf/hl-value :position :bounding k])
      js/Number.MAX_SAFE_INTEGER))

(defn- annotation-sort-key
  "Returns a stable visual-order sort key for PDF annotations."
  [annotation]
  [(or (:logseq.property.pdf/hl-page annotation) js/Number.MAX_SAFE_INTEGER)
   (annotation-position-value annotation :y1)
   (annotation-position-value annotation :x1)
   (or (:block/order annotation) js/Number.MAX_SAFE_INTEGER)
   (:db/id annotation)])

(defn- entity-id
  "Returns the db id from an entity map or numeric id."
  [x]
  (or (:db/id x)
      (when (number? x) x)))

(defn- entity-identities
  [x]
  (cond
    (map? x) (keep x [:block/uuid :db/id])
    (or (uuid? x) (string? x) (number? x)) [x]
    :else nil))

(defn row-id
  "Returns the worker-backed table identity for `row`."
  [row]
  (if (map? row)
    (or (:block/uuid row) (:db/id row))
    row))

(defn build-pdf-annotation-asset-index
  "Builds lookup maps from PDF annotation blocks."
  [annotations]
  (let [index (reduce
               (fn [index annotation]
                 (let [pdf-ids (entity-identities (:logseq.property/asset annotation))
                       image-ids (entity-identities (:logseq.property.pdf/hl-image annotation))]
                   (if (and (seq pdf-ids) (seq image-ids))
                     (let [index (reduce (fn [index image-id]
                                          (assoc-in index [:image-id->annotation image-id] annotation))
                                        index
                                        image-ids)]
                       (reduce (fn [index pdf-id]
                                 (update-in index [:pdf-id->annotations pdf-id] (fnil conj []) annotation))
                               index
                               pdf-ids))
                     index)))
               empty-pdf-annotation-asset-index
               annotations)]
    (update index :pdf-id->annotations
            (fn [pdf-id->annotations]
              (reduce-kv
               (fn [m pdf-id annotations]
                 (assoc m pdf-id (sort-by annotation-sort-key annotations)))
               {}
               pdf-id->annotations)))))

(defn pdf-asset?
  "Returns true when `row` is a PDF asset row."
  [row]
  (= "pdf" (some-> (:logseq.property.asset/type row) name)))

(defn- pending-pdf-area-image-asset?
  [row]
  (when-let [id (row-id row)]
    (pdf-assets/pending-area-image-asset? (state/get-current-repo) id)))

(defn- annotation-image-id
  "Returns the image asset id attached to `annotation`."
  [annotation]
  (entity-id (:logseq.property.pdf/hl-image annotation)))

(defn- annotation-image-identity
  [annotation reference-id]
  (let [image (:logseq.property.pdf/hl-image annotation)]
    (if (or (uuid? reference-id) (string? reference-id))
      (or (:block/uuid image) (:db/id image))
      (or (:db/id image) (:block/uuid image)))))

(defn- normalize-pdf-annotation
  "Normalizes numeric asset refs in `annotation` into db id maps."
  [annotation image-id]
  (cond-> annotation
    (number? (:logseq.property/asset annotation))
    (update :logseq.property/asset #(hash-map :db/id %))

    (number? (:logseq.property.pdf/hl-image annotation))
    (update :logseq.property.pdf/hl-image #(hash-map :db/id %))

    (nil? (:logseq.property.pdf/hl-image annotation))
    (assoc :logseq.property.pdf/hl-image
           (if (or (uuid? image-id) (string? image-id))
             {:block/uuid image-id}
             {:db/id image-id}))))

(defn- pdf-annotation-block?
  "Returns true when `annotation` looks like the parent of image asset `image-id`."
  [annotation image-id]
  (and annotation
       (some #{image-id} (entity-identities (:logseq.property.pdf/hl-image annotation)))
       (seq (entity-identities (:logseq.property/asset annotation)))
       (or (= :annotation (:logseq.property/ls-type annotation))
           (:logseq.property.pdf/hl-page annotation)
           (:logseq.property.pdf/hl-value annotation)
           (some #(= :logseq.class/Pdf-annotation (:db/ident %))
                 (:block/tags annotation)))))

(defn- row-pdf-annotation
  "Returns the PDF annotation parent attached to an image asset row."
  [row]
  (when (map? row)
    (when-let [id (row-id row)]
      (let [annotation (:block/parent row)]
        (when (pdf-annotation-block? annotation id)
          (normalize-pdf-annotation annotation id))))))

(defn augment-pdf-annotation-asset-index
  "Adds annotation parents found on current `rows` to `annotation-index`."
  [annotation-index rows]
  (if (every? #(or (number? %) (uuid? %) (string? %) (map? %)) rows)
    (let [row-annotations (keep row-pdf-annotation rows)]
      (if (seq row-annotations)
        (->> (concat (mapcat identity (vals (:pdf-id->annotations annotation-index)))
                     row-annotations)
             (reduce (fn [m annotation]
                       (assoc m (or (:db/id annotation)
                                    (annotation-image-id annotation))
                              annotation))
                     {})
             vals
             build-pdf-annotation-asset-index)
        annotation-index))
    annotation-index))

(defn- pdf-annotation-image-ids
  "Returns annotation image asset ids for `pdf-id`."
  [annotation-index pdf-id]
  (keep #(annotation-image-identity % pdf-id)
        (get-in annotation-index [:pdf-id->annotations pdf-id])))

(defn asset-row-selection-related-ids
  "Returns annotation image ids selected together with a PDF parent row."
  [row annotation-index]
  (when (pdf-asset? row)
    (let [id (row-id row)]
      (pdf-annotation-image-ids annotation-index id))))

(defn expand-selected-asset-row-ids
  "Expands selected PDF parent rows to include their annotation image ids."
  [selected-ids row-selection _rows annotation-index]
  (let [excluded-ids (set (:excluded-ids row-selection))
        annotation-image-id? (set (keys (:image-id->annotation annotation-index)))]
    (->> (if (:selected-all? row-selection)
           (mapcat (fn [id]
                     (cons id (pdf-annotation-image-ids annotation-index id)))
                   selected-ids)
           (concat selected-ids
                   (filter annotation-image-id? (:selected-ids row-selection))))
         (remove #(contains? excluded-ids %))
         (remove nil?)
         distinct
         vec)))

(defn build-pdf-annotation-table-data
  "Builds expanded Asset table rows with annotation images nested under PDFs."
  ([rows annotation-index expanded-pdf-ids]
   (build-pdf-annotation-table-data rows annotation-index expanded-pdf-ids pending-pdf-area-image-asset?))
  ([rows annotation-index expanded-pdf-ids pending-area-image-asset?]
   (if (every? #(or (number? %) (uuid? %) (string? %) (map? %)) rows)
     (let [row-ids (set (keep row-id rows))
           image-id->annotation (:image-id->annotation annotation-index)
           pdf-id->annotations (:pdf-id->annotations annotation-index)
           nested-image-id? (fn [id]
                              (contains? image-id->annotation id))
           child-rows (fn [annotations]
                        (keep (fn [annotation]
                                (when-let [image-id (some row-ids
                                                         (entity-identities
                                                          (:logseq.property.pdf/hl-image annotation)))]
                                  (when (contains? row-ids image-id)
                                    (cond-> {:asset-table/nested? true
                                             :asset-table/annotation-id (:db/id annotation)}
                                      (or (uuid? image-id) (string? image-id))
                                      (assoc :block/uuid image-id)

                                      (number? image-id)
                                      (assoc :db/id image-id)))))
                              annotations))]
       (vec
        (reduce
         (fn [result row]
           (let [id (row-id row)]
             (cond
               (nested-image-id? id)
               result

               (pending-area-image-asset? row)
               result

               (seq (get pdf-id->annotations id))
               (let [expanded? (contains? expanded-pdf-ids id)
                     row' (cond
                            (map? row) row
                            (or (uuid? row) (string? row)) {:block/uuid row}
                            :else {:db/id row})
                     result' (conj result (assoc row' :asset-table/expanded? expanded?))]
                 (if expanded?
                   (into result' (child-rows (get pdf-id->annotations id)))
                   result'))

               :else
               (conj result row))))
         []
         rows)))
     ;; Grouped Asset rows are left unchanged. Default Asset columns do not expose
     ;; group-by candidates; custom grouped Asset views need a separate nested-row UX.
     rows)))
