(ns frontend.components.objects
  "Provides table views for class objects and property related objects"
  (:require [frontend.components.filepicker :as filepicker]
            [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.db.async :as db-async]
            [frontend.db.react :as react]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn- add-new-class-object!
  [class properties]
  (p/let [block (editor-handler/api-insert-new-block! ""
                                                      {:page (:block/uuid class)
                                                       :properties (merge properties {:block/tags (:db/id class)})
                                                       :edit-block? false})]
    (editor-handler/edit-block! block 0 {:container-id :unknown-container})
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

(defn build-class-object-columns
  [config class properties]
  (let [properties' (remove nil? properties)
        columns* (views/build-columns config properties' {:add-tags-column? true
                                                          :add-page-column? true})
        columns (cond
                  (= (:db/ident class) :logseq.class/Pdf-annotation)
                  (remove #(contains? #{:logseq.property/ls-type} (:id %)) columns*)
                  (= (:db/ident class) :logseq.class/Asset)
                  (remove #(contains? #{:logseq.property.asset/checksum} (:id %)) columns*)
                  :else
                  columns*)]
    (if (= (:db/ident class) :logseq.class/Asset)
      ;; Insert in front of tag's properties
      (let [[before-cols after-cols] (split-with #(not (db-property/logseq-property? (:id %))) columns)]
        (concat before-cols [(build-asset-file-column config)] after-cols))
      columns)))

(defn build-property-object-columns
  [config property properties]
  (let [tags? (= :block/tags (:db/ident property))]
    (views/build-columns config properties
                         (cond-> {:add-page-column? true}
                           tags? (assoc :add-tags-column? false)))))

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
  (let [list-view? (= :logseq.property.view/type.list (:logseq.property.view/type-ident view))]
    (when-let [repo (state/get-current-repo)]
      (if list-view?
        (when-let [result (:result (get @react/*query-state [repo :frontend.worker.react/objects (:db/id view-parent)]))]
          (swap! result inc))
        (let [set-data! (get-in table [:data-fns :set-data!])
              full-data (:full-data table)]
          (set-data! (vec (concat full-data ids))))))))

(hsx/defc class-objects-inner
  [config class properties]
  (let [*ref (hooks/use-ref nil)
        db-ident (:db/ident class)
        asset? (= db-ident :logseq.class/Asset)
        columns (build-class-object-columns config class properties)
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
                  :add-new-object! add-new-object!
                  :show-add-property? true
                  :show-items-count? true
                  :add-property! (fn [e]
                                   (state/pub-event! [:editor/new-property {:block class
                                                                            :class-schema? true
                                                                            :target (.-target e)}]))})]))

(hsx/defc class-objects
  [class config]
  (let [container-key (select-keys config [:id :sidebar? :embed? :custom-query? :query :current-block :table? :block? :db/id :page-name])
        config (assoc config :container-id (or (:container-id config) (state/get-container-id container-key)))
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
     (class-objects-inner config class properties)]))

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
  (let [columns (build-property-object-columns config property properties)]
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
  (let [property' property
        [tags-property set-tags-property!] (hooks/use-state nil)
        container-key (select-keys config [:id :sidebar? :embed? :custom-query? :query :current-block :table? :block? :db/id :page-name])
        config (assoc config :container-id (or (:container-id config) (state/get-container-id container-key)))
        ;; Show tags to help differentiate property rows
        properties (if (= (:db/ident property) :block/tags)
                     [property']
                     (cond-> [property']
                       tags-property
                       (conj tags-property)))]
    (hooks/use-effect!
     (fn []
       (when-not (= (:db/ident property) :block/tags)
         (p/let [property (state/<invoke-db-worker :thread-api/pull
                                                   (state/get-current-repo)
                                                   '[* {:property/closed-values [*]}]
                                                   :block/tags)]
           (set-tags-property! property)))
       nil)
     [(:db/ident property)])
    [:div.ml-1
     (property-related-objects-inner config property' properties)]))
