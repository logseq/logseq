(ns frontend.components.objects
  "Provides table views for class objects and property related objects"
  (:require [frontend.components.views :as views]
            [frontend.db :as db]
            [logseq.db :as ldb]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.handler.editor :as editor-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [logseq.outliner.property :as outliner-property]
            [promesa.core :as p]
            [rum.core :as rum]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.db.react :as react]))

(defn- get-class-objects
  [class]
  (->> (db-model/get-class-objects (state/get-current-repo) (:db/id class))
       (map (fn [row] (assoc row :id (:db/id row))))))

(defn- add-new-class-object!
  [class set-data!]
  (p/let [block (editor-handler/api-insert-new-block! ""
                                                      {:page (:block/uuid class)
                                                       :properties {:block/tags (:db/id class)}
                                                       :edit-block? false})
          _ (set-data! (get-class-objects class))]
    (editor-handler/edit-block! (db/entity [:block/uuid (:block/uuid block)]) 0 :unknown-container)))

(defn- get-views
  [ent]
  (let [class (db/entity (:db/id ent))]
    (-> (filter (fn [b]
                 (= (:db/ident class) (:logseq.property/view-for b)))
               (:block/_parent class))
       (ldb/sort-by-order))))

(rum/defc class-objects-inner < rum/static
  [config class objects properties]
  (let [[loading? set-loading?] (rum/use-state nil)
        [view-entity set-view-entity!] (rum/use-state nil)
        [data set-data!] (rum/use-state objects)
        columns (views/build-columns config properties)]

    (rum/use-effect!
     (fn []
       (set-data! objects))
     [objects])

    (rum/use-effect!
     (fn []
       (when (nil? loading?)
         (set-loading? true)
         (p/let [_result (db-async/<get-views (state/get-current-repo) (:db/id class))
                 views (get-views class)]
           (when-let [view (first views)]
             (set-view-entity! view))
           (p/let [_result (db-async/<get-tag-objects (state/get-current-repo) (:db/id class))]
             (react/refresh! (state/get-current-repo)
                             [[:frontend.worker.react/objects (:db/id class)]])
             (set-data! (get-class-objects class))
             (set-loading? false)))))
     [])

    (when (false? loading?)
      (views/view view-entity {:data data
                               :set-data! set-data!
                               :title-key :views.table/tagged-nodes
                               :columns columns
                               :add-new-object! #(add-new-class-object! class set-data!)
                               :create-view! (fn []
                                               (p/let [result (editor-handler/api-insert-new-block! "" {:page (:block/uuid class)
                                                                                                        :properties {:logseq.property/view-for (:db/ident class)}})]
                                                 (let [view (db/entity [:block/uuid (:block/uuid result)])]
                                                   (set-view-entity! view)
                                                   view)))
                               :show-add-property? true
                               :add-property! (fn []
                                                (state/pub-event! [:editor/new-property {:block class
                                                                                         :page-configure? true
                                                                                         :class-schema? true}]))
                               :on-delete-rows (fn [table selected-rows]
                                                 (let [pages (filter ldb/page? selected-rows)
                                                       blocks (remove ldb/page? selected-rows)]
                                                   (p/do!
                                                    (ui-outliner-tx/transact!
                                                     {:outliner-op :delete-blocks}
                                                     (when (seq blocks)
                                                       (outliner-op/delete-blocks! blocks nil))
                                                     (let [page-ids (map :db/id pages)
                                                           tx-data (map (fn [pid] [:db/retract pid :block/tags (:db/id class)]) page-ids)]
                                                       (when (seq tx-data)
                                                         (outliner-op/transact! tx-data {:outliner-op :save-block}))))
                                                    (set-data! (get-class-objects class))
                                                    (when-let [f (get-in table [:data-fns :set-row-selection!])]
                                                      (f {})))))}))))

