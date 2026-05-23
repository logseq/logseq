(ns frontend.components.objects
  "Provides table views for class objects and property related objects"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.components.filepicker :as filepicker]
            [frontend.components.property.value :as pv]
            [frontend.components.views :as views]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.react :as react]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.fs :as fs]
            [frontend.handler.editor :as editor-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.common.path :as path]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.frontend.asset :as db-asset]
            [logseq.db.frontend.property :as db-property]
            [logseq.outliner.property :as outliner-property]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.table.core :as shui-table]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- add-new-class-object!
  [class properties]
  (p/let [block (editor-handler/api-insert-new-block! ""
                                                      {:page (:block/uuid class)
                                                       :properties (merge properties {:block/tags (:db/id class)})
                                                       :edit-block? false})]
    (editor-handler/edit-block! (db/entity [:block/uuid (:block/uuid block)]) 0 {:container-id :unknown-container})
    block))

(defn- annotation-position-value
  [annotation k]
  (or (get-in annotation [:logseq.property.pdf/hl-value :position :bounding k])
      js/Number.MAX_SAFE_INTEGER))

(defn- annotation-sort-key
  [annotation]
  [(or (:logseq.property.pdf/hl-page annotation) js/Number.MAX_SAFE_INTEGER)
   (annotation-position-value annotation :y1)
   (annotation-position-value annotation :x1)
   (or (:block/order annotation) js/Number.MAX_SAFE_INTEGER)
   (:db/id annotation)])

(defn- entity-id
  [x]
  (or (:db/id x)
      (when (number? x) x)))

(def ^:private empty-pdf-annotation-asset-index
  {:image-id->annotation {}
   :pdf-id->annotations {}})

(defn- build-pdf-annotation-asset-index
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

(defn- <pdf-annotation-asset-index
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

(defn- pdf-asset?
  [row]
  (= "pdf" (some-> (:logseq.property.asset/type row) name)))

(defn- pending-pdf-area-image-asset?
  [row]
  (when-let [id (shui-table/table-row-id row)]
    (pdf-assets/pending-area-image-asset? (state/get-current-repo) id)))

(defn- annotation-image-id
  [annotation]
  (entity-id (:logseq.property.pdf/hl-image annotation)))

(defn- normalize-pdf-annotation
  [annotation image-id]
  (cond-> annotation
    (number? (:logseq.property/asset annotation))
    (update :logseq.property/asset #(hash-map :db/id %))

    (number? (:logseq.property.pdf/hl-image annotation))
    (update :logseq.property.pdf/hl-image #(hash-map :db/id %))

    (nil? (:logseq.property.pdf/hl-image annotation))
    (assoc :logseq.property.pdf/hl-image {:db/id image-id})))

(defn- pdf-annotation-block?
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
  [row]
  (when-let [id (shui-table/table-row-id row)]
    (let [asset (or (db/entity id)
                    (when (map? row) row))
          annotation (:block/parent asset)]
      (when (pdf-annotation-block? annotation id)
        (normalize-pdf-annotation annotation id)))))

(defn- augment-pdf-annotation-asset-index
  [annotation-index rows]
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
      annotation-index)))

(defn- pdf-annotation-image-ids
  [annotation-index pdf-id]
  (keep annotation-image-id (get-in annotation-index [:pdf-id->annotations pdf-id])))

(defn- asset-row-selection-related-ids
  [row annotation-index]
  (when (pdf-asset? row)
    (pdf-annotation-image-ids annotation-index (:db/id row))))

(defn- expand-selected-asset-row-ids
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

(defn- build-pdf-annotation-table-data
  [rows annotation-index expanded-pdf-ids]
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

              (pending-pdf-area-image-asset? row)
              result

              (contains? expanded-pdf-ids id)
              (into (conj result row)
                    (child-rows (get pdf-id->annotations id)))

              :else
              (conj result row))))
        []
        rows)))
    rows))

