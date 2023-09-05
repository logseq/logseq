(ns frontend.components.property.value
  (:require [cljs-time.coerce :as tc]
            [clojure.string :as string]
            [frontend.components.select :as select]
            [frontend.config :as config]
            [frontend.date :as date]
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
  (let [title (when (uuid? value)
                (:block/original-name (db/entity [:block/uuid value])))
        value (if title
                (js/Date. (date/journal-title->long title))
                value)
        value' (when-not (string/blank? value)
                 (tc/to-local-date value))]
    (ui/dropdown
     (fn [{:keys [toggle-fn]}]
       [:a.flex
        {:tabIndex "0"
         :on-click toggle-fn
         :on-key-down (fn [e]
                        (when (= (util/ekey e) "Enter")
                          toggle-fn))}
        [:span.inline-flex.items-center
         [:span.mr-1 (or title "Pick a date")]
         (when-not title (ui/icon "calendar" {:size 15}))]])
     (fn [{:keys [toggle-fn]}]
       (ui/datepicker value' {:on-change (fn [_e date]
                                           (let [repo (state/get-current-repo)
                                                 journal (date/js-date->journal-title date)]
                                             (when-not (db/entity [:block/name (util/page-name-sanity-lc journal)])
                                               (page-handler/create! journal {:redirect? false
                                                                              :create-first-block? false}))
                                             (when-let [page (db/entity [:block/name (util/page-name-sanity-lc journal)])]
                                               (property-handler/set-block-property! repo (:block/uuid block)
                                                                                     (:block/name property)
                                                                                     (:block/uuid page)))
                                             (exit-edit-property)
                                             (toggle-fn)))}))
     {:modal-class (util/hiccup->class
                    "origin-top-right.absolute.left-0.rounded-md.shadow-lg.mt-2")})))

