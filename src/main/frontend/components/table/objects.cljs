(ns frontend.components.table.objects
  "Table views backed by class objects and property-related objects."
  (:require [frontend.components.assets.orphans :as asset-orphans]
            [frontend.components.assets.pdf-annotations :as pdf-annotations]
            [frontend.components.assets.table :as asset-table]
            [frontend.components.filepicker :as filepicker]
            [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.react :as react]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [io.factorhouse.hsx.core :as hsx]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.outliner.property :as outliner-property]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

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

(defn- add-new-class-object!
  [class properties]
  (p/let [block (editor-handler/api-insert-new-block! ""
                                                      {:page (:block/uuid class)
                                                       :properties (merge properties {:block/tags (:db/id class)})
                                                       :edit-block? false})]
    (editor-handler/edit-block! (db/entity [:block/uuid (:block/uuid block)]) 0 {:container-id :unknown-container})
    block))

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
           (p/let [_ (p/all (keep #(asset-orphans/<delete-asset-file! repo %) assets))
                   _ (p/all (map editor-handler/delete-block-aux! assets))]
             (set-data! (remove-asset-ids-from-data (:full-data table) deleted-ids))
             (set-row-selection! {})))))))

(defn- sub-class-objects-data-changes
  [class-ident]
  (let [repo (state/get-current-repo)
        class-id (:db/id (db/entity class-ident))
        *version (hooks/use-memo #(atom 0) [repo class-id])
        query-ref (when (and repo class-id)
                    (react/q repo [:frontend.worker.react/objects class-id]
                             {:query-fn (fn [_] (swap! *version inc))}
                             nil))]
    (db-hooks/use-query query-ref)))

(defn- class-objects-view
  [*ref config class columns view-options]
  [:div {:ref *ref}
   (views/view
    (merge
     view-options
     {:config config
      :view-parent class
      :view-feature-type :class-objects
      :columns columns
      :show-add-property? true
      :show-items-count? true
      :add-property! (fn [e]
                       (state/pub-event! [:editor/new-property {:block class
                                                                :class-schema? true
                                                                :target (.-target e)}]))}))])

(hsx/defc regular-class-objects-inner
  [config class properties]
  (let [*ref (hooks/use-ref nil)
        db-ident (:db/ident class)
        properties' (remove nil? properties)
        columns* (views/build-columns config properties' {:add-tags-column? true
                                                          :class-ident db-ident})
        columns (if (= db-ident :logseq.class/Pdf-annotation)
                  (remove #(contains? #{:logseq.property/ls-type} (:id %)) columns*)
                  columns*)
        add-new-object! (when-not (ldb/private-tags db-ident)
                          (fn [view table {:keys [properties]}]
                            (p/let [block (add-new-class-object! class properties)]
                              (when (:db/id block)
                                (refresh-view-data! class view table [(:db/id block)])
                                (state/sidebar-add-block! (state/get-current-repo) (:db/id block) :block)))))]
    (class-objects-view
     *ref config class columns
     {:add-new-object! add-new-object!})))

(hsx/defc asset-class-objects-inner
  [config class properties]
  (let [*ref (hooks/use-ref nil)
        [expanded-pdf-ids set-expanded-pdf-ids!] (hooks/use-state #{})
        [annotation-index set-annotation-index!] (hooks/use-state nil)
        asset-data-changes-version (sub-class-objects-data-changes :logseq.class/Asset)
        asset-data-changes-version (hooks/use-debounced-value asset-data-changes-version 100)
        pdf-annotation-data-changes-version (sub-class-objects-data-changes :logseq.class/Pdf-annotation)
        pdf-annotation-data-changes-version (hooks/use-debounced-value pdf-annotation-data-changes-version 100)
        table-data-transform (hooks/use-callback
                              (fn [rows]
                                (pdf-annotations/build-pdf-annotation-table-data
                                 rows
                                 (pdf-annotations/augment-pdf-annotation-asset-index annotation-index rows)
                                 expanded-pdf-ids))
                              [annotation-index expanded-pdf-ids])
        row-selection-related-ids-fn (hooks/use-callback
                                      #(pdf-annotations/asset-row-selection-related-ids % annotation-index)
                                      [annotation-index])
        expand-selected-rows-fn (hooks/use-callback
                                 #(pdf-annotations/expand-selected-asset-row-ids %1 %2 %3 annotation-index)
                                 [annotation-index])
        properties' (remove nil? properties)
        columns* (remove #(contains? #{:logseq.property.asset/checksum} (:id %))
                         (views/build-columns config properties' {:add-tags-column? true
                                                                  :class-ident :logseq.class/Asset}))
        columns (asset-table/enhance-columns
                 {:config config
                  :columns columns*
                  :annotation-index annotation-index
                  :set-expanded-pdf-ids! set-expanded-pdf-ids!})
        add-new-object! (fn [view table _opts]
                          (shui/dialog-open!
                           (fn []
                             [:div.flex.flex-col.gap-2
                              [:div.font-medium (t :asset/add-assets)]
                              (filepicker/picker
                               {:on-change (fn [_e files]
                                             (p/let [entities (editor-handler/upload-asset! nil files :markdown editor-handler/*asset-uploading? true)]
                                               (shui/dialog-close!)
                                               (when (seq entities)
                                                 (refresh-view-data! class view table (map :db/id entities)))))})])))]
    (hooks/use-effect!
     (fn []
       (if-let [repo (state/get-current-repo)]
         (let [cancelled? (atom false)]
           (-> (pdf-annotations/<pdf-annotation-asset-index repo)
               (p/then (fn [index]
                         (when-not @cancelled?
                           (set-annotation-index! index))))
               (p/catch (fn [error]
                          (log/error :msg "Failed to load PDF annotation asset index"
                                     :error error)
                          (when-not @cancelled?
                            (set-annotation-index! pdf-annotations/empty-pdf-annotation-asset-index)))))
           (fn [] (reset! cancelled? true)))
         (set-annotation-index! pdf-annotations/empty-pdf-annotation-asset-index)))
     [(state/get-current-repo) asset-data-changes-version pdf-annotation-data-changes-version])

    (if (nil? annotation-index)
      [:div.flex.flex-col.space-2.gap-2.my-2
       (repeat 3 (shui/skeleton {:class "h-6 w-full"}))]
      (class-objects-view
       *ref config class columns
       {:table-data-transform table-data-transform
        :row-selection-related-ids-fn row-selection-related-ids-fn
        :expand-selected-rows-fn expand-selected-rows-fn
        :delete-rows-fn delete-asset-rows!
        :additional-actions [asset-orphans/orphan-assets-action]
        :add-new-object! add-new-object!}))))

(hsx/defc class-objects-inner
  [config class properties]
  (if (= (:db/ident class) :logseq.class/Asset)
    (asset-class-objects-inner config class properties)
    (regular-class-objects-inner config class properties)))

(hsx/defc class-objects
  [class config]
  (when class
    (let [class (db/sub-block (:db/id class))
          config (assoc config :container-id (views/view-container-id config))
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

(hsx/defc property-related-objects-inner
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
(hsx/defc property-related-objects
  [property config]
  (when property
    (let [property' (db/sub-block (:db/id property))
          config (assoc config :container-id (views/view-container-id config))
          ;; Show tags to help differentiate property rows
          properties (if (= (:db/ident property) :block/tags)
                       [property']
                       [property' (db/entity :block/tags)])]
      [:div.ml-1
       (property-related-objects-inner config property' properties)])))