(defn- build-asset-file-column
  [config]
  {:id :file
   :name (t :file/label)
   :type :string
   :header views/header-cp
   :cell (fn [_table row _column]
           (when-let [asset-cp (state/get-component :block/asset-cp)]
             [:div.block-content.overflow-hidden.flex.items-center
              {:class pv/asset-thumb-fit-class
               :style {:width "100%"
                       :height 30
                       :max-height 30}}
              (asset-cp (assoc config :disable-resize? true) row)]))
   :disable-hide? true})

(defn- pdf-annotation-title
  [annotation]
  (let [title (:block/title annotation)
        title (if (and (not (string/blank? title))
                       (not= "pdf area highlight" title))
                title
                (t :asset/pdf-area-highlight-title))]
    (str "P" (or (:logseq.property.pdf/hl-page annotation) "?")
         " · "
         title)))

(rum/defc asset-pdf-title-cell
  [original-cell table row column style annotation-index expanded-pdf-ids set-expanded-pdf-ids!]
  (let [pdf-id (:db/id row)
        annotations (get-in annotation-index [:pdf-id->annotations pdf-id])
        expanded? (contains? expanded-pdf-ids pdf-id)]
    (if (seq annotations)
      [:div.flex.w-full.min-w-0.items-center.gap-1
       (shui/button
        {:variant "ghost"
         :size :sm
         :class "!h-6 !w-5 shrink-0 !px-0 text-muted-foreground"
         :title (t (if expanded?
                     :asset/collapse-pdf-annotations
                     :asset/expand-pdf-annotations))
         :aria-label (t (if expanded?
                          :asset/collapse-pdf-annotations
                          :asset/expand-pdf-annotations))
         :on-click (fn [e]
                     (util/stop e)
                     (set-expanded-pdf-ids!
                      (if expanded?
                        (disj expanded-pdf-ids pdf-id)
                        (conj expanded-pdf-ids pdf-id))))}
        (ui/icon (if expanded? "chevron-down" "chevron-right") {:size 14}))
       [:div.min-w-0.flex-1
        (original-cell table row column style)]]
      (original-cell table row column style))))

(rum/defc asset-annotation-title-cell
  [row annotation-index]
  (let [annotation (or (some-> row :asset-table/annotation-id db/entity)
                       (get-in annotation-index [:image-id->annotation (:db/id row)]))]
    [:div.flex.h-full.w-full.min-w-0.items-center.gap-1.pl-8
     (if annotation
       (shui/button
        {:variant "ghost"
         :size :sm
         :class "min-w-0 justify-start !px-1 text-left font-normal"
         :title (t :asset/open-pdf-annotation)
         :aria-label (t :asset/open-pdf-annotation)
         :on-click (fn [e]
                     (util/stop e)
                     (pdf-assets/open-block-ref! annotation))}
        [:span.truncate (pdf-annotation-title annotation)])
       [:span.truncate.text-muted-foreground (:block/title row)])]))

(defn- wrap-asset-title-column
  [column annotation-index expanded-pdf-ids set-expanded-pdf-ids!]
  (let [original-cell (:cell column)]
    (assoc column
           :cell (fn [table row column style]
                   (cond
                     (:asset-table/nested? row)
                     (asset-annotation-title-cell row annotation-index)

                     (and (pdf-asset? row)
                          (seq (get-in annotation-index [:pdf-id->annotations (:db/id row)])))
                     (asset-pdf-title-cell original-cell table row column style annotation-index
                                           expanded-pdf-ids set-expanded-pdf-ids!)

                     :else
                     (original-cell table row column style))))))

(defn- local-asset-file-name
  [asset]
  (when (and (string/blank? (:logseq.property.asset/external-url asset))
             (:block/uuid asset)
             (:logseq.property.asset/type asset))
    (str (:block/uuid asset) "." (name (:logseq.property.asset/type asset)))))