(defn- select-page
  [block property {:keys [classes multiple-values?] :as opts}]
  (let [repo (state/get-current-repo)
        pages (->>
               (if (seq classes)
                 (mapcat
                  (fn [class]
                    (some->> (:db/id (db/entity [:block/uuid class]))
                             (model/get-class-objects repo)
                             (map #(:block/original-name (db/entity %)))))
                  classes)
                 (model/get-all-page-original-names repo))
               distinct)
        options (map (fn [p] {:value p}) pages)
        type (:type (:block/schema property))
        opts {:items options
              :dropdown? true
              :input-default-placeholder (if multiple-values?
                                           (str "Choose " (if (= type :object) "objects" "pages"))
                                           (str "Choose " (if (= type :object) "object" "page")))
              :on-chosen (fn [chosen]
                           (let [page (string/trim (if (string? chosen) chosen (:value chosen)))
                                 id (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc page)]))
                                 class? (= (:block/name property) "tags")]
                             (when (nil? id)
                               (page-handler/create! page {:redirect? false
                                                           :create-first-block? false
                                                           :tags classes
                                                           :class? class?}))
                             (let [id' (or id (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc page)])))]
                               (add-property! block (:block/original-name property) id'))
                             (when-let [f (:on-chosen opts)] (f))))
              :show-new-when-not-exact-match? true
              :input-opts (fn [_]
                            {:on-blur (fn []
                                        (exit-edit-property)
                                        (when-let [f (:on-chosen opts)] (f)))
                             :on-key-down
                             (fn [e]
                               (case (util/ekey e)
                                 "Escape"
                                 (do
                                   (exit-edit-property)
                                   (when-let [f (:on-chosen opts)] (f)))
                                 nil))})}]
    (select/select opts)))

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
  {:style {:padding 0
           :background "none"}
   :on-blur
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
           up? (= (util/ekey e) "ArrowUp")
           backspace? (= (util/ekey e) "Backspace")]
       (when (and (or enter? esc? create-another-one? down? up? backspace?)
                  (not (state/get-editor-action)))
         (when-not (or down? up? backspace?) (util/stop e))
         (when (and (not blank?) (or enter? esc?))
           (when (not= (string/trim new-value) (and value (string/trim value)))
             (property-handler/set-block-property! repo (:block/uuid block)
                                                   (:block/original-name property)
                                                   new-value
                                                   :old-value value)))

         (when-not backspace? (exit-edit-property))

         (cond
           (and backspace? (= new-value "") *add-new-item?  (not @*add-new-item?)) ; delete item
           (do
             (move-cursor true opts)
             (property-handler/delete-property-value! repo block (:block/uuid property) value))

           (and backspace? (= new-value "") *add-new-item? @*add-new-item?)
           (do
             (move-cursor true opts)
             (reset! *add-new-item? false))

           backspace?
           nil

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

(defn create-new-block!
  [block property {:keys [*add-new-item?]}]
  (let [repo (state/get-current-repo)
        pid (:block/uuid (db/entity [:block/name "created-in-property"]))
        new-block (-> {:block/uuid (db/new-block-id)
                       :block/format :markdown
                       :block/content ""
                       :block/page {:db/id
                                    (or (:db/id (:block/page block))
                                        (:db/id block))}
                       :block/properties {pid true}}
                      outliner-core/block-with-timestamps)
        id (:block/uuid new-block)]
    (db/transact! repo [new-block] {:outliner-op :insert-blocks})
    (add-property! block (:block/original-name property) id)
    (when *add-new-item? (reset! *add-new-item? false))
    (editor-handler/edit-block! (db/entity [:block/uuid id]) 0 id)))

(defn- block-editor-opts
  [repo block property value *add-new-item? opts]
  {:on-key-down
   (fn [e]
     (let [new-value (util/evalue e)
           meta? (util/meta-key? e)
           enter? (= (util/ekey e) "Enter")
           create-another-one? (and meta? enter?)
           backspace? (= (util/ekey e) "Backspace")
           current-block (db/entity [:block/uuid value])]
       (cond
         create-another-one?
         (do
           (util/stop e)
           (reset! *add-new-item? true)
           (create-new-block! block property opts))

         (and backspace?
              (= new-value "")
              ;; no children block
              (empty? (:block/_parent current-block)))
         (do
           (editor-handler/keydown-up-down-handler :up {:pos :max})
           (property-handler/delete-property-value! repo block (:block/uuid property) value)))))})

(rum/defc empty-block
  [on-click]
  [:div.flex.flex-row.cursor-text {:on-click on-click}
   [:div.flex.flex-row.items-center.mr-2.ml-1
    [:span.bullet-container.cursor
     [:span.bullet]]]
   [:div.flex.flex-1
    [:span.opacity-70 ""]]])

(rum/defc property-scalar-value < rum/reactive db-mixins/query
  [block property value {:keys [inline-text page-cp block-cp
                                editor-id dom-id row?
                                editor-box editor-args
                                editing? *add-new-item?
                                blocks-container-id]
                         :as opts}]
  (let [property (model/sub-block (:db/id property))
        repo (state/get-current-repo)
        schema (:block/schema property)
        type (:type schema)
        multiple-values? (= :many (:cardinality schema))
        editor-id (or editor-id (str "ls-property-" blocks-container-id "-" (:db/id block) "-" (:db/id property)))
        editing? (or editing? (state/sub [:editor/editing? editor-id]))
        select-opts {:on-chosen (fn []
                                  ;; (when *configure-show? (reset! *configure-show? false))
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

           :object
           [:div.h-6 (select-page block property (assoc select-opts
                                                        :classes (:classes schema)
                                                        :multiple? multiple-values?))]

           :page
           [:div.h-6 (select-page block property select-opts)]

           :block
           nil

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
                             (let [ref? (contains? #{:page :block :object} type)]
                               (when (or (not ref?)
                                         (and (string/blank? value) ref?))
                                 (when-not (and (= type :block) (string/blank? value))
                                   (set-editing! property editor-id dom-id value)))))}
           (let [type (if (and (= type :default) (uuid? value))
                        (if-let [e (db/entity [:block/uuid value])]
                          (if (:block/name e) :page :block)
                          type)
                        type)]
             (if (string/blank? value)
               [:div.opacity-70.text-sm
                (case type
                  :object
                  (if multiple-values? "Choose objects" "Choose object")
                  :page
                  (if multiple-values? "Choose pages" "Choose page")
                  "Input something")]
               (case type
                 :object
                 (when-let [object (db/entity [:block/uuid value])]
                   (page-cp {:disable-preview? true} object))

                 :page
                 (when-let [page (db/entity [:block/uuid value])]
                   (page-cp {:disable-preview? true} page))

                 :block
                 (if-let [item-block (db/entity [:block/uuid value])]
                   (let [editor-opts (block-editor-opts repo block property value *add-new-item? opts)]
                     [:div.property-block-container.w-full
                      (block-cp [item-block] {:id (str value)
                                              :blocks-container-id (:blocks-container-id opts)
                                              :editor-box editor-box
                                              :editor-opts editor-opts
                                              :in-property? true})])
                   (do
                     (if multiple-values?
                       (property-handler/delete-property-value! repo block (:block/uuid property) value)
                       (property-handler/remove-block-property! repo
                                                                (:block/uuid block)
                                                                (:block/uuid property)))
                     (exit-edit-property)
                     nil))

                 (inline-text {} :markdown (str value)))))])))))

(rum/defc multiple-blocks-add-button < rum/reactive
  [block property opts]
  (let [editing? (state/sub :editor/editing?)]
    (when-not editing?
      [:div.absolute.fade-in
       {:style {:left "-1.75rem"
                :bottom " -0.125rem"}
        :on-click (fn []
                    (create-new-block! block property opts))}
       (ui/tippy {:html [:span.text-sm
                         [:span.mr-1 "Add another block (click or "]
                         (ui/render-keyboard-shortcut "mod+enter")
                         [:span.ml-1 ")"]]
                  :interactive     true
                  :delay           [100, 100]
                  :position        "bottom"}
                 [:a.add-button-link.flex.p-2
                  (ui/icon "circle-plus")])])))

(rum/defc delete-value-button < rum/reactive
  [entity property item]
  (let [editing? (state/sub :editor/editing?)]
    (when-not (or editing? config/publishing?)
      [:a.close.fade-in
       {:class "absolute top-0 right-0"
        :title "Delete this value"
        :on-mouse-down
        (fn []
          (property-handler/delete-property-value! (state/get-current-repo)
                                                   entity
                                                   (:block/uuid property)
                                                   item))}
       (ui/icon "x")])))

(rum/defcs item-with-close < rum/static rum/reactive
  (rum/local false ::show-close?)
  [state entity property item {:keys [editor-id row? show-close-button? *add-new-item?]
                               :or {show-close-button? true}
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
     (when (and @*show-close?
                (not editing?)
                show-close-button?
                (not @*add-new-item?))
       (delete-value-button entity property item))]))

(rum/defcs multiple-values <
  (rum/local false ::add-new-item?)
  (rum/local false ::show-add?)
  [state block property v opts dom-id schema editor-id editor-args]
  (let [*show-add? (::show-add? state)
        *add-new-item? (::add-new-item? state)
        type (:type schema)
        block? (= type :block)
        default? (= type :default)
        row? (contains? #{:page :object} type)
        items (if (coll? v) v (when v [v]))]
    [:div.relative
     {:class (cond
               row?
               (cond-> "flex flex-1 flex-row items-center flex-wrap"
                 row?
                 (str " gap-2"))
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
           (item-with-close block property item
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
                                :idx (count items)
                                :dom-id dom-id
                                :editing? true
                                :*add-new-item? *add-new-item?}))

       (and (or default? block?) (empty? items))
       [:div.rounded-sm {:on-click (fn [] (reset! *add-new-item? true))}
        [:div.opacity-50.text-sm "Input something"]]

       (and (or @*show-add? (empty? items)) row? (not config/publishing?))
       [:a.add-button-link.flex
        {:on-click (fn [] (reset! *add-new-item? true))}
        (ui/icon "circle-plus")]

       (and @*show-add? block? (not config/publishing?))
       (multiple-blocks-add-button block property opts))]))

(rum/defc property-value < rum/reactive
  [block property v opts]
  (let [dom-id (str "ls-property-" (:blocks-container-id opts) "-" (:db/id property))
        editor-id (str dom-id "-editor")
        schema (:block/schema property)
        type (:type schema)
        multiple-values? (= :many (:cardinality schema))
        editor-args {:block property
                     :parent-block block
                     :format :markdown}]
    (cond
      (and (= type :block) (or (string/blank? v) (empty? v)))
      (empty-block (fn [e]
                     (util/stop e)
                     (create-new-block! block property {})))

      multiple-values?
      (multiple-values block property v opts dom-id schema editor-id editor-args)

      (contains? #{:page :object} type)
      [:div.flex.flex-1.items-center.property-value-content
       (item-with-close block property v
                        (merge
                         opts
                         {:editor-args editor-args
                          :editor-id editor-id
                          :dom-id dom-id
                          :row? true
                          :*add-new-item? (atom nil)
                          :show-close-button? (not (string/blank? v))}))]

      :else
      [:div.flex.flex-1.items-center.property-value-content
       (property-scalar-value block property v
                              (merge
                               opts
                               {:editor-args editor-args
                                :editor-id editor-id
                                :dom-id dom-id}))])))
