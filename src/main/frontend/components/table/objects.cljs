(ns frontend.components.table.objects
  "Table views backed by class objects and property-related objects."
  (:require [frontend.components.assets.orphans :as asset-orphans]
            [frontend.components.assets.pdf-annotations :as pdf-annotations]
            [frontend.components.assets.table :as asset-table]
            [frontend.components.filepicker :as filepicker]
            [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.react :as react]
            [frontend.handler.editor :as editor-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.outliner.property :as outliner-property]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

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
  (when-let [repo (state/get-current-repo)]
    (when-let [class-id (:db/id (db/entity class-ident))]
      (let [*version (atom 0)]
        (react/q repo [:frontend.worker.react/objects class-id]
                 {:query-fn (fn [_] (swap! *version inc))}
                 nil)))))

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
        columns* (views/build-columns config properties' {:add-tags-column? true
                                                          :class-ident db-ident})
        columns (cond
                  (= db-ident :logseq.class/Pdf-annotation)
                  (remove #(contains? #{:logseq.property/ls-type} (:id %)) columns*)
                  (= db-ident :logseq.class/Asset)
                  (remove #(contains? #{:logseq.property.asset/checksum} (:id %)) columns*)
                  :else
                  columns*)
        columns (if asset?
                  (asset-table/enhance-columns {:config config
                                                :columns columns
                                                :header-cp views/header-cp
                                                :annotation-index annotation-index
                                                :expanded-pdf-ids expanded-pdf-ids
                                                :set-expanded-pdf-ids! set-expanded-pdf-ids!})
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
           (set-annotation-index! pdf-annotations/empty-pdf-annotation-asset-index))
         (set-annotation-index! pdf-annotations/empty-pdf-annotation-asset-index)))
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
                    :additional-actions (when asset? [asset-orphans/orphan-assets-action])
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
