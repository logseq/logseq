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
            [frontend.db.react :as react]
            [logseq.shui.ui :as shui]
            [frontend.util :as util]
            [frontend.ui :as ui]
            [logseq.common.config :as common-config]
            [frontend.components.filepicker :as filepicker]
            [clojure.string :as string]))

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
    (-> (:logseq.property/_view-for class)
        (ldb/sort-by-order))))

(defn- create-view!
  [class view-title views set-view-entity! set-views!]
  (when-let [page (db/get-case-page common-config/views-page-name)]
    (p/let [result (editor-handler/api-insert-new-block! view-title {:page (:block/uuid page)
                                                                     :properties {:logseq.property/view-for (:db/id class)}})
            view (db/entity [:block/uuid (:block/uuid result)])]
      (set-view-entity! view)
      (set-views! (concat views [view])))))

(rum/defc class-views < rum/reactive db-mixins/query
  [class views current-view {:keys [set-view-entity! set-views!]}]
  [:div.views.flex.flex-row.items-center.flex-wrap.gap-1
   (for [view* views]
     (let [view (db/sub-block (:db/id view*))
           current-view? (= (:db/id current-view) (:db/id view))]
       (shui/button
        {:variant :ghost
         :size :sm
         :class (str "text-sm px-2 py-0 h-6 " (when-not current-view? "text-muted-foreground"))
         :on-click (fn [e]
                     (if (and current-view? (not= (:db/id view) (:db/id class)))
                       (shui/popup-show!
                        (.-target e)
                        (fn []
                          [:<>
                           (shui/dropdown-menu-sub
                            (shui/dropdown-menu-sub-trigger
                             "Rename")
                            (shui/dropdown-menu-sub-content
                             (when-let [block-container (state/get-component :block/container)]
                               (block-container {} view))))
                           (shui/dropdown-menu-item
                            {:key "Delete"
                             :on-click (fn []
                                         (p/do!
                                          (editor-handler/delete-block-aux! view)
                                          (let [views' (remove (fn [v] (= (:db/id v) (:db/id view))) views)]
                                            (set-views! views')
                                            (set-view-entity! (first views'))
                                            (shui/popup-hide!))))}
                            "Delete")])
                        {:as-dropdown? true
                         :align "start"
                         :content-props {:onClick shui/popup-hide!}})
                       (set-view-entity! view)))}
        (if (= (:db/id view) (:db/id class))
          "All"
          (let [title (:block/title view)]
            (if (= title "")
              "New view"
              title))))))
   (shui/button
    {:variant :text
     :size :sm
     :class "!px-1 text-muted-foreground hover:text-foreground"
     :on-click (fn [] (create-view! class "" views set-view-entity! set-views!))}
    (ui/icon "plus" {}))])

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
        [view-entity set-view-entity!] (rum/use-state class)
        [views set-views!] (rum/use-state [class])
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
                  (let [[before-cols after-cols] (split-with #(not (string/starts-with? (str (namespace (:id %))) "logseq.property")) columns)]
                    (concat before-cols [(build-asset-file-column config)] after-cols))
                  columns)]

    (rum/use-effect!
     (fn []
       (when (nil? loading?)
         (set-loading? true)
         (p/let [_result (db-async/<get-views (state/get-current-repo) (:db/id class))
                 views (get-views class)
                 views (->> (concat [class] views)
                            (util/distinct-by :db/id))]
           (set-views! views)
           (when-let [view (first views)]
             (set-view-entity! view))
           (p/let [_result (db-async/<get-tag-objects (state/get-current-repo) (:db/id class))]
             (react/refresh! (state/get-current-repo)
                             [[:frontend.worker.react/objects (:db/id class)]])
             (set-data! (get-class-objects class))
             (set-loading? false)))))
     [])

    (if loading?
      (ui/skeleton)
      (views/view view-entity
                  {:config config
                   :data data
                   :set-data! set-data!
                   :views-title (class-views class views view-entity {:set-view-entity! set-view-entity!
                                                                      :set-views! set-views!})
                   :columns columns
                   :add-new-object! (if (= :logseq.class/Asset (:db/ident class))
                                      (fn [_e]
                                        (shui/dialog-open!
                                         (fn []
                                           [:div.flex.flex-col.gap-2
                                            [:div.font-medium "Add assets"]
                                            (filepicker/picker
                                             {:on-change (fn [_e files]
                                                           (p/do!
                                                            (editor-handler/upload-asset! nil files :markdown editor-handler/*asset-uploading? true)
                                                            (set-data! (get-class-objects class))
                                                            (shui/dialog-close!)))})])))
                                      #(add-new-class-object! class set-data!))
                   :show-add-property? true
                   :add-property! (fn []
                                    (state/pub-event! [:editor/new-property {:block class
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
  (let [[loading? set-loading?] (rum/use-state property)
        [view-entity set-view-entity!] (rum/use-state property)
        [data set-data!] (rum/use-state objects)
        columns (views/build-columns config properties)]

    (rum/use-effect!
     (fn []
       (set-loading? true)
       (p/let [_result (db-async/<get-views (state/get-current-repo) (:db/id property))
               views (get-views property)]
         (when-let [view (first views)]
           (set-view-entity! view))
         (p/let [result (db-async/<get-property-objects (state/get-current-repo) (:db/ident property))]
           (set-data! (mapv (fn [m]
                              (let [e (db/entity (:db/id m))]
                                (assoc e :id (:db/id m)))) result))
           (set-loading? false))))
     [])

    (when (false? loading?)
      (views/view view-entity
                  {:config config
                   :data data
                   :set-data! set-data!
                   :title-key :views.table/property-nodes
                   :columns columns
                   :add-new-object! #(add-new-property-object! property set-data!)
                               ;; TODO: Add support for adding column
                   :show-add-property? false
                   :on-delete-rows (when-not (contains? #{:logseq.property/built-in? :logseq.property/parent}
                                                        (:db/ident property))
                                     (fn [table selected-rows]
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
                                            (f {}))))))}))))

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
      [:div.ml-2
       (property-related-objects-inner config property' objects properties)])))
