(ns frontend.components.objects
  "Provides table views for class objects and property related objects"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.components.filepicker :as filepicker]
            [frontend.components.views :as views]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.react :as react]
            [frontend.fs :as fs]
            [frontend.handler.editor :as editor-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.common.path :as path]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.frontend.asset :as db-asset]
            [logseq.db.frontend.property :as db-property]
            [logseq.outliner.property :as outliner-property]
            [logseq.shui.hooks :as hooks]
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

(defn- build-asset-file-column
  [config]
  {:id :file
   :name (t :file/label)
   :type :string
   :header views/header-cp
   :cell (fn [_table row _column]
           (when-let [asset-cp (state/get-component :block/asset-cp)]
             [:div.block-content.overflow-hidden
              {:style {:max-height 30}}
              (asset-cp (assoc config :disable-resize? true) row)]))
   :disable-hide? true})

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
        ;; Properties can be nil for published private graphs
        properties' (remove nil? properties)
        columns* (views/build-columns config properties' {:add-tags-column? true})
        columns (cond
                  (= (:db/ident class) :logseq.class/Pdf-annotation)
                  (remove #(contains? #{:logseq.property/ls-type} (:id %)) columns*)
                  (= (:db/ident class) :logseq.class/Asset)
                  (remove #(contains? #{:logseq.property.asset/checksum} (:id %)) columns*)
                  :else
                  columns*)
        db-ident (:db/ident class)
        asset? (= db-ident :logseq.class/Asset)
        columns (if asset?
                  ;; Insert in front of tag's properties
                  (let [[before-cols after-cols] (split-with #(not (db-property/logseq-property? (:id %))) columns)]
                    (concat before-cols [(build-asset-file-column config)] after-cols))
                  columns)
        add-new-object! (when (or asset? (not (ldb/private-tags (:db/ident class))))
                          (fn [view table {:keys [properties]}]
                            (if (= :logseq.class/Asset (:db/ident class))
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

    [:div {:ref *ref}
     (views/view {:config config
                  :view-parent class
                  :view-feature-type :class-objects
                  :columns columns
                  :delete-rows-fn (when asset? delete-asset-rows!)
                  :additional-actions (when asset? [orphan-assets-action])
                  :add-new-object! add-new-object!
                  :show-add-property? true
                  :show-items-count? true
                  :add-property! (fn [e]
                                   (state/pub-event! [:editor/new-property {:block class
                                                                            :class-schema? true
                                                                            :target (.-target e)}]))})]))

(rum/defcs class-objects < rum/reactive db-mixins/query mixins/container-id
  [state class config]
  (when class
    (let [class (db/sub-block (:db/id class))
          config (assoc config :container-id (:container-id state))
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