(rum/defcs class-objects < rum/reactive db-mixins/query mixins/container-id
  [state class]
  (when class
    (let [class (db/sub-block (:db/id class))
          config {:container-id (:container-id state)}
          properties (cond->> (outliner-property/get-class-properties (db/get-db) class)
                       (= :logseq.class/Root (:db/ident class))
                       (concat [(db/entity :block/tags)]))
          repo (state/get-current-repo)
          objects (->> (db-model/sub-class-objects repo (:db/id class))
                       (map (fn [row] (assoc row :id (:db/id row)))))]
      [:div.ml-2
       (class-objects-inner config class objects properties)])))

(defn- get-property-related-objects [repo property]
  (->> (db-model/get-property-related-objects repo (:db/id property))
       (map (fn [row] (assoc row :id (:db/id row))))))

(defn- add-new-property-object!
  [property set-data!]
  (p/let [block (editor-handler/api-insert-new-block! ""
                                                      {:page (:block/uuid property)
                                                       :properties {(:db/ident property) (:db/id (db/entity :logseq.property/empty-placeholder))}
                                                       :edit-block? false})
          _ (set-data! (get-property-related-objects (state/get-current-repo) property))]
    (editor-handler/edit-block! (db/entity [:block/uuid (:block/uuid block)]) 0 :unknown-container)))

(rum/defc property-related-objects-inner < rum/static
  [config property objects properties]
  (let [[loading? set-loading?] (rum/use-state nil)
        [view-entity set-view-entity!] (rum/use-state nil)
        [data set-data!] (rum/use-state objects)
        columns (views/build-columns config properties)]

    (rum/use-effect!
     (fn []
       (set-data! objects))
     [objects])

    (rum/use-effect!
     (fn []
       (set-loading? true)
       (p/let [_result (db-async/<get-views (state/get-current-repo) (:db/id property))
               views (get-views property)]
         (when-let [view (first views)]
           (set-view-entity! view))
         (p/let [result (db-async/<get-property-objects (state/get-current-repo) (:db/ident property))]
           (set-data! (mapv #(assoc % :id (:db/id %)) result))
           (set-loading? false))))
     [])

    (when (false? loading?)
      (views/view view-entity {:data data
                               :set-data! set-data!
                               :title-key :views.table/property-nodes
                               :columns columns
                               :add-new-object! #(add-new-property-object! property set-data!)
                               :create-view! (fn []
                                               (p/let [result (editor-handler/api-insert-new-block! "" {:page (:block/uuid property)
                                                                                                        :properties {:logseq.property/view-for (:db/ident property)}})]
                                                 (let [view (db/entity [:block/uuid (:block/uuid result)])]
                                                   (set-view-entity! view)
                                                   view)))
                               ;; TODO: Add support for adding column
                               :show-add-property? false
                               :on-delete-rows (fn [table selected-rows]
                                                 (let [pages (filter ldb/page? selected-rows)
                                                       blocks (remove ldb/page? selected-rows)]
                                                   (p/do!
                                                    (ui-outliner-tx/transact!
                                                     {:outliner-op :delete-blocks}
                                                     (when (seq blocks)
                                                       (outliner-op/delete-blocks! blocks nil))
                                                     (let [page-ids (map :db/id pages)
                                                           tx-data (map (fn [pid] [:db/retract pid (:db/ident property)]) page-ids)]
                                                       (when (seq tx-data)
                                                         (outliner-op/transact! tx-data {:outliner-op :save-block}))))
                                                    (set-data! (get-property-related-objects (state/get-current-repo) property))
                                                    (when-let [f (get-in table [:data-fns :set-row-selection!])]
                                                      (f {})))))}))))

;; Show all nodes containing the given property
(rum/defcs property-related-objects < rum/reactive db-mixins/query mixins/container-id
  [state property]
  (when property
    (let [property' (db/sub-block (:db/id property))
          config {:container-id (:container-id state)}
          ;; Show tags to help differentiate property rows
          properties [property' (db/entity :block/tags)]
          repo (state/get-current-repo)
          objects (get-property-related-objects repo property)]
      [:div.ml-2
       (property-related-objects-inner config property' objects properties)])))
