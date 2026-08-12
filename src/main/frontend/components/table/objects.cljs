(ns frontend.components.table.objects
  "Table views backed by class objects and property-related objects."
  (:require [frontend.components.assets.orphans :as asset-orphans]
            [frontend.components.assets.pdf-annotations :as pdf-annotations]
            [frontend.components.assets.table :as asset-table]
            [frontend.components.filepicker :as filepicker]
            [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.db.async :as db-async]
            [frontend.db.hooks :as db-hooks]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [io.factorhouse.hsx.core :as hsx]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn- add-new-class-object!
  [class properties]
  (p/let [block (editor-handler/api-insert-new-block! ""
                                                      {:page (:block/uuid class)
                                                       :properties (merge properties {:block/tags (:db/id class)})
                                                       :edit-block? false})]
    (editor-handler/edit-block! block 0 {:container-id :unknown-container})
    block))

(defn- delete-asset-rows!
  [table selected-rows]
  (let [repo (state/get-current-repo)
        {:keys [set-row-selection!]} (:data-fns table)]
    (-> (shui/dialog-confirm!
         [:div.text-sm.opacity-80
          (t :asset.delete/confirm-message)]
         {:title (t :asset.delete/confirm-title)
          :outside-cancel? true
          :cancel-label (t :ui/cancel)
          :ok-label (t :ui/confirm)})
        (p/then
         (fn []
           (p/let [assets (db-async/<get-blocks repo selected-rows {:children? false})
                   assets (remove nil? assets)
                   _ (p/all (keep #(asset-orphans/<delete-asset-file! repo %) assets))
                   _ (p/all (map editor-handler/delete-block-aux! assets))]
             (set-row-selection! {})))))))

(defn- class-objects-view
  [*ref config class columns view-options]
  [:div {:ref *ref}
   (views/view
    (merge
     view-options
     {:config config
      :view-parent-uuid (:block/uuid class)
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
        config' (assoc config :view-parent class)
        properties' (remove nil? properties)
        columns* (views/build-columns config' properties' {:add-tags-column? true
                                                           :add-page-column? true
                                                           :class-ident db-ident})
        columns (if (= db-ident :logseq.class/Pdf-annotation)
                  (remove #(contains? #{:logseq.property/ls-type} (:id %)) columns*)
                  columns*)
        add-new-object! (when-not (ldb/private-tags db-ident)
                          (fn [_view _table {:keys [properties]}]
                            (p/let [block (add-new-class-object! class properties)]
                              (when (:db/id block)
                                (state/sidebar-add-block! (state/get-current-repo) (:db/id block) :block)))))]
    (class-objects-view
     *ref config' class columns
     {:add-new-object! add-new-object!})))

(hsx/defc asset-class-objects-inner
  [config class properties]
  (let [*ref (hooks/use-ref nil)
        config' (assoc config :view-parent class)
        [expanded-pdf-ids set-expanded-pdf-ids!] (hooks/use-state #{})
        [annotation-index set-annotation-index!] (hooks/use-state nil)
        annotation-index-revision (db-hooks/use-resource [:pdf-annotation-asset-index-revision])
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
                         (views/build-columns config' properties' {:add-tags-column? true
                                                                   :add-page-column? true
                                                                   :class-ident :logseq.class/Asset}))
        columns (asset-table/enhance-columns
                 {:config config'
                  :columns columns*
                  :annotation-index annotation-index
                  :set-expanded-pdf-ids! set-expanded-pdf-ids!})
        add-new-object! (fn [_view _table _opts]
                          (shui/dialog-open!
                           (fn []
                             [:div.flex.flex-col.gap-2
                              [:div.font-medium (t :asset/add-assets)]
                              (filepicker/picker
                               {:on-change (fn [_e files]
                                             (p/let [_ (editor-handler/upload-asset! nil files :markdown editor-handler/*asset-uploading? true)]
                                               (shui/dialog-close!)))})])))]
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
     [(state/get-current-repo) annotation-index-revision])

    (if (nil? annotation-index)
      [:div.flex.flex-col.space-2.gap-2.my-2
       (repeat 3 (shui/skeleton {:class "h-6 w-full"}))]
      (class-objects-view
       *ref config' class columns
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
    (let [config (assoc config :container-id (views/view-container-id config))
          [properties set-properties!] (hooks/use-state [])
          _ (hooks/use-effect!
             (fn []
               (p/let [result (db-async/<get-class-properties
                                (state/get-current-repo)
                                (:db/id class))]
                 (set-properties! (or result [])))
               nil)
             [(:db/id class)])]
      [:div.ml-1
       (class-objects-inner config class properties)])))

(defn- <property-object-default-value
  [property]
  (if (= :checkbox (:logseq.property/type property))
    (p/resolved false)
    (p/let [placeholder (state/<invoke-db-worker :thread-api/pull
                                                 (state/get-current-repo)
                                                 [:db/id]
                                                 :logseq.property/empty-placeholder)]
      (:db/id placeholder))))

(defn- add-new-property-object!
  [property properties]
  (p/let [default-value (<property-object-default-value property)
          block (editor-handler/api-insert-new-block! ""
                                                      {:page (:block/uuid property)
                                                       :properties (merge
                                                                    {(:db/ident property) default-value}
                                                                    properties)
                                                       :edit-block? false})]
    (editor-handler/edit-block! block 0 {:container-id :unknown-container})
    block))

(hsx/defc property-related-objects-inner
  [config property properties]
  (let [tags? (= :block/tags (:db/ident property))
        columns (views/build-columns config properties
                                     (cond-> {:add-page-column? true}
                                       tags? (assoc :add-tags-column? false)))]
    (views/view {:config config
                 :view-parent-uuid (:block/uuid property)
                 :view-feature-type :property-objects
                 :columns columns
                 :add-new-object! (fn [_view _table {:keys [properties]}]
                                    (p/let [block (add-new-property-object! property properties)]
                                      (when (:db/id block)
                                        (state/sidebar-add-block! (state/get-current-repo) (:db/id block) :block))))
                 ;; TODO: Add support for adding column
                 :show-add-property? false})))

;; Show all nodes containing the given property
(hsx/defc property-related-objects
  [property config]
  (when property
    (let [config (assoc config :container-id (views/view-container-id config))
          properties [property]]
      [:div.ml-1
       (property-related-objects-inner config property properties)])))
