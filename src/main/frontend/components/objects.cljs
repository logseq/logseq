(ns frontend.components.objects
  "Provides table views for class objects and property related objects"
  (:require [frontend.components.filepicker :as filepicker]
            [frontend.components.views :as views]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.handler.editor :as editor-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [logseq.db :as ldb]
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
   :name "File"
   :type :string
   :header views/header-cp
   :cell (fn [_table row _column]
           (when-let [asset-cp (state/get-component :block/asset-cp)]
             [:div.block-content.overflow-hidden
              {:style {:max-height 30}}
              (asset-cp (assoc config :disable-resize? true) row)]))
   :disable-hide? true})

(comment
  (defn- edit-new-object
    [ref id]
    (js/setTimeout
     (fn []
       (when-let [title-node (d/sel1 ref (util/format ".ls-table-row[data-id='%d'] .table-block-title" id))]
         (.click title-node)))
     100)))

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
                          (fn [_view table {:keys [properties]}]
                            (let [set-data! (get-in table [:data-fns :set-data!])
                                  full-data (:full-data table)]
                              (if (= :logseq.class/Asset (:db/ident class))
                                (shui/dialog-open!
                                 (fn []
                                   [:div.flex.flex-col.gap-2
                                    [:div.font-medium "Add assets"]
                                    (filepicker/picker
                                     {:on-change (fn [_e files]
                                                   (p/let [entities (editor-handler/upload-asset! nil files :markdown editor-handler/*asset-uploading? true)]
                                                     (shui/dialog-close!)
                                                     (when (seq entities)
                                                       (set-data! (concat full-data (map :db/id entities))))))})]))
                                (p/let [block (add-new-class-object! class properties)]
                                  (when (:db/id block)
                                    (set-data! (conj (vec full-data) (:db/id block)))
                                    (state/sidebar-add-block! (state/get-current-repo) (:db/id block) :block)
                                    ;; (edit-new-object (rum/deref *ref) (:db/id block))
                                    ))))))]

    [:div {:ref *ref}
     (views/view {:config config
                  :view-parent class
                  :view-feature-type :class-objects
                  :columns columns
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
                 :add-new-object! (fn [_view table {:keys [properties]}]
                                    (p/let [set-data! (get-in table [:data-fns :set-data!])
                                            full-data (:full-data table)
                                            block (add-new-property-object! property properties)]
                                      (when (:db/id block)
                                        (state/sidebar-add-block! (state/get-current-repo) (:db/id block) :block)
                                        (set-data! (conj (vec full-data) (:db/id block))))))
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
