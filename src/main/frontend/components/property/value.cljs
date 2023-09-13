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
            [rum.core :as rum]
            [frontend.handler.route :as route-handler]))

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

(defn- navigate-to-date-page
  [value]
  (when value
    (route-handler/redirect-to-page! (date/js-date->journal-title value))))

(rum/defc date-picker
  [block property value *add-new-item?]
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
         ;; meta-click or just click in publishing to navigate to date's page
         :on-click (if config/publishing? #(navigate-to-date-page value) toggle-fn)
         :on-mouse-down (fn [e]
                          (when (util/meta-key? e)
                            (navigate-to-date-page value)))
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
                                             (reset! *add-new-item? false)
                                             (exit-edit-property)
                                             (toggle-fn)))}))
     {:modal-class (util/hiccup->class
                    "origin-top-right.absolute.left-0.rounded-md.shadow-lg.mt-2")
      :initial-open? (when *add-new-item? @*add-new-item?)})))

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
        opts {:items options
              :dropdown? true
              :input-default-placeholder (if multiple-values?
                                           "Choose pages"
                                           "Choose page")
              :on-chosen (fn [chosen]
                           (let [page (string/trim (if (string? chosen) chosen (:value chosen)))
                                 id (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc page)]))
                                 class? (= (:block/name property) "tags")]
                             (when (nil? id)
                               (page-handler/create! page {:redirect? false
                                                           :create-first-block? false
                                                           ;; TODO: Allow users to choose a preferred class
                                                           ;; when a property supports multiple classes
                                                           ;; Only 1 class because properties normally have one of these classes,
                                                           ;; not all these classes
                                                           :tags (take 1 classes)
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

;; (defn- move-cursor
;;   [up? opts]
;;   (let [f (if up? dec inc)
;;         id (str (:parent-dom-id opts) "-" (f (:idx opts)))
;;         editor-id (str (:parent-dom-id opts) "-editor" "-" (f (:idx opts)))
;;         sibling (gdom/getElement id)
;;         editor (gdom/getElement editor-id)]
;;     (when sibling
;;       (.click sibling)
;;       (state/set-state! :editor/property-triggered-by-click? {editor-id true}))
;;     (when editor
;;       (.focus editor))))

(defn- save-text!
  [repo block property value editor-id e]
  (let [new-value (util/evalue e)
        blank? (string/blank? new-value)]
    (when (not (state/get-editor-action))
      (util/stop e)
      (when-not blank?
        (when (not= (string/trim new-value) (and value (string/trim value)))
          (property-handler/set-block-property! repo (:block/uuid block)
                                                (:block/original-name property)
                                                new-value
                                                :old-value value)))
      (when (= js/document.activeElement (gdom/getElement editor-id))
        (exit-edit-property)))))

(defn create-new-block!
  [block property value]
  (let [repo (state/get-current-repo)
        pid (:block/uuid (db/entity [:block/name "created-in-property"]))
        page-id (or (:db/id (:block/page block)) (:db/id block))
        parent-id (db/new-block-id)
        parent (-> {:block/uuid parent-id
                    :block/format :markdown
                    :block/content ""
                    :block/page {:db/id page-id}
                    :block/properties {pid true}}
                   outliner-core/block-with-timestamps)
        child-1-id (db/new-block-id)
        child-1 (-> {:block/uuid child-1-id
                     :block/format :markdown
                     :block/content value
                     :block/page {:db/id page-id}
                     :block/parent [:block/uuid parent-id]
                     :block/left [:block/uuid parent-id]
                     :block/properties {pid true}}
                    outliner-core/block-with-timestamps
                    (editor-handler/wrap-parse-block))
        child-2-id (db/new-block-id)
        child-2 (-> {:block/uuid child-2-id
                     :block/format :markdown
                     :block/content ""
                     :block/page {:db/id page-id}
                     :block/parent [:block/uuid parent-id]
                     :block/left [:block/uuid child-1-id]
                     :block/properties {pid true}}
                    outliner-core/block-with-timestamps)
        tx-data [parent child-1 child-2]]
    (db/transact! repo tx-data {:outliner-op :insert-blocks})
    (add-property! block (:block/original-name property) parent-id)
    (editor-handler/edit-block! (db/entity [:block/uuid child-2-id]) 0 child-2-id)))

(defn create-new-block-from-template!
  [block property template]
  (let [repo (state/get-current-repo)
        pid (:block/uuid (db/entity [:block/name "created-in-property"]))
        page-id (or (:db/id (:block/page block)) (:db/id block))
        block-id (db/new-block-id)
        value-block (-> {:block/uuid block-id
                         :block/format :markdown
                         :block/content ""
                         :block/tags #{(:db/id template)}
                         :block/page {:db/id page-id}
                         :block/properties {pid true}}
                        outliner-core/block-with-timestamps)
        tx-data [value-block]]
    (db/transact! repo tx-data {:outliner-op :insert-blocks})
    (add-property! block (:block/original-name property) block-id)))

(defn- new-text-editor-opts
  [repo block property value editor-id]
  {:style {:padding 0
           :background "none"}
   :on-blur
   (fn [e]
     (save-text! repo block property value editor-id e))
   :on-key-down
   (fn [e]
     (let [enter? (= (util/ekey e) "Enter")
           esc? (= (util/ekey e) "Escape")
           backspace? (= (util/ekey e) "Backspace")
           new-value (util/evalue e)
           new-property? (some? (:ui/new-property-input-id @state/state))]
       (when (and (or enter? esc? backspace?)
                  (not (state/get-editor-action)))
         (when-not backspace? (util/stop e))
         (cond
           esc?
           (save-text! repo block property value editor-id e)

           (and enter? new-property?)
           (save-text! repo block property value editor-id e)

           enter?
           (create-new-block! block property new-value)

           :else
           nil))))})

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
                                       nil))})})))

