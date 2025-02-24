(ns frontend.components.objects
  "Provides table views for class objects and property related objects"
  (:require [frontend.components.filepicker :as filepicker]
            [frontend.components.views :as views]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.db.react :as react]
            [frontend.handler.editor :as editor-handler]
            [frontend.hooks :as hooks]
            [frontend.mixins :as mixins]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.outliner.property :as outliner-property]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- get-class-objects
  [class]
  (->> (db-model/get-class-objects (state/get-current-repo) (:db/id class))
       (map (fn [row] (assoc row :id (:db/id row))))))

(defn- add-new-class-object!
  [class set-data! properties]
  (p/let [block (editor-handler/api-insert-new-block! ""
                                                      {:page (:block/uuid class)
                                                       :properties (merge properties {:block/tags (:db/id class)})
                                                       :edit-block? false})
          _ (set-data! (get-class-objects class))]
    (editor-handler/edit-block! (db/entity [:block/uuid (:block/uuid block)]) 0 {:container-id :unknown-container})
    block))

(defn- build-asset-file-column
  [config]
  {:id :file
   :name "File"
   :type :string
   :header views/header-cp
   :cell (fn [_table row _column]
           (when-let [asset-cp (state/get-component :block/asset-cp)]
             [:div.block-content (asset-cp (assoc config :disable-resize? true) row)]))
   :disable-hide? true})

