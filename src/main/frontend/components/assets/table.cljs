(ns frontend.components.assets.table
  "Asset-specific table columns and row rendering."
  (:require [clojure.string :as string]
            [frontend.components.assets.pdf-annotations :as pdf-annotations]
            [frontend.components.property.value :as pv]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.db.frontend.property :as db-property]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(defn- build-asset-file-column
  "Builds the Asset table file preview column."
  [config]
  {:id :file
   :name (t :file/label)
   :type :string
   ;; The file preview is a synthetic rendering of the asset block, not a real
   ;; property, so property header actions and sorting do not apply to it.
   :column-list? false
   :header (fn [_table column]
             [:div.h-8.w-full.flex.items-center.justify-start.px-2.text-muted-foreground
              (let [title (str (:name column))]
                (ui/tooltip
                 [:span.max-w-full.overflow-hidden.text-ellipsis title]
                 title))])
   :cell (fn [_table row _column]
           (when-let [asset-cp (state/get-component :block/asset-cp)]
             [:div.block-content.ls-table-asset-file-preview.overflow-hidden.flex.items-center
              {:class pv/asset-thumb-fit-class
               :style {:width "100%"
                       :height 30
                       :max-height 30}}
              (asset-cp (assoc config
                                :disable-resize? true
                                :hide-title? true)
                        row)]))
   :disable-hide? true})

(defn- pdf-annotation-title
  "Returns the display title for a PDF annotation row."
  [annotation]
  (let [title (:block/title annotation)
        title (if (and (not (string/blank? title))
                       (not= "pdf area highlight" title))
                title
                (t :asset/pdf-area-highlight-title))]
    (str "P" (or (:logseq.property.pdf/hl-page annotation) "?")
         " · "
         title)))

(defn- toggle-expanded-pdf-id
  "Toggles one PDF id in the expanded PDF id set."
  [ids pdf-id]
  (if (contains? ids pdf-id)
    (disj ids pdf-id)
    (conj ids pdf-id)))

(rum/defc asset-pdf-title-cell
  [original-cell table row column style annotation-index set-expanded-pdf-ids!]
  (let [pdf-id (:db/id row)
        annotations (get-in annotation-index [:pdf-id->annotations pdf-id])
        expanded? (:asset-table/expanded? row)]
    (if (seq annotations)
      (let [toggle (shui/button
                    {:variant "ghost"
                     :size :sm
                     :class "!h-6 !w-6 shrink-0 !p-0 text-muted-foreground"
                     :aria-label (t (if expanded?
                                      :asset/collapse-pdf-annotations
                                      :asset/expand-pdf-annotations))
                     :on-click (fn [e]
                                 (util/stop e)
                                 (set-expanded-pdf-ids!
                                  (fn [ids]
                                    (toggle-expanded-pdf-id ids pdf-id))))}
                    (ui/icon (if expanded? "chevron-down" "chevron-right")))]
        (original-cell table
                       (assoc row :table/title-leading-action
                              (ui/tooltip
                               toggle
                               (t (if expanded?
                                    :asset/collapse-pdf-annotations
                                    :asset/expand-pdf-annotations))))
                       column style))
      (original-cell table row column style))))

(rum/defc asset-annotation-title
  [annotation]
  (ui/tooltip
   (shui/button
    {:variant "ghost"
     :size :sm
     :class "min-w-0 justify-start !px-1 text-left font-normal"
     :aria-label (t :asset/open-pdf-annotation)
     :on-click (fn [e]
                 (util/stop e)
                 (pdf-assets/open-block-ref! annotation))}
    [:span.truncate (pdf-annotation-title annotation)])
   (t :asset/open-pdf-annotation)))

(defn- annotation-title-row
  "Adds title rendering metadata to an Asset annotation image row."
  [row annotation-index]
  (let [annotation (or (some-> row :asset-table/annotation-id db/entity)
                       (get-in annotation-index [:image-id->annotation (:db/id row)]))]
    (assoc row
           :table/hide-title-actions? true
           :table/title-only-editor? (some? annotation)
           :table/title-edit-block annotation
           :table/title-renderer
           (fn [_row]
             [:div.flex.h-full.w-full.min-w-0.items-center.gap-1.pl-6
              (if annotation
                (asset-annotation-title annotation)
                [:span.truncate.text-muted-foreground (:block/title row)])]))))

(defn- wrap-asset-title-column
  "Wraps the title column with PDF expand and annotation title behavior."
  [column annotation-index set-expanded-pdf-ids!]
  (let [original-cell (:cell column)]
    (assoc column
           :cell (fn [table row column style]
                   (cond
                     (:asset-table/nested? row)
                     (original-cell table (annotation-title-row row annotation-index) column style)

                     (and (pdf-annotations/pdf-asset? row)
                          (seq (get-in annotation-index [:pdf-id->annotations (:db/id row)])))
                     (asset-pdf-title-cell original-cell table row column style annotation-index
                                           set-expanded-pdf-ids!)

                     :else
                     (original-cell table row column style))))))

(defn enhance-columns
  "Adds Asset-specific file and title behavior to `columns`.

  Options:

  | key                     | description
  |-------------------------|-------------
  | `:config`               | View config passed to Asset-specific cell renderers.
  | `:columns`              | Base table columns produced before Asset column enhancement.
  | `:annotation-index`     | PDF annotation lookup data used by title cells.
  | `:set-expanded-pdf-ids!` | State updater for toggling expanded PDF rows."
  [{:keys [config columns annotation-index set-expanded-pdf-ids!]}]
  (let [[before-cols after-cols] (split-with #(not (db-property/logseq-property? (:id %))) columns)
        columns' (concat before-cols [(build-asset-file-column config)] after-cols)]
    (mapv (fn [column]
            (if (= :block/title (:id column))
              (wrap-asset-title-column column annotation-index
                                       set-expanded-pdf-ids!)
              column))
          columns')))
