(ns frontend.components.property.value
  (:require [clojure.string :as string]
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
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.ui :as shui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [lambdaisland.glogi :as log]
            [rum.core :as rum]
            [frontend.handler.route :as route-handler]
            [promesa.core :as p]
            [frontend.db.async :as db-async]
            [logseq.common.util.macro :as macro-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [datascript.impl.entity :as de]
            [frontend.handler.property.util :as pu]))

(defn- select-type?
  [property type]
  (or (contains? #{:page :number :url :date} type)
      ;; closed values
      (seq (get-in property [:block/schema :values]))))

(defn exit-edit-property
  []
  (state/set-state! :editor/new-property-key nil)
  (state/set-state! :editor/new-property-input-id nil)
  (state/set-state! :editor/properties nil)
  (state/set-state! :editor/editing-property-value-id {})
  (state/clear-edit!))

(defn set-editing!
  [property editor-id dom-id v opts]
  (let [v (str v)
        cursor-range (if dom-id
                       (some-> (gdom/getElement dom-id) util/caret-range)
                       "")]
    (state/set-editing! editor-id v property cursor-range opts)))

(defn <add-property!
  "If a class and in a class schema context, add the property to its schema.
  Otherwise, add a block's property and its value"
  ([block property-key property-value] (<add-property! block property-key property-value {}))
  ([block property-key property-value {:keys [exit-edit? class-schema?]
                                       :or {exit-edit? true}}]
   (let [repo (state/get-current-repo)
         class? (contains? (:block/type block) "class")]
     (p/do!
      (when property-key
        (if (and class? class-schema?)
          (db-property-handler/class-add-property! repo (:block/uuid block) property-key)
          (property-handler/set-block-property! repo (:block/uuid block) property-key property-value)))
      (when exit-edit?
        (shui/popup-hide!)
        (exit-edit-property))))))

(defn- navigate-to-date-page
  [value]
  (when value
    (route-handler/redirect-to-page! (date/js-date->journal-title value))))

(rum/defc date-picker
  [value {:keys [on-change editing? multiple-values?]}]
  (let [*trigger-ref (rum/use-ref nil)
        page value
        title (when page (:block/original-name page))
        value' (when title
                 (js/Date. (date/journal-title->long title)))
        initial-day (some-> value' (.getTime) (js/Date.))
        initial-month (when value'
                        (js/Date. (.getFullYear value') (.getMonth value')))]

    (rum/use-effect!
     (fn []
       (when editing?
         (some-> (rum/deref *trigger-ref)
                 (.focus))))
     [])
    [:div.flex.flex-row.gap-1.items-center
     (when page
       (when-let [page-cp (state/get-component :block/page-cp)]
         (page-cp {:disable-preview? true
                   :hide-close-button? true} page)))

     (let [content-fn
           (fn [{:keys [id]}]
             (let [select-handler!
                   (fn [^js d]
                     ;; force local to UTC
                     (when d
                       (let [gd (goog.date.Date. (.getFullYear d) (.getMonth d) (.getDate d))]
                         (let [journal (date/js-date->journal-title gd)]
                           (p/do!
                            (shui/popup-hide! id)
                            (when-not (db/get-page journal)
                              (page-handler/<create! journal {:redirect? false
                                                              :create-first-block? false}))
                            (when (fn? on-change)
                              (on-change (db/get-page journal)))
                            (exit-edit-property))))))]
               (shui/calendar
                (cond->
                 {:mode "single"
                  :initial-focus true
                  :selected initial-day
                  :class-names {:months ""}
                  :on-day-key-down (fn [^js d _ ^js e]
                                     (when (= "Enter" (.-key e))
                                       (select-handler! d)))
                  :on-select select-handler!}
                  initial-month
                  (assoc :default-month initial-month)))))]

       (shui/button
        {:class "jtrigger !p-1"
         :ref *trigger-ref
         :variant :text
         :size :sm
         :on-click (fn [e]
                     (if config/publishing?
                       (navigate-to-date-page value)
                       (do
                         (util/stop e)
                         (shui/popup-show! (.-target e) content-fn
                                           {:align "start" :auto-focus? true}))))}
        (ui/icon (if multiple-values? "calendar-plus" "calendar") {:size 16})))]))


(rum/defc property-value-date-picker
  [block property value opts]
  (let [multiple-values? (= :many (:cardinality (:block/schema property)))]
    (date-picker value
                 (merge opts
                        {:multiple-values? multiple-values?
                         :on-change (fn [page]
                                      (let [repo (state/get-current-repo)]
                                        (property-handler/set-block-property! repo (:block/uuid block)
                                                                              (:db/ident property)
                                                                              (:db/id page))
                                        (exit-edit-property)))}))))

(defn- <create-page-if-not-exists!
  [property classes page]
  (let [page* (string/trim page)
        [_ page inline-class] (or (seq (map string/trim (re-find #"(.*)#(.*)$" page*)))
                                  [nil page* nil])
        id (:db/id (ldb/get-page (db/get-db) page))
        class? (= :block/tags (:block/ident property))]
    (if (nil? id)
      (let [inline-class-uuid
            (when inline-class
              (or (ldb/get-page (db/get-db) inline-class)
                  (do (log/error :msg "Given inline class does not exist" :inline-class inline-class)
                      nil)))]
        (p/let [page (page-handler/<create! page {:redirect? false
                                                  :create-first-block? false
                                                  :tags (if inline-class-uuid
                                                          [inline-class-uuid]
                                                       ;; Only 1st class b/c page normally has
                                                       ;; one of and not all these classes
                                                          (take 1 classes))
                                                  :class? class?})]
          (:db/id page)))
      id)))

(defn- select-aux
  [block property {:keys [items selected-choices multiple-choices?] :as opts}]
  (let [selected-choices (->> selected-choices
                              (remove nil?)
                              (remove #(= :property/empty-placeholder %)))
        clear-value (str "No " (:block/original-name property))
        items' (->>
                (if (and (seq selected-choices) (not multiple-choices?))
                  (cons {:value clear-value
                         :label clear-value}
                        items)
                  items)
                (remove #(= :property/empty-placeholder (:value %))))
        k (if multiple-choices? :on-apply :on-chosen)
        f (get opts k)
        f' (fn [chosen]
             (if (or (and (not multiple-choices?) (= chosen clear-value))
                     (and multiple-choices? (= chosen [clear-value])))
               (property-handler/remove-block-property! (state/get-current-repo) (:block/uuid block)
                                                        (:db/ident property))
               (f chosen)))]
    (select/select (assoc opts
                          :selected-choices selected-choices
                          :items items'
                          k f'))
    ;(shui/multi-select-content
    ;  (map #(let [{:keys [value label]} %]
    ;          {:id value :value label}) items') nil opts)
    ))

(defn select-page
  [property
   {:keys [block classes multiple-choices? dropdown? input-opts on-chosen] :as opts}]
  (let [repo (state/get-current-repo)
        tags? (= :block/tags (:db/ident property))
        alias? (= :block/alias (:db/ident property))
        tags-or-alias? (or tags? alias?)
        selected-choices (when block
                           (->>
                            (if tags-or-alias?
                              (->> (if tags?
                                     (:block/tags block)
                                     (:block/alias block))
                                   (map (fn [e] (:block/original-name e))))
                              (when-let [v (get block (:db/ident property))]
                                (if (coll? v)
                                  (map :block/original-name v)
                                  [(:block/original-name v)])))
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
               distinct
               (remove (fn [p] (or (ldb/hidden-page? p) (util/uuid-string? (str p))))))
        options (map (fn [p] {:value p}) pages)
        string-classes (remove #(= :logseq.class %) classes)
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
                                         class-names (map #(:block/original-name (db/entity repo [:block/uuid %])) string-classes)
                                         descendent-classes (->> class-names
                                                                 ;; FIXME:
                                                                 ;; (mapcat #(db/get-namespace-pages repo %))
                                                                 (map :block/original-name))]
                                     (->> (concat class-names descendent-classes)
                                          (filter #(string/includes? % class-input))
                                          (mapv #(hash-map :value (str new-page "#" %)))))
                                   results))
                 :input-opts input-opts})
                multiple-choices?
                (assoc :on-apply (fn [choices]
                                   (p/let [page-ids (p/all (map #(<create-page-if-not-exists! property string-classes %) choices))
                                           values (set page-ids)]
                                     (when on-chosen (on-chosen values)))))
                (not multiple-choices?)
                (assoc :on-chosen (fn [chosen]
                                    (let [page* (string/trim (if (string? chosen) chosen (:value chosen)))]
                                      (when-not (string/blank? page*)
                                        (p/let [id (<create-page-if-not-exists! property string-classes page*)]
                                          (when on-chosen (on-chosen id))))))))]
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
                                  (p/do!
                                   (<add-property! block (:db/ident property) values)
                                   (when on-chosen (on-chosen)))))]
    (select-page property opts')))

(defn- save-text!
  [repo block property value _editor-id e]
  (let [new-value (util/evalue e)]
    (when (not (state/get-editor-action))
      (util/stop e)
      (p/do!
       (when (not= new-value value)
         (property-handler/set-block-property! repo (:block/uuid block)
                                               (:db/ident property)
                                               (string/trim new-value)))
       (exit-edit-property)))))

(defn <create-new-block!
  [block property value]
  (let [{:keys [last-block-id result]} (db-property-handler/create-property-text-block! block property value
                                                                                        editor-handler/wrap-parse-block

                                                                                        {})]
    (p/do!
     result
     (exit-edit-property)
     (editor-handler/edit-block! (db/entity [:block/uuid last-block-id]) :max last-block-id))))

(defn <create-new-block-from-template!
  "`template`: tag block"
  [block property template]
  (let [repo (state/get-current-repo)
        {:keys [page blocks]} (db-property-handler/property-create-new-block-from-template block property template)]
    (p/let [_ (db/transact! repo (if page (cons page blocks) blocks) {:outliner-op :insert-blocks})
            _ (<add-property! block (:db/ident property) (:block/uuid (last blocks)))]
      (last blocks))))

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
           new-property? (or @(:editor/properties-container @state/state)
                             @(:editor/new-property-input-id @state/state))]
       (when (and (or enter? esc? backspace?)
                  (not (state/get-editor-action)))
         (when-not backspace? (util/stop e))
         (cond
           (or esc?
               (and enter? (util/tag? new-value))
               (and enter? new-property?)
               (string/blank? value))
           (save-text! repo block property value editor-id e)

           enter?
           (<create-new-block! block property new-value)

           :else
           nil))))})

(rum/defcs select < rum/reactive
  {:init (fn [state]
           (let [*values (atom :loading)]
             (p/let [result (db-async/<get-block-property-values (state/get-current-repo)
                                                                 (:db/ident (nth (:rum/args state) 1)))]
               (reset! *values result))
             (assoc state ::values *values)))}
  [state block property
   {:keys [multiple-choices? dropdown? content-props] :as select-opts}
   {:keys [*show-new-property-config?]}]
  (let [values (rum/react (::values state))]
    (when-not (= :loading values)
      (let [schema (:block/schema property)
            property (db/sub-block (:db/id property))
            type (:type schema)
            closed-values? (seq (:values schema))
            items (if closed-values?
                    (keep (fn [id]
                            (when-let [block (when id (db/entity [:block/uuid id]))]
                              (let [icon (get block (pu/get-pid :logseq.property/icon))
                                    value (db-property/closed-value-name block)]
                                {:label (if icon
                                          [:div.flex.flex-row.gap-2
                                           (icon-component/icon icon)
                                           value]
                                          value)
                                 :value id}))) (:values schema))
                    (->> values
                         (mapcat (fn [[_id value]]
                                   (if (coll? value)
                                     (map (fn [v] {:value v}) value)
                                     [{:value value}])))
                         (distinct)))
            items (->> (if (= :date type)
                         (map (fn [m] (let [label (:block/original-name (db/entity (:value m)))]
                                        (when label
                                          (assoc m :label label)))) items)
                         items)
                       (remove nil?))
            add-property-f #(<add-property! block (:db/ident property) %)
            on-chosen (fn [chosen]
                        (p/do!
                         (add-property-f (if (map? chosen) (:value chosen) chosen))
                         (when-let [f (:on-chosen select-opts)] (f))))
            selected-choices' (get block (:db/ident property))
            selected-choices (if (coll? selected-choices')
                               (->> selected-choices'
                                    (map (fn [x] (if (= :date type) (:db/id x) x)))
                                    (remove nil?))
                               [selected-choices'])]
        (select-aux block property
                    (cond->
                     {:multiple-choices? multiple-choices?
                      :items items
                      :selected-choices selected-choices
                      :dropdown? dropdown?
                      :show-new-when-not-exact-match? (not (or closed-values? (= :date type)))
                      :input-default-placeholder "Select"
                      :extract-chosen-fn :value
                      :content-props content-props
                      :input-opts (fn [_]
                                    {:on-blur (fn []
                                                (exit-edit-property)
                                                (when-let [f (:on-chosen select-opts)] (f)))
                                     :on-click (fn []
                                                 (when *show-new-property-config?
                                                   (reset! *show-new-property-config? false)))
                                     :on-key-down
                                     (fn [e]
                                       (case (util/ekey e)
                                         "Escape"
                                         (do
                                           (exit-edit-property)
                                           (when-let [f (:on-chosen select-opts)] (f)))
                                         nil))})}
                      closed-values?
                      (assoc :extract-fn :label)
                      multiple-choices?
                      (assoc :on-apply on-chosen)
                      (not multiple-choices?)
                      (assoc :on-chosen on-chosen)))))))

(rum/defc property-normal-block-value
  [parent block-cp editor-box]
  (let [children (model/sort-by-left
                  (:block/_parent (db/entity (:db/id parent)))
                  parent)]
    (if (seq children)
      [:div.property-block-container.w-full
       (block-cp children {:id (str (:block/uuid parent))
                           :editor-box editor-box})]
      [:div.opacity-50.pointer.text-sm.cursor-pointer "Empty"])))

(rum/defc property-template-value < rum/reactive
  {:init (fn [state]
           (let [block-id (second (:rum/args state))]
             (db-async/<get-block (state/get-current-repo) block-id :children? false))
           state)}
  [config value opts]
  (when value
    (if (state/sub-async-query-loading value)
      [:div.text-sm.opacity-70 "loading"]
      (when-let [entity (db/sub-block (:db/id (db/entity [:block/uuid value])))]
        (let [properties-cp (:properties-cp opts)]
          (when (and entity properties-cp)
            [:div.property-block-container.w-full.property-template
             (properties-cp config entity (:editor-id config) (merge opts {:in-block-container? true}))]))))))

(defn- create-template-block!
  [block property v-block *template-instance]
  (when-not @*template-instance
    (p/let [result (<create-new-block-from-template! block property v-block)]
      (reset! *template-instance result))))

(rum/defcs property-block-value < rum/reactive
  (rum/local nil ::template-instance)
  {:init (fn [state]
           (let [block-id (first (:rum/args state))]
             (db-async/<get-block (state/get-current-repo) block-id :children? true))
           state)}
  [state value block property block-cp editor-box opts page-cp editor-id]
  (let [*template-instance (::template-instance state)
        template-instance @*template-instance]
    (when value
      (if (state/sub-async-query-loading value)
        [:div.text-sm.opacity-70 "loading"]
        (if-let [v-block (db/sub-block (:db/id (db/entity [:block/uuid value])))]
          (let [class? (contains? (:block/type v-block) "class")
                invalid-warning [:div.warning.text-sm
                                 "Invalid block value, please delete the current property."]]
            (if v-block
              (cond
                (:block/page v-block)
                (property-normal-block-value v-block block-cp editor-box)

                (and class? (seq (:class/schema.properties v-block)))
                (if template-instance
                  (property-template-value {:editor-id editor-id}
                                           (:block/uuid template-instance)
                                           opts)
                  (create-template-block! block property v-block *template-instance))

              ;; page/class/etc.
                (:block/name v-block)
                (page-cp {:disable-preview? true
                          :hide-close-button? true
                          :tag? class?} v-block)
                :else
                invalid-warning)
              invalid-warning))
          [:div.opacity-50.pointer.text-sm.cursor-pointer "Empty"])))))

(rum/defc closed-value-item < rum/reactive
  {:init (fn [state]
           (let [block-id (first (:rum/args state))]
             (db-async/<get-block (state/get-current-repo) block-id :children? false))
           state)}
  [value {:keys [page-cp inline-text icon?]}]
  (when value
    (if (state/sub-async-query-loading value)
      [:div.text-sm.opacity-70 "loading"]
      (when-let [block (db/sub-block (:db/id (db/entity [:block/uuid value])))]
        (let [value' (get-in block [:block/schema :value])
              icon (get block (pu/get-pid :logseq.property/icon))]
          (cond
            (:block/name block)
            (page-cp {:disable-preview? true
                      :hide-close-button? true} block)

            icon
            (if icon?
              (icon-component/icon icon)
              [:div.flex.flex-row.items-center.gap-2
               (icon-component/icon icon)
               (when value'
                 [:span value'])])

            (= type :number)
            [:span.number (str value')]

            :else
            (inline-text {} :markdown (str value'))))))))

(rum/defc select-item
  [property type value {:keys [page-cp inline-text _icon?] :as opts}]
  (let [closed-values? (seq (get-in property [:block/schema :values]))]
    [:div.select-item
     (cond
       (= value :property/empty-placeholder)
       (shui/button {:class "empty-btn" :variant :text} "Empty")

       (contains? #{:page :date} type)
       (when value
         (page-cp {:disable-preview? true
                   :hide-close-button? true} value))

       closed-values?
       (closed-value-item value opts)

       (= type :number)
       [:span.number (str value)]

       :else
       (inline-text {} :markdown (macro-util/expand-value-if-macro (str value) (state/get-macros))))]))

(rum/defc single-value-select
  [block property value value-f select-opts {:keys [editing?] :as opts}]
  (let [[open? set-open!] (rum/use-state editing?)
        schema (:block/schema property)
        type (get schema :type :default)
        select-opts' (cond-> (assoc select-opts
                                    :multiple-choices? false
                                    :on-chosen #(set-open! false))
                       (= type :page)
                       (assoc :classes (:classes schema)))]
    (shui/dropdown-menu
     {:open open?}
     (shui/dropdown-menu-trigger
      {:class "jtrigger flex flex-1 w-full"
       :on-click (if config/publishing?
                   (constantly nil)
                   #(set-open! (not open?)))
       :on-key-down (fn [^js e]
                      (case (util/ekey e)
                        (" " "Enter")
                        (do (set-open! true) (util/stop e))
                        :dune))}
       (if (string/blank? value)
         [:div.opacity-50.pointer.text-sm.cursor-pointer "Empty"]
         (value-f)))
      (shui/dropdown-menu-content
        {:align "start"
         :on-interact-outside #(set-open! false)
       :onEscapeKeyDown #(set-open! false)}
      [:div.property-select
       (case type
         (:number :url :date :default)
         (select block property select-opts' opts)

         :page
         (property-value-select-page block property select-opts' opts))]))))

(defn- property-editing
  [block property value schema editor-box editor-args editor-id]
  (let [repo (state/get-current-repo)
        multiple-values? (= :many (:cardinality schema))]
    [:div.flex.flex-1
    (case type
      :template
      (let [id (first (:classes schema))
            template (when id (db/entity [:block/uuid id]))]
        (when template
          (<create-new-block-from-template! block property template)))

      (let [config {:editor-opts (new-text-editor-opts repo block property value editor-id)}]
        [:div
         (editor-box editor-args editor-id (cond-> config
                                             multiple-values?
                                             (assoc :property-value value)))]))]))

(defn- property-value-inner
  [block property value *ref {:keys [inline-text block-cp page-cp
                                     editor-id dom-id row?
                                     editor-box]
                              :as opts}]
  (let [schema (:block/schema property)
        multiple-values? (= :many (:cardinality schema))
        class (str (when-not row? "flex flex-1 ")
                   (when multiple-values? "property-value-content"))
        type (or (when (and (= type :default) (uuid? value)) :block)
                 type
                 :default)
        type (if (= :block type)
               (let [v-block (db/entity value)]
                 (if (get v-block (pu/get-pid :logseq.property/created-from-template))
                   :template
                   type))
               type)
        template? (= :template type)]
    [:div.cursor-text.jtrigger
     {:id (or dom-id (random-uuid))
      :tabIndex 0
      :class class
      :style {:min-height 24}
      :on-click (fn []
                  (let [property-block (when (and (= type :block) (uuid? value))
                                         (db/entity [:block/uuid value]))
                        invalid-block? (and (= type :block) (uuid? value)
                                            (or (nil? property-block)
                                                (nil? (:block/_parent property-block))))
                        value (if invalid-block? "" value)]
                    (when (or (= type :default) invalid-block?)
                      (set-editing! (assoc property :block/uuid (random-uuid)) editor-id dom-id value {:ref @*ref}))))}
     (if (string/blank? value)
       (if template?
         (let [id (first (:classes schema))
               template (when id (db/entity [:block/uuid id]))]
           (when template
             [:a.fade-link.pointer.text-sm.jtrigger
              {:on-click (fn [e]
                           (util/stop e)
                           (<create-new-block-from-template! block property template))}
              (str "Use template #" (:block/original-name template))]))
         [:div.opacity-50.pointer.text-sm.cursor-pointer "Empty"])
       (cond
         (= type :template)
         (property-template-value {:editor-id editor-id}
                                  value
                                  opts)

         (and (= type :block) (uuid? value))
         (property-block-value value block property block-cp editor-box opts page-cp editor-id)

         :else
         (inline-text {} :markdown (macro-util/expand-value-if-macro (str value) (state/get-macros)))))]))

(rum/defcs property-scalar-value < rum/reactive db-mixins/query
  (rum/local nil ::ref)
  [state block property value {:keys [editor-id editor-box editor-args editing?
                                      on-chosen]
                               :as opts}]
  (let [*ref (::ref state)
        property (model/sub-block (:db/id property))

        schema (:block/schema property)
        type (get schema :type :default)

        editing? (or editing?
                     (state/sub-property-value-editing? editor-id)
                     (and @*ref (state/sub-editing? @*ref)))
        select-type? (select-type? property type)
        closed-values? (seq (:values schema))
        select-opts {:on-chosen on-chosen}
        value (if (and (de/entity? value) (= (:db/ident value) :property/empty-placeholder))
                nil
                value)]
    (if (and select-type?
             (not (and (not closed-values?) (= type :date))))
      (single-value-select block property value
                           (fn []
                             (select-item property type value opts))
                           select-opts
                           (assoc opts :editing? editing?))
      (case type
        :date
        (property-value-date-picker block property value {:editing? editing?})

        :checkbox
        (let [add-property! (fn []
                              (<add-property! block (:db/ident property) (boolean (not value))))]
          (shui/checkbox {:class "jtrigger flex flex-row items-center"
                          :checked value
                          :auto-focus editing?
                          :on-checked-change add-property!
                          :on-key-down (fn [e]
                                         (when (= (util/ekey e) "Enter")
                                           (add-property!)))}))
        ;; :others
        [:div.flex.flex-1 {:ref #(when-not @*ref (reset! *ref %))}
   (if editing?
     (property-editing  block property value schema editor-box editor-args editor-id)
     (property-value-inner block property value *ref opts))]))))

(rum/defc multiple-values
  [block property v {:keys [on-chosen dropdown? editing?]
                     :or {dropdown? true}
                     :as opts} schema]
  (let [type (get schema :type :default)
        date? (= type :date)
        *el (rum/use-ref nil)
        items (if (coll? v) v (when v [v]))
        values-cp (fn [toggle-fn]
                    (if (seq items)
                      (concat
                       (for [item items]
                         (select-item property type item opts))
                       (when date?
                         [(property-value-date-picker block property nil {:toggle-fn toggle-fn})]))
                      (when-not editing?
                        (shui/button {:class "empty-btn" :variant :text} "Empty"))))
        select-cp (fn [select-opts]
                    (let [select-opts (merge {:multiple-choices? true
                                              :dropdown? editing?
                                              :on-chosen (fn []
                                                           (when on-chosen (on-chosen)))}
                                        select-opts)]
                      [:div.property-select (cond-> {} editing? (assoc :class "h-6"))
                       (if (= :page type)
                         (property-value-select-page block property
                                                     (assoc select-opts
                                                            :classes (:classes schema))
                                                     opts)
                         (select block property select-opts opts))]))]

    (rum/use-effect!
      (fn []
        (when editing?
          (prn "TODO: editing multiple select immediately show...")))
      [editing?])

    (if (and dropdown? (not editing?))
      (let [toggle-fn #(shui/popup-hide!)
            content-fn (fn [{:keys [_id content-props]}]
                         (select-cp {:content-props content-props}))]
        [:div.multi-values.jtrigger
         {:tab-index "0"
          :ref *el
          :on-click (fn [^js e]
                      (when-not (.closest (.-target e) ".select-item")
                        (if config/publishing?
                          nil
                          (shui/popup-show! (rum/deref *el) content-fn
                            {:as-dropdown? true :as-content? false
                             :align "start" :auto-focus? true}))))
          :on-key-down (fn [^js e]
                         (case (.-key e)
                           (" " "Enter")
                           (do (some-> (rum/deref *el) (.click))
                               (util/stop e))
                           :dune))
          :class "flex flex-1 flex-row items-center flex-wrap gap-x-2 gap-y-2 pr-4"}
         (values-cp toggle-fn)])
      (select-cp {:content-props nil}))))

(rum/defc property-value < rum/reactive
  [block property v opts]
  (ui/catch-error
   (ui/block-error "Something wrong" {})
   (let [dom-id (str "ls-property-" (:db/id block) "-" (:db/id property))
         editor-id (str dom-id "-editor")
         schema (:block/schema property)
         type (some-> schema (get :type :default))
         multiple-values? (= :many (:cardinality schema))
         empty-value? (= :property/empty-placeholder v)
         editor-args {:block property
                      :parent-block block
                      :format :markdown}
         v (cond
             (and multiple-values? (or (set? v) (empty? v)))
             v
             multiple-values?
             #{v}
             (set? v)
             (first v)
             :else
             v)]
     [:div.property-value-inner.w-full
      {:data-type type
       :class (when empty-value? "empty-value")}
      (cond
        multiple-values?
        (multiple-values block property v opts schema)

        :else
        (property-scalar-value block property v
                               (merge
                                opts
                                {:editor-args editor-args
                                 :editor-id editor-id
                                 :dom-id dom-id})))])))
