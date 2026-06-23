(ns frontend.components.assets.pdf-annotations
  "PDF annotation row data helpers for Asset tables."
  (:require [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.state :as state]
            [logseq.shui.table.core :as shui-table]
            [promesa.core :as p]))

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

(defn- build-pdf-annotation-asset-index
  "Builds lookup maps from PDF annotation blocks."
  [annotations]
  (let [index (reduce
               (fn [index annotation]
                 (let [pdf-asset (:logseq.property/asset annotation)
                       image-asset (:logseq.property.pdf/hl-image annotation)
                       pdf-id (:db/id pdf-asset)
                       image-id (:db/id image-asset)]
                   (if (and pdf-id image-id)
                     (-> index
                         (assoc-in [:image-id->annotation image-id] annotation)
                         (update-in [:pdf-id->annotations pdf-id] (fnil conj []) annotation))
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

(defn <pdf-annotation-asset-index
  "Loads the PDF annotation index for `repo`."
  [repo]
  (p/let [result (db-async/<q
                  repo
                  {:transact-db? false}
                  '[:find (pull ?annotation
                                [:db/id
                                 :block/order
                                 {:logseq.property/asset
                                  [:db/id
                                   :block/uuid
                                   :logseq.property.asset/external-url
                                   :logseq.property.asset/external-file-name]}
                                 {:logseq.property.pdf/hl-image
                                  [:db/id]}
                                 :logseq.property.pdf/hl-page
                                 :logseq.property.pdf/hl-value])
                    :where
                    [?annotation :block/tags :logseq.class/Pdf-annotation]])]
    (build-pdf-annotation-asset-index (map first result))))

(defn pdf-asset?
  "Returns true when `row` is a PDF asset row."
  [row]
  (= "pdf" (some-> (:logseq.property.asset/type row) name)))

(defn- pending-pdf-area-image-asset?
  [row]
  (when-let [id (shui-table/table-row-id row)]
    (pdf-assets/pending-area-image-asset? (state/get-current-repo) id)))

(defn- annotation-image-id
  "Returns the image asset id attached to `annotation`."
  [annotation]
  (entity-id (:logseq.property.pdf/hl-image annotation)))

(defn- normalize-pdf-annotation
  "Normalizes numeric asset refs in `annotation` into db id maps."
  [annotation image-id]
  (cond-> annotation
    (number? (:logseq.property/asset annotation))
    (update :logseq.property/asset #(hash-map :db/id %))

    (number? (:logseq.property.pdf/hl-image annotation))
    (update :logseq.property.pdf/hl-image #(hash-map :db/id %))

    (nil? (:logseq.property.pdf/hl-image annotation))
    (assoc :logseq.property.pdf/hl-image {:db/id image-id})))

(defn- pdf-annotation-block?
  "Returns true when `annotation` looks like the parent of image asset `image-id`."
  [annotation image-id]
  (and annotation
       (= image-id (annotation-image-id annotation))
       (entity-id (:logseq.property/asset annotation))
       (or (= :annotation (:logseq.property/ls-type annotation))
           (:logseq.property.pdf/hl-page annotation)
           (:logseq.property.pdf/hl-value annotation)
           (some #(= :logseq.class/Pdf-annotation (:db/ident %))
                 (:block/tags annotation)))))

(defn- row-pdf-annotation
  "Returns the PDF annotation parent attached to an image asset row."
  [row]
  (when-let [id (shui-table/table-row-id row)]
    (let [asset (or (db/entity id)
                    (when (map? row) row))
          annotation (:block/parent asset)]
      (when (pdf-annotation-block? annotation id)
        (normalize-pdf-annotation annotation id)))))

(defn augment-pdf-annotation-asset-index
  "Adds annotation parents found on current `rows` to `annotation-index`."
  [annotation-index rows]
  (if (every? #(or (number? %) (map? %)) rows)
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
  (keep annotation-image-id (get-in annotation-index [:pdf-id->annotations pdf-id])))

(defn asset-row-selection-related-ids
  "Returns annotation image ids selected together with a PDF parent row."
  [row annotation-index]
  (when (pdf-asset? row)
    (pdf-annotation-image-ids annotation-index (:db/id row))))

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
   (if (every? #(or (number? %) (map? %)) rows)
     (let [row-ids (set (keep shui-table/table-row-id rows))
           image-id->annotation (:image-id->annotation annotation-index)
           pdf-id->annotations (:pdf-id->annotations annotation-index)
           nested-image-id? (fn [id]
                              (contains? image-id->annotation id))
           child-rows (fn [annotations]
                        (keep (fn [annotation]
                                (when-let [image-id (annotation-image-id annotation)]
                                  (when (contains? row-ids image-id)
                                    {:db/id image-id
                                     :asset-table/nested? true
                                     :asset-table/annotation-id (:db/id annotation)})))
                              annotations))]
       (vec
        (reduce
         (fn [result row]
           (let [id (shui-table/table-row-id row)]
             (cond
               (nested-image-id? id)
               result

               (pending-area-image-asset? row)
               result

               (seq (get pdf-id->annotations id))
               (let [expanded? (contains? expanded-pdf-ids id)
                     row' (if (map? row) row {:db/id row})
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