(rum/defc property-block-value < rum/reactive
  [repo block property value block-cp editor-box opts]
  (let [parent (db/entity [:block/uuid value])
        parent (db/sub-block (:db/id parent))
        children (:block/_parent parent)
        children-count (count (:block/_parent parent))
        empty-block? (or (nil? parent) (zero? children-count))]
    (when empty-block?
      (when parent
        (db/transact! repo [[:db/retractEntity (:db/id parent)]]))
      (property-handler/delete-property-value! repo block (:block/uuid property) value))
    (when (seq children)
      [:div.property-block-container.w-full
       (block-cp children {:id (str (:block/uuid parent))
                           :blocks-container-id (:blocks-container-id opts)
                           :editor-box editor-box
                           :in-property? true})])))

(rum/defc property-template-value < rum/reactive
  [config value opts]
  (let [e (db/entity [:block/uuid value])
        entity (db/sub-block (:db/id e))
        properties-cp (:properties-cp opts)]
    (when (and entity properties-cp)
      [:div.property-block-container.w-full
       (properties-cp config entity (:editor-id config) (merge opts {:in-block-container? true}))])))

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
        type (get schema :type :default)
        multiple-values? (= :many (:cardinality schema))
        editor-id (or editor-id (str "ls-property-" blocks-container-id "-" (:db/id block) "-" (:db/id property)))
        editing? (or editing? (state/sub-editing? editor-id))
        select-opts {:on-chosen (fn []
                                  ;; (when *configure-show? (reset! *configure-show? false))
                                  (when *add-new-item? (reset! *add-new-item? false)))}]
    (case type
      :date
      (date-picker block property value *add-new-item?)

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
           [:div.h-6 (select-page block property (assoc select-opts
                                                        :classes (:classes schema)
                                                        :multiple? multiple-values?))]

           (let [config {:editor-opts (new-text-editor-opts repo block property value editor-id)}]
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
                             (let [ref? (contains? #{:page} type)]
                               (when (or (not ref?)
                                         (and (string/blank? value) ref?))
                                 (when-not (and (contains? #{:default :template} type) (uuid? value)) ; block
                                   (set-editing! property editor-id dom-id value)))))}
           (let [type (or
                       (if (and (= type :default) (uuid? value))
                         (if-let [e (db/entity [:block/uuid value])]
                           (if (:block/name e) :page :block)
                           :block)
                         type)
                       :default)]
             (if (string/blank? value)
               (if (= :template type)
                 (let [id (first (:classes schema))
                       template (when id (db/entity [:block/uuid id]))]
                   (when template
                     [:a.fade-link.pointer.text-sm
                      {:on-click (fn [e]
                                   (util/stop e)
                                   (create-new-block-from-template! block property template))}
                      (str "Use template #" (:block/original-name template))]))
                 [:div.opacity-50.pointer.text-sm
                  (case type
                    :page
                    (if multiple-values? "Choose pages" "Choose page")

                    "Empty")])
               (case type
                 :page
                 (when-let [page (db/entity [:block/uuid value])]
                   (page-cp {:disable-preview? true} page))

                 :template
                 (property-template-value {:blocks-container-id blocks-container-id
                                           :editor-id editor-id}
                                          value
                                          opts)

                 :block
                 (property-block-value repo block property value block-cp editor-box opts)

                 (inline-text {} :markdown (str value)))))])))))

(rum/defc delete-value-button < rum/reactive
  [entity property item]
  (let [editing? (state/sub :editor/editing)]
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
        editing? (state/sub-editing? editor-id)]
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
        type (get schema :type :default)
        row? (contains? #{:page :date :number :url} type)
        items (if (coll? v) v (when v [v]))]
    [:div.relative
     {:class (cond
               row?
               (cond-> "flex flex-1 flex-row items-center flex-wrap"
                 row?
                 (str " gap-2"))
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

       (empty? items)
       [:div.opacity-50.pointer.text-sm {:on-click #(reset! *add-new-item? true)}
        "Empty"]

       (and @*show-add? row? (not config/publishing?))
       [:a.add-button-link.flex {:on-click #(reset! *add-new-item? true)}
        (ui/icon "circle-plus")])]))

(rum/defc property-value < rum/reactive
  [block property v opts]
  (let [dom-id (str "ls-property-" (:blocks-container-id opts) "-" (:db/id block) "-" (:db/id property))
        editor-id (str dom-id "-editor")
        schema (:block/schema property)
        type (get schema :type :default)
        multiple-values? (= :many (:cardinality schema))
        editor-args {:block property
                     :parent-block block
                     :format :markdown}]
    (cond
      multiple-values?
      (multiple-values block property v opts dom-id schema editor-id editor-args)

      (contains? #{:page} type)
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