(defn- local-asset-file-path
  [asset]
  (or (:logseq.asset/file-path asset)
      (when-let [file-name (local-asset-file-name asset)]
        (some-> (config/get-current-repo-assets-root)
                (path/path-join file-name)))))

(defn- parse-file-stem-uuid
  [file-name]
  (let [stem (path/file-stem file-name)]
    (try
      (uuid stem)
      (catch :default _
        (common-uuid/gen-uuid :view-block-uuid file-name)))))

(defn- asset-tagged-file-names
  []
  (let [db (db/get-db)]
    (if-let [asset-class-id (:db/id (d/entity db :logseq.class/Asset))]
      (->> (d/datoms db :avet :block/tags asset-class-id)
           (keep (fn [{:keys [e]}]
                   (let [asset (d/entity db e)]
                     (when-not (ldb/recycled? asset)
                       (local-asset-file-name asset)))))
           set)
      #{})))

(defn- asset-file->orphan
  [file-path stat]
  (when-let [file-name (path/filename file-path)]
    (let [asset-type (db-asset/asset-path->type file-name)]
      (when-not (string/blank? asset-type)
        {:logseq.asset/file-path file-path
         :block/uuid (parse-file-stem-uuid file-name)
         :logseq.property.asset/type asset-type
         :logseq.asset/created-at (:ctime stat)}))))

(defn- <orphan-assets
  []
  (if-let [assets-root (config/get-current-repo-assets-root)]
    (-> (p/let [existing (asset-tagged-file-names)
                file-paths (fs/readdir assets-root {:path-only? true})
                missing-file-paths (remove #(contains? existing (path/filename %)) file-paths)]
          (p/all (keep (fn [file-path]
                         (p/let [stat (fs/stat file-path)]
                           (asset-file->orphan file-path stat)))
                       missing-file-paths)))
        (p/then #(vec (remove nil? %)))
        (p/catch (fn [_error] [])))
    (p/resolved [])))

(defn- <delete-asset-file!
  [repo asset]
  (when-let [file-path (local-asset-file-path asset)]
    (fs/unlink! repo file-path nil)))

(defn- remove-asset-ids-from-data
  [data deleted-ids]
  (if (every? number? data)
    (vec (remove deleted-ids data))
    (->> data
         (keep (fn [[value rows]]
                 (let [rows' (vec (remove deleted-ids rows))]
                   (when (seq rows')
                     [value rows']))))
         vec)))

(defn- delete-asset-rows!
  [table selected-rows]
  (let [repo (state/get-current-repo)
        assets (->> selected-rows
                    (map db/entity)
                    (remove nil?))
        deleted-ids (set selected-rows)
        {:keys [set-data! set-row-selection!]} (:data-fns table)]
    (-> (shui/dialog-confirm!
         [:div.text-sm.opacity-80
          (t :asset.delete/confirm-message)]
         {:title (t :asset.delete/confirm-title)
          :outside-cancel? true
          :cancel-label (t :ui/cancel)
          :ok-label (t :ui/confirm)})
        (p/then
         (fn []
           (p/let [_ (p/all (keep #(<delete-asset-file! repo %) assets))
                   _ (p/all (map editor-handler/delete-block-aux! assets))]
             (set-data! (remove-asset-ids-from-data (:full-data table) deleted-ids))
             (set-row-selection! {})))))))

(defn- sub-class-objects-data-changes
  [class-ident]
  (when-let [repo (state/get-current-repo)]
    (when-let [class-id (:db/id (db/entity class-ident))]
      (let [*version (atom 0)]
        (react/q repo [:frontend.worker.react/objects class-id]
                 {:query-fn (fn [_] (swap! *version inc))}
                 nil)))))

(defn- format-asset-time
  [timestamp]
  (cond
    (number? timestamp)
    (.toLocaleString (js/Date. timestamp))

    (instance? js/Date timestamp)
    (.toLocaleString timestamp)

    (string? timestamp)
    (let [date (js/Date. timestamp)]
      (if (js/isNaN (.getTime date))
        timestamp
        (.toLocaleString date)))

    :else
    ""))

(defn- asset-time-ms
  [timestamp]
  (cond
    (number? timestamp)
    timestamp

    (instance? js/Date timestamp)
    (.getTime timestamp)

    (string? timestamp)
    (let [time (.getTime (js/Date. timestamp))]
      (when-not (js/isNaN time)
        time))))

(defn- orphan-asset-sort-value
  [asset column]
  (case column
    :uuid (str (:block/uuid asset))
    :type (str (:logseq.property.asset/type asset))
    :time (asset-time-ms (:logseq.asset/created-at asset))
    (str (:block/uuid asset))))

(defn- compare-orphan-asset-values
  [a b]
  (cond
    (= a b) 0
    (nil? a) 1
    (nil? b) -1
    :else (compare a b)))

(defn- sort-orphan-assets
  [assets {:keys [column asc?]}]
  (sort
   (fn [a b]
     (let [result (compare-orphan-asset-values
                   (orphan-asset-sort-value a column)
                   (orphan-asset-sort-value b column))]
       (if asc? result (- result))))
   assets))

(rum/defc orphan-assets-sort-header
  [label column sort-state set-sort-state!]
  (let [active? (= column (:column sort-state))
        asc? (:asc? sort-state)]
    [:button.flex.h-10.w-full.items-center.gap-1.text-left.font-medium.hover:text-foreground
     {:type "button"
      :on-click #(set-sort-state! (if active?
                                    (update sort-state :asc? not)
                                    {:column column :asc? true}))}
     [:span label]
     (when active?
       (ui/icon (if asc? "arrow-up" "arrow-down") {:size 14}))]))

(rum/defc orphan-assets-dialog-content
  [assets all-file-paths *selected-file-paths]
  (let [[selected-file-paths set-selected-file-paths!] (rum/use-state @*selected-file-paths)
        [sort-state set-sort-state!] (rum/use-state {:column :time :asc? false})
        assets (sort-orphan-assets assets sort-state)
        set-selection! (fn [selection]
                         (reset! *selected-file-paths selection)
                         (set-selected-file-paths! selection))
        all-selected? (and (seq all-file-paths)
                           (= all-file-paths selected-file-paths))]
    [:div.flex.min-h-0.flex-col.gap-3.text-sm
     {:style {:width "100%"
              :max-width "100%"
              :min-width 0}}
     [:div.opacity-80 (t :asset.orphan/confirm-message)]
     (if (seq assets)
       [:<>
        [:div.flex.items-center.gap-2
         (ui/tooltip
          (shui/button
           {:variant "ghost"
            :size :sm
            :class "text-muted-foreground !px-1"
            :aria-label (t :asset.orphan/invert-selection)
            :on-click #(set-selection! (set/difference all-file-paths selected-file-paths))}
           (ui/icon "arrows-shuffle" {:size 15}))
          (t :asset.orphan/invert-selection)
          {:trigger-props {:as-child true}})
         [:span.text-muted-foreground
          (t :view.table/selected-count (count selected-file-paths))]]
        [:div.min-h-0.overflow-auto.border.rounded
         {:style {:max-width "100%"
                  :min-width 0
                  :max-height "min(24rem, calc(100vh - 320px))"}}
         [:table.table-fixed.text-left
          {:style {:width 640
                   :min-width 640}}
          [:colgroup
           [:col {:style {:width 48}}]
           [:col {:style {:width 350}}]
           [:col {:style {:width 64}}]
           [:col {:style {:width 178}}]]
          [:thead.sticky.top-0.z-10.bg-background
           [:tr.h-10.border-b
            [:th.w-10.px-2.py-0.text-center.align-middle
             [:div.flex.h-8.w-8.items-center.justify-center
              (shui/checkbox
               {:checked (or all-selected? (and (seq selected-file-paths) "indeterminate"))
                :on-checked-change (fn [checked?]
                                     (set-selection! (if checked? all-file-paths #{})))
                :aria-label (t :view.table/select-all)})]]
            [:th.h-10.px-2.py-0.align-middle.whitespace-nowrap
             (orphan-assets-sort-header "UUID" :uuid sort-state set-sort-state!)]
            [:th.h-10.px-2.py-0.align-middle.whitespace-nowrap
             (orphan-assets-sort-header (t :asset.orphan/type) :type sort-state set-sort-state!)]
            [:th.h-10.px-2.py-0.align-middle.whitespace-nowrap
             (orphan-assets-sort-header (t :asset.orphan/time) :time sort-state set-sort-state!)]]]
          [:tbody
           (for [{:keys [block/uuid logseq.property.asset/type logseq.asset/created-at logseq.asset/file-path]} assets]
             [:tr.h-10.border-b.last:border-b-0 {:key (str uuid)}
              [:td.h-10.w-10.px-2.py-0.text-center.align-middle
               [:div.flex.h-8.w-8.items-center.justify-center
                (shui/checkbox
                 {:checked (contains? selected-file-paths file-path)
                  :on-checked-change (fn [checked?]
                                       (set-selection!
                                        ((if checked? conj disj) selected-file-paths file-path)))
                  :aria-label (str uuid)})]]
              [:td.h-10.px-2.py-0.align-middle.whitespace-nowrap.font-mono
               [:a.text-foreground.hover:underline
                {:on-click (fn [e]
                             (util/stop e)
                             (when (and file-path js/window.apis)
                               (js/window.apis.openPath file-path)))}
                (str uuid)]]
              [:td.h-10.px-2.py-0.align-middle.whitespace-nowrap.font-mono type]
              [:td.h-10.px-2.py-0.align-middle.whitespace-nowrap.font-mono (format-asset-time created-at)]])]]]]
       [:div.opacity-70 (t :asset.orphan/no-assets)])]))

(defn- delete-orphan-assets!
  [assets]
  (p/let [_ (p/all (keep #(<delete-asset-file! (state/get-current-repo) %) assets))]
    nil))

(defn- orphan-assets-action
  [_option]
  (ui/tooltip
   (shui/button
    {:variant "ghost"
     :size :sm
     :class "text-muted-foreground !px-1"
     :aria-label (t :asset.orphan/delete)
     :on-click (fn []
                 (p/let [assets (<orphan-assets)]
                   (let [all-file-paths (set (keep :logseq.asset/file-path assets))
                         *selected-file-paths (atom all-file-paths)]
                     (-> (shui/dialog-confirm!
                          (orphan-assets-dialog-content assets all-file-paths *selected-file-paths)
                          {:title (t :asset.orphan/delete)
                           :class "!flex max-h-[calc(100vh-48px)] flex-col overflow-hidden"
                           :style {:width "min(720px, calc(100vw - 48px))"
                                   :max-width "calc(100vw - 48px)"}
                           :outside-cancel? true
                           :cancel-label (t :ui/cancel)
                           :ok-label (t :ui/delete)})
                         (p/then (fn []
                                   (let [selected-file-paths @*selected-file-paths
                                         selected-assets (filter #(contains? selected-file-paths (:logseq.asset/file-path %)) assets)]
                                     (when (seq selected-assets)
                                       (delete-orphan-assets! selected-assets)))))))))}
    (ui/icon "trash-x" {:size 15}))
   (t :asset.orphan/delete)
   {:trigger-props {:as-child true}}))

(comment
  (defn- edit-new-object
    [ref id]
    (js/setTimeout
     (fn []
       (when-let [title-node (d/sel1 ref (util/format ".ls-table-row[data-id='%d'] .table-block-title" id))]
         (.click title-node)))
     100)))

(defn- refresh-view-data!
  [view-parent view table ids]
  (let [list-view? (= :logseq.property.view/type.list (:db/ident (:logseq.property.view/type view)))]
    (when-let [repo (state/get-current-repo)]
      (if list-view?
        (when-let [result (:result (get @react/*query-state [repo :frontend.worker.react/objects (:db/id view-parent)]))]
          (swap! result inc))
        (let [set-data! (get-in table [:data-fns :set-data!])
              full-data (:full-data table)]
          (set-data! (vec (concat full-data ids))))))))

(rum/defc class-objects-inner < rum/static
  [config class properties]
  (let [*ref (hooks/use-ref nil)
        [expanded-pdf-ids set-expanded-pdf-ids!] (hooks/use-state #{})
        db-ident (:db/ident class)
        asset? (= db-ident :logseq.class/Asset)
        [annotation-index set-annotation-index!] (hooks/use-state nil)
        pdf-annotation-changes-version (:pdf-annotation-changes-version config)
        pdf-annotation-changes-version (hooks/use-debounced-value pdf-annotation-changes-version 100)
        table-data-transform (hooks/use-callback
                              (fn [rows]
                                (build-pdf-annotation-table-data
                                 rows
                                 (augment-pdf-annotation-asset-index annotation-index rows)
                                 expanded-pdf-ids))
                              [annotation-index expanded-pdf-ids])
        row-selection-related-ids-fn (hooks/use-callback
                                      #(asset-row-selection-related-ids % annotation-index)
                                      [annotation-index])
        expand-selected-rows-fn (hooks/use-callback
                                 #(expand-selected-asset-row-ids %1 %2 %3 annotation-index)
                                 [annotation-index])
        ;; Properties can be nil for published private graphs
        properties' (remove nil? properties)
        columns* (views/build-columns config properties' {:add-tags-column? true})
        columns (cond
                  (= db-ident :logseq.class/Pdf-annotation)
                  (remove #(contains? #{:logseq.property/ls-type} (:id %)) columns*)
                  (= db-ident :logseq.class/Asset)
                  (remove #(contains? #{:logseq.property.asset/checksum} (:id %)) columns*)
                  :else
                  columns*)
        columns (if asset?
                  (let [[before-cols after-cols] (split-with #(not (db-property/logseq-property? (:id %))) columns)
                        columns' (concat before-cols [(build-asset-file-column config)] after-cols)]
                    (map (fn [column]
                           (if (= :block/title (:id column))
                             (wrap-asset-title-column column annotation-index
                                                      expanded-pdf-ids set-expanded-pdf-ids!)
                             column))
                         columns'))
                  columns)
        add-new-object! (when (or asset? (not (ldb/private-tags db-ident)))
                          (fn [view table {:keys [properties]}]
                            (if asset?
                              (shui/dialog-open!
                               (fn []
                                 [:div.flex.flex-col.gap-2
                                  [:div.font-medium (t :asset/add-assets)]
                                  (filepicker/picker
                                   {:on-change (fn [_e files]
                                                 (p/let [entities (editor-handler/upload-asset! nil files :markdown editor-handler/*asset-uploading? true)]
                                                   (shui/dialog-close!)
                                                   (when (seq entities)
                                                     (refresh-view-data! class view table (map :db/id entities)))))})]))
                              (p/let [block (add-new-class-object! class properties)]
                                (when (:db/id block)
                                  (refresh-view-data! class view table [(:db/id block)])
                                  (state/sidebar-add-block! (state/get-current-repo) (:db/id block) :block))))))]

    (hooks/use-effect!
     (fn []
       (if asset?
         (if-let [repo (state/get-current-repo)]
           (let [cancelled? (atom false)]
             (-> (<pdf-annotation-asset-index repo)
                 (p/then (fn [index]
                           (when-not @cancelled?
                             (set-annotation-index! index))))
                 (p/catch (fn [error]
                            (log/error :msg "Failed to load PDF annotation asset index"
                                       :error error)
                            (when-not @cancelled?
                              (set-annotation-index! empty-pdf-annotation-asset-index)))))
             (fn [] (reset! cancelled? true)))
           (set-annotation-index! empty-pdf-annotation-asset-index))
         (set-annotation-index! empty-pdf-annotation-asset-index)))
     [asset? (state/get-current-repo) pdf-annotation-changes-version])

    (if (and asset? (nil? annotation-index))
      [:div.flex.flex-col.space-2.gap-2.my-2
       (repeat 3 (shui/skeleton {:class "h-6 w-full"}))]
      [:div {:ref *ref}
       (views/view {:config config
                    :view-parent class
                    :view-feature-type :class-objects
                    :columns columns
                    :table-data-transform (when asset? table-data-transform)
                    :row-selection-related-ids-fn (when asset? row-selection-related-ids-fn)
                    :expand-selected-rows-fn (when asset? expand-selected-rows-fn)
                    :delete-rows-fn (when asset? delete-asset-rows!)
                    :additional-actions (when asset? [orphan-assets-action])
                    :add-new-object! add-new-object!
                    :show-add-property? true
                    :show-items-count? true
                    :add-property! (fn [e]
                                     (state/pub-event! [:editor/new-property {:block class
                                                                              :class-schema? true
                                                                              :target (.-target e)}]))})])))

(rum/defcs class-objects < rum/reactive db-mixins/query mixins/container-id
  [state class config]
  (when class
    (let [class (db/sub-block (:db/id class))
          asset? (= (:db/ident class) :logseq.class/Asset)
          pdf-annotation-changes-version (when asset?
                                           (some-> (sub-class-objects-data-changes :logseq.class/Pdf-annotation)
                                                   rum/react))
          config (cond-> (assoc config :container-id (:container-id state))
                   asset?
                   (assoc :pdf-annotation-changes-version pdf-annotation-changes-version))
          properties (outliner-property/get-class-properties class)]
      [:div.ml-1
       (class-objects-inner config class properties)])))

(defn- add-new-property-object!
  [property properties]
  (p/let [default-value (if (= :checkbox (:logseq.property/type property))
                          false
                          (:db/id (db/entity :logseq.property/empty-placeholder)))
          block (editor-handler/api-insert-new-block! ""
                                                      {:page (:block/uuid property)
                                                       :properties (merge
                                                                    {(:db/ident property) default-value}
                                                                    properties)
                                                       :edit-block? false})]
    (editor-handler/edit-block! (db/entity [:block/uuid (:block/uuid block)]) 0 {:container-id :unknown-container})
    block))

(rum/defc property-related-objects-inner < rum/static
  [config property properties]
  (let [tags? (= :block/tags (:db/ident property))
        columns (views/build-columns config properties
                                     (when tags? {:add-tags-column? false}))]
    (views/view {:config config
                 :view-parent property
                 :view-feature-type :property-objects
                 :columns columns
                 :add-new-object! (fn [view table {:keys [properties]}]
                                    (p/let [block (add-new-property-object! property properties)]
                                      (when (:db/id block)
                                        (state/sidebar-add-block! (state/get-current-repo) (:db/id block) :block)
                                        (refresh-view-data! property view table [(:db/id block)]))))
                 ;; TODO: Add support for adding column
                 :show-add-property? false})))

;; Show all nodes containing the given property
(rum/defcs property-related-objects < rum/reactive db-mixins/query mixins/container-id
  [state property config]
  (when property
    (let [property' (db/sub-block (:db/id property))
          config (assoc config :container-id (:container-id state))
          ;; Show tags to help differentiate property rows
          properties (if (= (:db/ident property) :block/tags)
                       [property']
                       [property' (db/entity :block/tags)])]
      [:div.ml-1
       (property-related-objects-inner config property' properties)])))