(rum/defc class-objects-inner < rum/static
  [config class objects properties]
  (let [[loading? set-loading?] (rum/use-state nil)
        [data set-data!] (rum/use-state objects)
        ;; Properties can be nil for published private graphs
        properties' (remove nil? properties)
        columns* (views/build-columns config properties' {:add-tags-column? (or (= (:db/ident class) :logseq.class/Root)
                                                                                (> (count (distinct (mapcat :block/tags objects))) 1))})
        columns (cond
                  (= (:db/ident class) :logseq.class/Pdf-annotation)
                  (remove #(contains? #{:logseq.property/ls-type} (:id %)) columns*)
                  (= (:db/ident class) :logseq.class/Asset)
                  (remove #(contains? #{:logseq.property.asset/checksum} (:id %)) columns*)
                  :else
                  columns*)
        columns (if (= (:db/ident class) :logseq.class/Asset)
                  ;; Insert in front of tag's properties
                  (let [[before-cols after-cols] (split-with #(not (db-property/logseq-property? (:id %))) columns)]
                    (concat before-cols [(build-asset-file-column config)] after-cols))
                  columns)]

    (hooks/use-effect!
     (fn []
       (when (nil? loading?)
         (set-loading? true)
         (p/let [_result (db-async/<get-tag-objects (state/get-current-repo) (:db/id class))]
           (react/refresh! (state/get-current-repo)
                           [[:frontend.worker.react/objects (:db/id class)]])
           (set-data! (get-class-objects class))
           (set-loading? false))))
     [])

    (views/view {:config config
                 :data data
                 :set-data! set-data!
                 :view-parent class
                 :view-feature-type :class-objects
                 :columns columns
                 :add-new-object! (fn [{:keys [properties]}]
                                    (if (= :logseq.class/Asset (:db/ident class))
                                      (shui/dialog-open!
                                       (fn []
                                         [:div.flex.flex-col.gap-2
                                          [:div.font-medium "Add assets"]
                                          (filepicker/picker
                                           {:on-change (fn [_e files]
                                                         (p/do!
                                                          (editor-handler/upload-asset! nil files :markdown editor-handler/*asset-uploading? true)
                                                          (set-data! (get-class-objects class))
                                                          (shui/dialog-close!)))})]))
                                      (add-new-class-object! class set-data! properties)))
                 :show-add-property? true
                 :show-items-count? true
                 :add-property! (fn []
                                  (state/pub-event! [:editor/new-property {:block class
                                                                           :class-schema? true}]))
                 :on-delete-rows (fn [table selected-rows]
                                     ;; Built-in objects must not be deleted e.g. Tag, Property and Root
                                   (let [pages (->> selected-rows (filter entity-util/page?) (remove :logseq.property/built-in?))
                                         blocks (->> selected-rows (remove entity-util/page?) (remove :logseq.property/built-in?))]
                                     (p/do!
                                      (when-let [f (get-in table [:data-fns :set-row-selection!])]
                                        (f {}))
                                      (ui-outliner-tx/transact!
                                       {:outliner-op :delete-blocks}
                                       (when (seq blocks)
                                         (outliner-op/delete-blocks! blocks nil))
                                       (let [page-ids (map :db/id pages)
                                             tx-data (map (fn [pid] [:db/retract pid :block/tags (:db/id class)]) page-ids)]
                                         (when (seq tx-data)
                                           (outliner-op/transact! tx-data {:outliner-op :save-block}))))
                                      (set-data! (get-class-objects class)))))})))

(rum/defcs class-objects < rum/reactive db-mixins/query mixins/container-id
  [state class {:keys [current-page? sidebar?]}]
  (when class
    (let [class (db/sub-block (:db/id class))
          config {:container-id (:container-id state)
                  :current-page? current-page?
                  :sidebar? sidebar?}
          properties (outliner-property/get-class-properties class)
          repo (state/get-current-repo)
          objects (->> (db-model/sub-class-objects repo (:db/id class))
                       (map (fn [row] (assoc row :id (:db/id row)))))]
      [:div.ml-1
       (class-objects-inner config class objects properties)])))

(defn- get-property-related-objects [repo property]
  (->> (db-model/get-property-related-objects repo (:db/id property))
       (map (fn [row] (assoc row :id (:db/id row))))))

(defn- add-new-property-object!
  [property set-data! properties]
  (p/let [block (editor-handler/api-insert-new-block! ""
                                                      {:page (:block/uuid property)
                                                       :properties (merge
                                                                    {(:db/ident property) (:db/id (db/entity :logseq.property/empty-placeholder))}
                                                                    properties)
                                                       :edit-block? false})
          _ (set-data! (get-property-related-objects (state/get-current-repo) property))]
    (editor-handler/edit-block! (db/entity [:block/uuid (:block/uuid block)]) 0 {:container-id :unknown-container})
    block))

(rum/defc property-related-objects-inner < rum/static
  [config property objects properties]
  (let [[loading? set-loading?] (rum/use-state nil)
        [data set-data!] (rum/use-state objects)
        columns (views/build-columns config properties)]

    (hooks/use-effect!
     (fn []
       (when (nil? loading?)
         (set-loading? true)
         (p/let [result (db-async/<get-property-objects (state/get-current-repo) (:db/ident property))]
           (set-data! (mapv (fn [m]
                              (let [e (db/entity (:db/id m))]
                                (assoc e :id (:db/id m)))) result))
           (set-loading? false))))
     [])

    (views/view {:config config
                 :data data
                 :view-parent property
                 :view-feature-type :property-objects
                 :set-data! set-data!
                 :columns columns
                 :add-new-object! (fn [{:keys [properties]}]
                                    (add-new-property-object! property set-data! properties))
                 ;; TODO: Add support for adding column
                 :show-add-property? false
                 ;; Relationships with built-in properties must not be deleted e.g. built-in? or parent
                 :on-delete-rows (when-not (:logseq.property/built-in? property)
                                   (fn [table selected-rows]
                                     (let [pages (->> selected-rows (filter entity-util/page?) (remove :logseq.property/built-in?))
                                           blocks (->> selected-rows (remove entity-util/page?) (remove :logseq.property/built-in?))]
                                       (p/do!
                                        (set-data! (get-property-related-objects (state/get-current-repo) property))
                                        (when-let [f (get-in table [:data-fns :set-row-selection!])]
                                          (f {}))
                                        (ui-outliner-tx/transact!
                                         {:outliner-op :delete-blocks}
                                         (when (seq blocks)
                                           (outliner-op/delete-blocks! blocks nil))
                                         (let [page-ids (map :db/id pages)
                                               tx-data (map (fn [pid] [:db/retract pid (:db/ident property)]) page-ids)]
                                           (when (seq tx-data)
                                             (outliner-op/transact! tx-data {:outliner-op :save-block}))))))))})))

;; Show all nodes containing the given property
(rum/defcs property-related-objects < rum/reactive db-mixins/query mixins/container-id
  [state property current-page?]
  (when property
    (let [property' (db/sub-block (:db/id property))
          config {:container-id (:container-id state)
                  :current-page? current-page?}
          ;; Show tags to help differentiate property rows
          properties [property' (db/entity :block/tags)]
          repo (state/get-current-repo)
          objects (get-property-related-objects repo property)]
      [:div.ml-1
       (property-related-objects-inner config property' objects properties)])))
