(ns frontend.components.property.value
  (:require [cljs-time.coerce :as tc]
            [clojure.string :as string]
            [frontend.components.select :as select]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as model]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.property :as property-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [medley.core :as medley]
            [rum.core :as rum]))

(defn exit-edit-property
  []
  (property-handler/set-editing-new-property! nil)
  (state/clear-edit!))

(defn set-editing!
  [property editor-id dom-id v]
  (let [v (str v)
        cursor-range (if dom-id
                       (some-> (gdom/getElement dom-id) util/caret-range)
                       "")]
    (state/set-editing! editor-id v property cursor-range)))

(defn add-property!
  "If a class and in a class schema context, add the property to its schema.
  Otherwise, add a block's property and its value"
  ([block property-key property-value] (add-property! block property-key property-value {}))
  ([block property-key property-value {:keys [exit-edit? class-schema?]
                                       :or {exit-edit? true}}]
   (let [repo (state/get-current-repo)
         class? (= (:block/type block) "class")]
     (when property-key
       (if (and class? class-schema?)
         (property-handler/class-add-property! repo (:block/uuid block) property-key)
         (property-handler/set-block-property! repo (:block/uuid block) property-key property-value)))
     (when exit-edit?
       (exit-edit-property)))))

(rum/defc date-picker
  [block property value]
  (let [value' (when-not (string/blank? value)
                 (tc/to-local-date value))
        text (if value'
               (str value')
               "Pick a date")
        open-modal! (fn []
                      (state/set-modal!
                       #(ui/datepicker value' {:on-change (fn [_e date]
                                                            (let [repo (state/get-current-repo)]
                                                              (property-handler/set-block-property! repo (:block/uuid block)
                                                                                              (:block/name property)
                                                                                              date)
                                                              (exit-edit-property)
                                                              (state/close-modal!)))})))]
    [:a
     {:tabIndex "0"
      :on-click open-modal!
      :on-key-down (fn [e]
                     (when (= (util/ekey e) "Enter")
                       (open-modal!)))}
     [:span.inline-flex.items-center
      (ui/icon "calendar")
      [:span.ml-1 text]]]))

(defn- select-page
  [block property opts]
  (let [repo (state/get-current-repo)
        pages (->> (model/get-all-page-original-names repo)
                   (map (fn [p] {:value p})))]
    (select/select {:items pages
                    :dropdown? true
                    :on-chosen (fn [chosen]
                                 (let [page (string/trim (:value chosen))
                                       id (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc page)]))]
                                   (when (nil? id)
                                     (page-handler/create! page {:redirect? false
                                                                 :create-first-block? false}))
                                   (let [id' (or id (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc page)])))]
                                     (add-property! block (:block/original-name property) id'))
                                   (when-let [f (:on-chosen opts)] (f))))
                    :show-new-when-not-exact-match? true
                    :input-opts (fn [_]
                                  {:on-blur (or (:on-chosen opts) identity)
                                   :on-key-down
                                   (fn [e]
                                     (case (util/ekey e)
                                       "Escape"
                                       (when-let [f (:on-chosen opts)] (f))
                                       nil))})})))

