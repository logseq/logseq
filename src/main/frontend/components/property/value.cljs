(ns frontend.components.property.value
  (:require [cljs-time.coerce :as tc]
            [clojure.string :as string]
            [frontend.components.select :as select]
            [frontend.components.icon :as icon-component]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as model]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [lambdaisland.glogi :as log]
            [rum.core :as rum]
            [frontend.handler.route :as route-handler]
            [frontend.handler.property.util :as pu]))

(defn- select-type?
  [property type]
  (or (contains? #{:page :number :url :date} type)
      ;; closed values
      (seq (get-in property [:block/schema :values]))))

(defn exit-edit-property
  ([]
   (exit-edit-property true))
  ([property-configure-check?]
   (when (or (and property-configure-check? (not (:editor/property-configure? @state/state)))
             (not property-configure-check?))
     (property-handler/set-editing-new-property! nil)
     (state/clear-edit!))))

(defn set-editing!
  [property editor-id dom-id v opts]
  (let [v (str v)
        cursor-range (if dom-id
                       (some-> (gdom/getElement dom-id) util/caret-range)
                       "")]
    (state/set-editing! editor-id v property cursor-range opts)))

(defn add-property!
  "If a class and in a class schema context, add the property to its schema.
  Otherwise, add a block's property and its value"
  ([block property-key property-value] (add-property! block property-key property-value {}))
  ([block property-key property-value {:keys [exit-edit? class-schema?]
                                       :or {exit-edit? true}}]
   (let [repo (state/get-current-repo)
         class? (contains? (:block/type block) "class")]
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
  [value {:keys [multiple-values? on-change] :as opts}]
  (let [title (when (uuid? value)
                (:block/original-name (db/entity [:block/uuid value])))
        value (if title
                (js/Date. (date/journal-title->long title))
                value)
        value' (when-not (string/blank? value)
                 (try
                   (tc/to-local-date value)
                   (catch :default e
                     (js/console.error e))))]
    (ui/dropdown
     (fn [{:keys [toggle-fn]}]
       [:a.flex
        {:tabIndex "0"
         ;; meta-click or just click in publishing to navigate to date's page
         :on-click (if config/publishing? #(navigate-to-date-page value) toggle-fn)
         :on-mouse-down (fn [e]
                          (.preventDefault e)
                          (when (util/meta-key? e)
                            (navigate-to-date-page value)))
         :on-key-down (fn [e]
                        (when (= (util/ekey e) "Enter")
                          toggle-fn))}
        [:span.inline-flex.items-center
         (when title
           (when-not multiple-values? [:span.mr-1 title]))
         (when-not title (ui/icon "calendar" {:size 15}))]])
     (fn [{:keys [toggle-fn]}]
       (ui/datepicker value' {:on-change (fn [_e date]
                                           (let [journal (date/js-date->journal-title date)]
                                             (when-not (db/entity [:block/name (util/page-name-sanity-lc journal)])
                                               (page-handler/create! journal {:redirect? false
                                                                              :create-first-block? false}))
                                             (when (fn? on-change)
                                               (on-change (db/entity [:block/name (util/page-name-sanity-lc journal)])))
                                             (exit-edit-property)
                                             (toggle-fn)
                                             (when-let [toggle (:toggle-fn opts)]
                                               (toggle))))}))
     {:modal-class (util/hiccup->class
                    "origin-top-right.absolute.left-0.rounded-md.shadow-lg.mt-2")})))


(rum/defc property-value-date-picker
  [block property value opts]
  (let [multiple-values? (= :many (:cardinality (:block/schema property)))]
    (date-picker value
                 (merge opts
                        {:multiple-values? multiple-values?
                         :on-change (fn [page]
                                      (let [repo (state/get-current-repo)]
                                        (property-handler/set-block-property! repo (:block/uuid block)
                                                                              (:block/name property)
                                                                              (:block/uuid page))
                                        (exit-edit-property)))}))))

(defn- create-page-if-not-exists!
  [property classes page]
  (let [page* (string/trim page)
        [_ page inline-class] (or (seq (map string/trim (re-find #"(.*)#(.*)$" page*)))
                                  [nil page* nil])
        id (pu/get-page-uuid page)
        class? (= (:block/name property) "tags")]
    (when (nil? id)
      (let [inline-class-uuid
            (when inline-class
              (or (pu/get-page-uuid inline-class)
                  (do (log/error :msg "Given inline class does not exist" :inline-class inline-class)
                      nil)))]
        (page-handler/create! page {:redirect? false
                                    :create-first-block? false
                                    :tags (if inline-class-uuid
                                            [inline-class-uuid]
                                            ;; Only 1st class b/c page normally has
                                            ;; one of and not all these classes
                                            (take 1 classes))
                                    :class? class?})))
    [page id]))

(defn- select-aux
  [block property {:keys [items selected-choices multiple-choices?] :as opts}]
  (let [selected-choices (remove nil? selected-choices)
        clear-value (str "No " (:block/original-name property))
        items' (if (and (seq selected-choices) (not multiple-choices?))
                 (cons {:value clear-value
                        :label clear-value}
                       items)
                 items)
        k (if multiple-choices? :on-apply :on-chosen)
        f (get opts k)
        f' (fn [chosen]
             (if (or (and (not multiple-choices?) (= chosen clear-value))
                     (and multiple-choices? (= chosen [clear-value])))
               (property-handler/remove-block-property! (state/get-current-repo) (:block/uuid block)
                                                        (:block/original-name property))
               (f chosen)))]
    (select/select (assoc opts
                          :items items'
                          k f'))))

(defn select-page
  [property
   {:keys [block classes multiple-choices? dropdown? input-opts on-chosen] :as opts}]
  (let [repo (state/get-current-repo)
        tags? (= "tags" (:block/name property))
        alias? (= "alias" (:block/name property))
        tags-or-alias? (or tags? alias?)
        selected-choices (when block
                           (->>
                            (if tags-or-alias?
                              (->> (if (= "tags" (:block/name property))
                                     (:block/tags block)
                                     (:block/alias block))
                                   (map (fn [e] (:block/original-name e))))
                              (when-let [v (get-in block [:block/properties (:block/uuid property)])]
                                (if (coll? v)
                                  (map (fn [id]
                                         (:block/original-name (db/entity [:block/uuid id])))
                                       v)
                                  [(:block/original-name (db/entity [:block/uuid v]))])))
                            (remove nil?)))
        closed-values (seq (get-in property [:block/schema :values]))
        pages (->>
               (cond
                 (seq classes)
                 (mapcat
                  (fn [class]
                    (if (= :logseq.class class)
                      (map first (model/get-all-classes repo))
                      (some->> (:db/id (db/entity [:block/uuid class]))
                               (model/get-class-objects repo)
                               (map #(:block/original-name (db/entity %))))))
                  classes)

                 (and block closed-values)
                 (map (fn [id] (:block/original-name (db/entity [:block/uuid id]))) closed-values)

                 :else
                 (model/get-all-page-original-names repo))
               distinct)
        options (map (fn [p] {:value p}) pages)
        opts' (cond->
               (merge
                opts
                {:multiple-choices? multiple-choices?
                 :items options
                 :selected-choices selected-choices
                 :dropdown? dropdown?
                 :input-default-placeholder (cond
                                              tags?
                                              "Set tags"
                                              alias?
                                              "Set alias"
                                              multiple-choices?
                                              "Choose pages"
                                              :else
                                              "Choose page")
                 :show-new-when-not-exact-match? (not (and block closed-values))
                 :extract-chosen-fn :value
                 ;; Provides additional completion for inline classes on new pages
                 :transform-fn (fn [results input]
                                 (if-let [[_ new-page class-input] (and (empty? results) (re-find #"(.*)#(.*)$" input))]
                                   (let [repo (state/get-current-repo)
                                         class-names (map #(:block/original-name (db/entity repo [:block/uuid %])) classes)
                                         descendent-classes (->> class-names
                                                                 (mapcat #(db/get-namespace-pages repo %))
                                                                 (map :block/original-name))]
                                     (->> (concat class-names descendent-classes)
                                          (filter #(string/includes? % class-input))
                                          (mapv #(hash-map :value (str new-page "#" %)))))
                                   results))
                 :input-opts input-opts})
                multiple-choices?
                (assoc :on-apply (fn [choices]
                                   (let [pages (->> choices
                                                    (map #(create-page-if-not-exists! property classes %))
                                                    (map first))
                                         values (set (map #(pu/get-page-uuid repo %) pages))]
                                     (when on-chosen (on-chosen values)))))
                (not multiple-choices?)
                (assoc :on-chosen (fn [chosen]
                                    (let [page* (string/trim (if (string? chosen) chosen (:value chosen)))]
                                      (when-not (string/blank? page*)
                                        (let [[page id] (create-page-if-not-exists! property classes page*)
                                              id' (or id (pu/get-page-uuid repo page))]
                                          (when on-chosen (on-chosen id'))))))))]
    (select-aux block property opts')))

(defn property-value-select-page
  [block property
   {:keys [on-chosen] :as opts}
   {:keys [*show-new-property-config?]}]
  (let [input-opts (fn [_]
                     {:on-blur (fn []
                                 (exit-edit-property))
                      :on-click (fn []
                                  (when *show-new-property-config?
                                    (reset! *show-new-property-config? false)))
                      :on-key-down
                      (fn [e]
                        (case (util/ekey e)
                          "Escape"
                          (do
                            (exit-edit-property)
                            (when-let [f (:on-chosen opts)] (f)))
                          nil))})
        opts' (assoc opts
                     :block block
                     :input-opts input-opts
                     :on-chosen (fn [values]
                                  (add-property! block (:block/original-name property) values)
                                  (when on-chosen (on-chosen))))]
    (select-page property opts')))

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
  (let [new-value (util/evalue e)]
    (when (not (state/get-editor-action))
      (util/stop e)
      (when (not= new-value value)
        (property-handler/set-block-property! repo (:block/uuid block)
                                              (:block/original-name property)
                                              (string/trim new-value)))
      (when (= js/document.activeElement (gdom/getElement editor-id))
        (exit-edit-property false)))))

(defn create-new-block!
  [block property value]
  (let [repo (state/get-current-repo)
        {:keys [page blocks]} (property-handler/property-create-new-block block property value editor-handler/wrap-parse-block)
        last-block-id (:block/uuid (last blocks))]
    (db/transact! repo (if page (cons page blocks) blocks) {:outliner-op :insert-blocks})
    (add-property! block (:block/original-name property)
                   (:block/uuid (first blocks)))
    (editor-handler/edit-block! (db/entity [:block/uuid last-block-id]) :max last-block-id)))

(defn create-new-block-from-template!
  "`template`: tag block"
  [block property template]
  (let [repo (state/get-current-repo)
        {:keys [page blocks]} (property-handler/property-create-new-block-from-template block property template)]
    (db/transact! repo (if page (cons page blocks) blocks) {:outliner-op :insert-blocks})
    (add-property! block (:block/original-name property) (:block/uuid (last blocks)))
    (last blocks)))

(defn- new-text-editor-opts
  [repo block property value editor-id]
  {:style {:padding 0
           :background "none"}
   :on-blur
   (fn [e]
     (when-not (:editor/mouse-down-from-property-configure? @state/state)
       (save-text! repo block property value editor-id e)))
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
           (or esc?
               (and enter? new-property?)
               (and enter? (util/tag? new-value)))
           (save-text! repo block property value editor-id e)

           enter?
           (create-new-block! block property new-value)

           :else
           nil))))})

(rum/defc select < rum/reactive
  [block property
   {:keys [multiple-choices? dropdown?] :as opts}
   {:keys [*show-new-property-config?]}]
  (let [schema (:block/schema property)
        property (db/sub-block (:db/id property))
        type (:type schema)
        closed-values? (seq (:values schema))
        items (if closed-values?
                (keep (fn [id]
                        (when-let [block (when id (db/entity [:block/uuid id]))]
                          (let [icon (pu/get-property block :icon)
                                value (or (:block/original-name block)
                                          (get-in block [:block/schema :value]))]
                            {:label (if icon
                                      [:div.flex.flex-row.gap-2
                                       (icon-component/icon icon)
                                       value]
                                      value)
                             :value id}))) (:values schema))
                (->> (model/get-block-property-values (:block/uuid property))
                     (mapcat (fn [[_id value]]
                               (if (coll? value)
                                 (map (fn [v] {:value v}) value)
                                 [{:value value}])))
                     (distinct)))
        items (->> (if (= :date type)
                     (map (fn [m] (let [label (:block/original-name (db/entity [:block/uuid (:value m)]))]
                                    (when label
                                      (assoc m :label label)))) items)
                     items)
                   (remove nil?))
        add-property-f #(add-property! block (:block/original-name property) %)
        on-chosen (fn [chosen]
                    (add-property-f (if (map? chosen) (:value chosen) chosen))
                    (when-let [f (:on-chosen opts)] (f)))
        selected-choices' (get-in block [:block/properties (:block/uuid property)])
        selected-choices (if (coll? selected-choices') selected-choices' [selected-choices'])]
    (select-aux block property
                (cond->
                 {:multiple-choices? multiple-choices?
                  :items items
                  :selected-choices selected-choices
                  :dropdown? dropdown?
                  :show-new-when-not-exact-match? (not closed-values?)
                  :input-default-placeholder "Select"
                  :extract-chosen-fn :value
                  :input-opts (fn [_]
                                {:on-blur (fn []
                                            (exit-edit-property)
                                            (when-let [f (:on-chosen opts)] (f)))
                                 :on-click (fn []
                                             (when *show-new-property-config?
                                               (reset! *show-new-property-config? false)))
                                 :on-key-down
                                 (fn [e]
                                   (case (util/ekey e)
                                     "Escape"
                                     (do
                                       (exit-edit-property)
                                       (when-let [f (:on-chosen opts)] (f)))
                                     nil))})}
                  closed-values?
                  (assoc :extract-fn :label)
                  multiple-choices?
                  (assoc :on-apply on-chosen)
                  (not multiple-choices?)
                  (assoc :on-chosen on-chosen)))))

(rum/defc property-normal-block-value < rum/reactive
  [value block-cp editor-box]
  (let [parent (db/entity [:block/uuid value])
        parent (db/sub-block (:db/id parent))
        children (model/sort-by-left (:block/_parent parent) parent)]
    (when (seq children)
      [:div.property-block-container.w-full
       (block-cp children {:id (str (:block/uuid parent))
                           :editor-box editor-box
                           :in-property? true})])))

(rum/defc property-template-value < rum/reactive
  [config value opts]
  (let [e (db/entity [:block/uuid value])
        entity (db/sub-block (:db/id e))
        properties-cp (:properties-cp opts)]
    (when (and entity properties-cp)
      [:div.property-block-container.w-full.property-template
       (properties-cp config entity (:editor-id config) (merge opts {:in-block-container? true}))])))

(rum/defc property-block-value < rum/reactive
  [value block property block-cp editor-box opts page-cp editor-id]
  (let [v-block (db/entity [:block/uuid value])
        class? (contains? (:block/type v-block) "class")
        invalid-warning [:div.warning.text-sm
                         "Invalid block value, please delete the current property."]]
    (if v-block
      (cond
        (:block/page v-block)
        (property-normal-block-value value block-cp editor-box)

        (and class? (seq (:properties (:block/schema v-block))))
        (let [template-instance-block (create-new-block-from-template! block property v-block)]
          (property-template-value {:editor-id editor-id}
                                   (:block/uuid template-instance-block)
                                   opts))

        ;; page/class/etc.
        (:block/name v-block)
        (page-cp {:disable-preview? true
                  :hide-close-button? true
                  :tag? class?} v-block)
        :else
        invalid-warning)
      invalid-warning)))

(rum/defc select-item
  [property type value {:keys [page-cp inline-text]}]
  (let [closed-values? (seq (get-in property [:block/schema :values]))]
    (cond
      (contains? #{:page :date} type)
      (when-let [page (db/entity [:block/uuid value])]
        (page-cp {:disable-preview? true
                  :hide-close-button? true} page))

      closed-values?
      (when-let [block (when value (db/entity [:block/uuid value]))]
        (let [value' (get-in block [:block/schema :value])
              icon (pu/get-property block :icon)]
          (cond
            (:block/name block)
            (page-cp {:disable-preview? true
                      :hide-close-button? true} block)

            icon
            (icon-component/icon icon)

            (= type :number)
            [:span.number (str value')]

            (= type :url)
            (inline-text {} :markdown (str value'))

            :else
            value')))

      (= type :number)
      [:span.number (str value)]

      :else
      (inline-text {} :markdown (str value)))))

(rum/defc single-value-select
  [block property value value-f select-opts {:keys [editing?] :as opts}]
  (let [schema (:block/schema property)
        type (get schema :type :default)
        select-opts' (cond-> (assoc select-opts
                                    :multiple-choices? false
                                    :dropdown? (if editing? true false))
                       (= type :page)
                       (assoc :classes (:classes schema)))
        select-f (fn []
                   [:div.property-select (cond-> {} editing? (assoc :class "h-6"))
                    (case type
                      (:number :url :date :default)
                      (select block property select-opts' opts)

                      :page
                      (property-value-select-page block property select-opts' opts))])
        dropdown-opts {:modal-class (util/hiccup->class
                                     "origin-top-right.absolute.left-0.rounded-md.shadow-lg.mt-2")
                       :initial-open? editing?}]
    (if editing?
      (select-f)
      (ui/dropdown
       (fn [{:keys [toggle-fn]}]
         [:a.control-link
          {:on-mouse-down (if config/publishing?
                            (constantly nil)
                            toggle-fn)
           :class "flex flex-1"}
          (if (and (string/blank? value) (not editing?))
            [:div.opacity-50.pointer.text-sm "Empty"]
            (value-f))])
       select-f
       dropdown-opts))))

(rum/defcs property-scalar-value < rum/reactive db-mixins/query
  (rum/local nil ::ref)
  [state block property value {:keys [inline-text block-cp page-cp
                                      editor-id dom-id row?
                                      editor-box editor-args editing?
                                      on-chosen]
                               :as opts}]
  (let [*ref (::ref state)
        property (model/sub-block (:db/id property))
        repo (state/get-current-repo)
        schema (:block/schema property)
        type (get schema :type :default)
        multiple-values? (= :many (:cardinality schema))
        editor-id (or editor-id (str "ls-property-" (:db/id block) "-" (:db/id property)))
        editing? (or editing? (and @*ref (state/sub-editing? @*ref)))
        select-type? (select-type? property type)
        closed-values? (seq (:values schema))
        select-opts {:on-chosen on-chosen}]
    (if (and select-type?
             (not (and (not closed-values?) (= type :date))))
      (single-value-select block property value
                           (fn []
                             (select-item property type value opts))
                           select-opts
                           opts)
      (case type
        :date
        (property-value-date-picker block property value nil)

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
        [:div.flex.flex-1 {:ref #(when-not @*ref (reset! *ref %))}
         (if editing?
           [:div.flex.flex-1
            (case type
              :template
              (let [id (first (:classes schema))
                    template (when id (db/entity [:block/uuid id]))]
                (when template
                  (create-new-block-from-template! block property template)))

              (let [config {:editor-opts (new-text-editor-opts repo block property value editor-id)}]
                [:div
                 (editor-box editor-args editor-id (cond-> config
                                                     multiple-values?
                                                     (assoc :property-value value)))]))]
           (let [class (str (when-not row? "flex flex-1 ")
                            (when multiple-values? "property-value-content"))]
             [:div.cursor-text
              {:id (or dom-id (random-uuid))
               :class class
               :style {:min-height 24}
               :on-click (fn []
                           (when (and (= type :default) (not (uuid? value)))
                             (set-editing! property editor-id dom-id value {:ref @*ref})))}
              (let [type (or (when (and (= type :default) (uuid? value)) :block)
                             type
                             :default)
                    type (if (= :block type)
                           (let [v-block (db/entity [:block/uuid value])]
                             (if (get-in v-block [:block/metadata :created-from-template])
                               :template
                               type))
                           type)]
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
                    [:div.opacity-50.pointer.text-sm "Empty"])
                  (case type
                    :template
                    (property-template-value {:editor-id editor-id}
                                             value
                                             opts)

                    :block
                    (property-block-value value block property block-cp editor-box opts page-cp editor-id)

                    (inline-text {} :markdown (str value)))))]))]))))

(rum/defc multiple-values < rum/reactive
  [block property v {:keys [on-chosen dropdown? editing?]
                     :or {dropdown? true}
                     :as opts} schema]
  (let [type (get schema :type :default)
        date? (= type :date)
        items (if (coll? v) v (when v [v]))
        values-cp (fn [toggle-fn]
                    (if (seq items)
                      (concat
                       (for [item items]
                         (select-item property type item opts))
                       (when date?
                         [(property-value-date-picker block property nil {:toggle-fn toggle-fn})]))
                      (when-not editing? [:div.opacity-50.pointer.text-sm "Empty"])))
        select-cp (fn []
                    (let [select-opts {:multiple-choices? true
                                       :dropdown? editing?
                                       :on-chosen (fn []
                                                    (when on-chosen (on-chosen)))}]
                      [:div.property-select (cond-> {} editing? (assoc :class "h-6"))
                       (if (= :page type)
                         (property-value-select-page block property
                                                     (assoc select-opts
                                                            :classes (:classes schema))
                                                     opts)
                         (select block property select-opts opts))]))]
    (if (and dropdown? (not editing?))
      (ui/dropdown
       (fn [{:keys [toggle-fn]}]
         [:a.control-link
          {:on-mouse-down (if config/publishing?
                            (constantly nil)
                            toggle-fn)
           :class "flex flex-1 flex-row items-center flex-wrap gap-x-4 gap-y-2 pr-4"}
          (values-cp toggle-fn)])
       (fn [{:keys [_toggle-fn]}]
         (select-cp))
       {:modal-class (util/hiccup->class
                      "origin-top-right.absolute.left-0.rounded-md.shadow-lg.mt-2")
        :initial-open? editing?})
      (select-cp))))

(rum/defc property-value < rum/reactive
  [block property v opts]
  (ui/catch-error
   (ui/block-error "Something wrong" {})
   (let [dom-id (str "ls-property-" (:db/id block) "-" (:db/id property))
         editor-id (str dom-id "-editor")
         schema (:block/schema property)
         multiple-values? (= :many (:cardinality schema))
         editor-args {:block property
                      :parent-block block
                      :format :markdown}]
     (cond
       multiple-values?
       (multiple-values block property v opts schema)

       :else
       (property-scalar-value block property v
                              (merge
                               opts
                               {:editor-args editor-args
                                :editor-id editor-id
                                :dom-id dom-id}))))))