(defn- select-block
  [block property opts]
  (let [blocks (->> (model/get-all-block-contents)
                    (remove (fn [b] (= (:db/id block) (:db/id b))))
                    (map (fn [b]
                           (assoc b :value (:block/content b)))))]
    (select/select {:items blocks
                    :dropdown? true
                    :on-chosen (fn [chosen]
                                 (let [id (:block/uuid chosen)]
                                   (add-property! block (:block/original-name property) id)
                                   (when-let [f (:on-chosen opts)] (f))))
                    :input-opts (fn [not-matched?]
                                  {:on-blur (or (:on-chosen opts) identity)
                                   :on-key-down
                                   (fn [e]
                                     (case (util/ekey e)
                                       "Enter"
                                       (when not-matched?
                                         (let [repo (state/get-current-repo)
                                               content (string/trim (util/evalue e))]
                                           (when-not (string/blank? content)
                                             (let [pid (:block/uuid (db/entity [:block/name "created-in-property"]))
                                                   new-block (-> (editor-handler/wrap-parse-block {:block/format :markdown
                                                                                                   :block/content content})
                                                                 (outliner-core/block-with-timestamps)
                                                                 (merge {:block/page {:db/id
                                                                                      (or (:db/id (:block/page block))
                                                                                          (:db/id block))}
                                                                         :block/properties {pid true}}))
                                                   id (:block/uuid new-block)]
                                               (db/transact! repo [new-block] {:outliner-op :insert-blocks})
                                               (add-property! block (:block/original-name property) id)
                                               (when-let [f (:on-chosen opts)] (f))))))
                                       "Escape"
                                       (do (exit-edit-property)
                                           (when-let [f (:on-chosen opts)] (f)))
                                       nil))})})))

(defn- select
  [block property opts]
  (let [items (->> (model/get-block-property-values (:block/uuid property))
                   (mapcat (fn [[_id value]]
                             (if (coll? value)
                               (map (fn [v] {:value v}) value)
                               [{:value value}])))
                   (distinct))
        add-property-f #(add-property! block (:block/original-name property) %)]
    (select/select {:items items
                    :dropdown? true
                    :on-chosen (fn [chosen]
                                 (add-property-f (:value chosen))
                                 (when-let [f (:on-chosen opts)] (f)))
                    :show-new-when-not-exact-match? true
                    :input-opts (fn [_]
                                  {:on-blur (or (:on-chosen opts) identity)
                                   :on-key-down
                                   (fn [e]
                                     (case (util/ekey e)
                                       "Escape"
                                       (when-let [f (:on-chosen opts)] (f))
                                       nil))})})))

(defn- move-cursor
  [up? opts]
  (let [f (if up? dec inc)
        id (str (:parent-dom-id opts) "-" (f (:idx opts)))
        editor-id (str (:parent-dom-id opts) "-editor" "-" (f (:idx opts)))
        sibling (gdom/getElement id)
        editor (gdom/getElement editor-id)]
    (when sibling
      (.click sibling)
      (state/set-state! :editor/property-triggered-by-click? {editor-id true}))
    (when editor
      (.focus editor))))

(defn- new-text-editor-opts
  [repo block property value type editor-id *add-new-item? opts]
  {:on-blur
   (fn [e]
     (let [new-value (util/evalue e)
           blank? (string/blank? new-value)]
       (when (not (state/get-editor-action))
         (util/stop e)
         (when-not blank?
           (property-handler/set-block-property! repo (:block/uuid block)
                                                 (:block/original-name property)
                                                 new-value
                                                 :old-value value))
         (when (= js/document.activeElement (gdom/getElement editor-id))
           (exit-edit-property))
         (when *add-new-item? (reset! *add-new-item? false)))))
   :on-key-down
   (fn [e]
     (let [new-value (util/evalue e)
           blank? (string/blank? new-value)
           enter? (= (util/ekey e) "Enter")
           esc? (= (util/ekey e) "Escape")
           meta? (util/meta-key? e)
           create-another-one? (and meta? enter?)
           down? (= (util/ekey e) "ArrowDown")
           up? (= (util/ekey e) "ArrowUp")]
       (when (and (or enter? esc? create-another-one? down? up?)
                  (not (state/get-editor-action)))
         (util/stop e)
         (when-not blank?
           (when (not= (string/trim new-value) (string/trim value))
             (property-handler/set-block-property! repo (:block/uuid block)
                                                   (:block/original-name property)
                                                   new-value
                                                   :old-value value)))

         (exit-edit-property)

         (cond
           down?
           (move-cursor false opts)

           up?
           (move-cursor true opts)

           (or
            esc?
            blank?
            (and *add-new-item? (not= type :default)))
           (when *add-new-item? (reset! *add-new-item? false))

           (and *add-new-item? @*add-new-item?)
           (some-> (gdom/getElement editor-id)
                   (util/set-change-value ""))

           (and (or enter? create-another-one?)
                *add-new-item?
                (not blank?))
           (reset! *add-new-item? true)))))})

(defn- new-block-editor-opts
  [*add-new-item?]
  {:on-key-down
   (fn [e]
     (let [meta? (util/meta-key? e)
           enter? (= (util/ekey e) "Enter")
           create-another-one? (and meta? enter?)]
       (when create-another-one?
         (util/stop e)
         (reset! *add-new-item? true))))})

(rum/defc property-scalar-value < rum/reactive db-mixins/query
  [block property value {:keys [inline-text page-cp block-cp
                                editor-id dom-id row?
                                editor-box editor-args
                                editing? *add-new-item? *configure-show?
                                blocks-container-id]
                         :as opts}]
  (let [property (model/sub-block (:db/id property))
        multiple-values? (= :many (:cardinality (:block/schema property)))
        editor-id (or editor-id (str "ls-property-" blocks-container-id "-" (:db/id block) "-" (:db/id property)))
        editing? (or editing? (state/sub [:editor/editing? editor-id]))
        repo (state/get-current-repo)
        type (:type (:block/schema property))
        select-opts {:on-chosen (fn []
                                  (when *configure-show? (reset! *configure-show? false))
                                  (when *add-new-item? (reset! *add-new-item? false)))}]
    (case type
      :date
      (date-picker block property value)

      :checkbox
      (let [add-property! (fn []
                            (add-property! block (:block/original-name property) (boolean (not value))))]
        (ui/checkbox {:tabIndex "0"
                      :checked value
                      :on-change (fn [_e] (add-property!))
                      :on-key-down (fn [e]
                                     (when (= (util/ekey e) "Enter")
                                       (add-property!)))}))
      ;; :others
      (if editing?
        [:div.flex.flex-1
         (case type
           (list :number :url)
           [:div.h-6 (select block property select-opts)]

           :page
           [:div.h-6 (select-page block property select-opts)]

           :block
           [:div.h-6 (select-block block property select-opts)]

           (let [config {:editor-opts (new-text-editor-opts repo block property value type editor-id *add-new-item? opts)}]
             [:div
              (editor-box editor-args editor-id (cond-> config
                                                  multiple-values?
                                                  (assoc :property-value value)))]))]
        (let [class (str (when-not row? "flex flex-1 ")
                         (when multiple-values? "property-value-content"))]
          [:div {:id (or dom-id (random-uuid))
                 :class class
                 :style {:min-height 24}
                 :on-click (fn []
                             (let [page-or-block? (contains? #{:page :block} type)]
                               (when (or (not page-or-block?)
                                         (and (string/blank? value) page-or-block?))
                                 (set-editing! property editor-id dom-id value))))}
           (let [type (if (and (= type :default) (uuid? value))
                        (if-let [e (db/entity [:block/uuid value])]
                          (if (:block/name e) :page :block)
                          type)
                        type)]
             (when-not (string/blank? value)
               (case type
                 :page
                 (when-let [page (db/entity [:block/uuid value])]
                   (page-cp {} page))

                 :block
                 (if-let [block (db/entity [:block/uuid value])]
                   (let [editor-opts (new-block-editor-opts *add-new-item?)]
                     [:div.property-block-container.w-full
                      (block-cp [block] {:id (str value)
                                         :editor-box editor-box
                                         :editor-opts editor-opts
                                         :in-property? true})])
                   (if multiple-values?
                     (property-handler/delete-property-value! repo block (:block/uuid property) value)
                     (property-handler/remove-block-property! repo
                                                              (:block/uuid block)
                                                              (:block/uuid property))))

                 (inline-text {} :markdown (str value)))))])))))

(rum/defcs multiple-value-item < (rum/local false ::show-close?)
  [state entity property item {:keys [editor-id row? *add-new-item?]
                               :as opts}]
  (let [*show-close? (::show-close? state)
        editing? (state/sub [:editor/editing? editor-id])]
    [:div (cond->
           {:on-mouse-over #(reset! *show-close? true)
            :on-mouse-out  #(reset! *show-close? false)}
            (not row?)
            (assoc :class "relative flex flex-1")
            row?
            (assoc :class "relative pr-4"))
     (property-scalar-value entity property item (assoc opts :editing? editing?))
     (when (and @*show-close? (not editing?) (not @*add-new-item?))
       [:a.close.fade-in
        {:class "absolute top-0 right-0"
         :title "Delete this value"
         :on-mouse-down
         (fn []
           (property-handler/delete-property-value! (state/get-current-repo)
                                                    entity
                                                    (:block/uuid property)
                                                    item))}
        (ui/icon "x")])]))

(rum/defcs multiple-values <
  (rum/local false ::add-new-item?)
  (rum/local false ::show-add?)
  [state block property v opts dom-id schema editor-id editor-args]
  (let [*show-add? (::show-add? state)
        *add-new-item? (::add-new-item? state)
        block? (= (:type schema) :block)
        default? (= (:type schema) :default)
        row? (contains? #{:page} (:type schema))
        items (if (coll? v) v (when v [v]))]
    [:div.relative
     {:class (cond
               row?
               "flex flex-1 flex-row items-center flex-wrap"
               block?
               "grid"
               :else
               "grid gap-1")
      :on-mouse-over #(reset! *show-add? true)
      :on-mouse-out  #(reset! *show-add? false)}

     (for [[idx item] (medley/indexed items)]
       (let [dom-id' (str dom-id "-" idx)
             editor-id' (str editor-id "-" idx)]
         (rum/with-key
           (multiple-value-item block property item
                                (merge
                                 opts
                                 {:parent-dom-id dom-id
                                  :idx idx
                                  :dom-id dom-id'
                                  :editor-id editor-id'
                                  :editor-args editor-args
                                  :row? row?
                                  :*add-new-item? *add-new-item?}))
           dom-id')))

     (cond
       @*add-new-item?
       (property-scalar-value block property ""
                              (merge
                               opts
                               {:editor-args editor-args
                                :editor-id editor-id
                                :dom-id dom-id
                                :editing? true
                                :*add-new-item? *add-new-item?}))

       (and (or default? block?) (empty? items))
       [:div.rounded-sm.ml-1 {:on-click (fn [] (reset! *add-new-item? true))}
        [:div.opacity-50.text-sm "Input something"]]

       (and @*show-add? block?)
       [:div.absolute {:style {:left "-1.5rem"
                               :bottom " -0.125rem"}
                       :on-click (fn [] (reset! *add-new-item? true))}
        (ui/tippy {:html [:span.text-sm
                          [:span.mr-1 "Add another block (click or "]
                          (ui/render-keyboard-shortcut "mod+enter")
                          [:span.ml-1 ")"]]
                   :interactive     true
                   :delay           [100, 100]
                   :position        "bottom"}
                  [:a.add-button-link.flex.p-2
                   (ui/icon "circle-plus")])])]))

(rum/defc property-value < rum/reactive
  [block property v opts]
  (let [dom-id (str "ls-property-" (:blocks-container-id opts) "-" (:db/id property))
        editor-id (str dom-id "-editor")
        schema (:block/schema property)
        multiple-values? (= :many (:cardinality schema))
        editor-args {:block property
                     :parent-block block
                     :format :markdown}]
    (if multiple-values?
      (multiple-values block property v opts dom-id schema editor-id editor-args)
      [:div.flex.flex-1.items-center.property-value-content
       (property-scalar-value block property v
                              (merge
                               opts
                               {:editor-args editor-args
                                :editor-id editor-id
                                :dom-id dom-id}))])))
