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
            [lambdaisland.glogi :as log]
            [rum.core :as rum]
            [promesa.core :as p]
            [frontend.db.async :as db-async]
            [logseq.common.util.macro :as macro-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [datascript.impl.entity :as de]
            [frontend.handler.property.util :as pu]
            [logseq.db.frontend.property.type :as db-property-type]
            [dommy.core :as d]))

(rum/defc property-empty-btn-value
  [& {:as opts}]
  (shui/button (merge {:class "empty-btn" :variant :text} opts) "Empty"))

(rum/defc property-empty-text-value
  [& {:as opts}]
  [:span.inline-flex.items-center.cursor-pointer
   (merge {:class "empty-text-btn" :variant :text} opts) "Empty"])

(rum/defc icon-row < rum/reactive
  [block]
  (let [icon-value (:logseq.property/icon block)]
    [:div.col-span-3.flex.flex-row.items-center.gap-2
     (icon-component/icon-picker icon-value
                                 {:disabled? config/publishing?
                                  :on-chosen (fn [_e icon]
                                               (db-property-handler/set-block-property!
                                                (:db/id block)
                                                :logseq.property/icon
                                                (select-keys icon [:type :id])))})
     (when (and icon-value (not config/publishing?))
       [:a.fade-link.flex {:on-click (fn [_e]
                                       (db-property-handler/remove-block-property!
                                        (:db/id block)
                                        :logseq.property/icon))
                           :title "Delete this icon"}
        (ui/icon "X")])]))

(defn- select-type?
  [property type]
  (or (contains? #{:page :object :number :url :date} type)
      ;; closed values
      (seq (:property/closed-values property))))

(defn <create-new-block!
  [block property value & {:keys [edit-block?]
                           :or {edit-block? true}}]
  (p/let [block
          (if (and (= :default (get-in property [:block/schema :type]))
                   (not (db-property/many? property)))
            (p/let [existing-value (get block (:db/ident property))
                    new-block-id (when-not existing-value (db/new-block-id))
                    _ (when-not existing-value
                        (db-property-handler/create-property-text-block!
                         (:db/id block)
                         (:db/id property)
                         value
                         {:new-block-id new-block-id}))]
              (or existing-value (db/entity [:block/uuid new-block-id])))
            (p/let [new-block-id (db/new-block-id)
                    _ (db-property-handler/create-property-text-block!
                       (:db/id block)
                       (:db/id property)
                       value
                       {:new-block-id new-block-id})]
              (db/entity [:block/uuid new-block-id])))]
    (p/do!
     (when edit-block?
       (editor-handler/edit-block! block :max {:container-id :unknown-container}))
     (shui/popup-hide!)
     (shui/dialog-close!))))

(defn <add-property!
  "If a class and in a class schema context, add the property to its schema.
  Otherwise, add a block's property and its value"
  ([block property-key property-value] (<add-property! block property-key property-value {}))
  ([block property-id property-value' {:keys [exit-edit? class-schema?]
                                       :or {exit-edit? true}}]
   (let [repo (state/get-current-repo)
         class? (contains? (:block/type block) "class")]
     (assert (qualified-keyword? property-id) "property to add must be a keyword")
     (p/do!
      (if (and class? class-schema?)
        (db-property-handler/class-add-property! (:db/id block) property-id)
        (p/let [property (db/entity property-id)]
          (if (and (db-property-type/ref-property-types (get-in property [:block/schema :type]))
                   (not (int? property-value')))
            (<create-new-block! block (db/entity property-id) property-value' {:edit-block? false})
            (property-handler/set-block-property! repo (:block/uuid block) property-id property-value'))))
      (when exit-edit?
        (shui/popup-hide-all!)
        (shui/dialog-close!))))))

(defn- add-or-remove-property-value
  [block property value selected?]
  (let [many? (db-property/many? property)]
    (if selected?
      (<add-property! block (:db/ident property) value {:exit-edit? (not many?)})
      (p/do!
       (db-property-handler/delete-property-value! (:db/id block) (:db/ident property) value)
       (when (or (not many?)
                 ;; values will be cleared
                 (and many? (<= (count (get block (:db/ident property))) 1)))
         (shui/popup-hide!))))))

(rum/defcs calendar-inner <
  (rum/local (str "calendar-inner-" (js/Date.now)) ::identity)
  {:will-mount (fn [state]
                 (js/setTimeout
                  #(some-> @(::identity state)
                           (js/document.getElementById)
                           (.querySelector "[aria-selected=true]")
                           (.focus)) 0)
                 state)
   :will-unmount (fn [state]
                   (shui/popup-hide!)
                   (shui/dialog-close!)
                   state)}
  [state id on-change value]
  (let [*ident (::identity state)
        initial-day (or (some-> value (.getTime) (js/Date.)) (js/Date.))
        initial-month (when value
                        (js/Date. (.getFullYear value) (.getMonth value)))
        select-handler!
        (fn [^js d]
          ;; force local to UTC
          (when d
            (let [gd (goog.date.Date. (.getFullYear d) (.getMonth d) (.getDate d))]
              (let [journal (date/js-date->journal-title gd)]
                (p/do!
                 (when-not (db/get-case-page journal)
                   (page-handler/<create! journal {:redirect? false
                                                   :create-first-block? false}))
                 (when (fn? on-change)
                   (on-change (db/get-case-page journal)))
                 (shui/popup-hide! id)
                 (shui/popup-hide!)
                 (shui/dialog-close!))))))]
    (shui/calendar
     (cond->
      {:mode "single"
       :initial-focus true
       :selected initial-day
       :id @*ident
       :class-names {:months ""}
       :on-day-key-down (fn [^js d _ ^js e]
                          (when (= "Enter" (.-key e))
                            (select-handler! d)))
       :on-select select-handler!}
       initial-month
       (assoc :default-month initial-month)))))

(rum/defc date-picker
  [value {:keys [on-change editing? multiple-values? other-position?]}]
  (let [*trigger-ref (rum/use-ref nil)
        page value
        title (when page (:block/original-name page))
        value' (when title
                 (js/Date. (date/journal-title->long title)))
        content-fn (fn [{:keys [id]}] (calendar-inner id on-change value'))
        open-popup! (fn [e]
                      (when-not (or (util/meta-key? e) (util/shift-key? e))
                        (util/stop e)
                        (when-not config/publishing?
                          (shui/popup-show! (.-target e) content-fn
                                            {:align "start" :auto-focus? true}))))]
    (rum/use-effect!
     (fn []
       (when editing?
         (js/setTimeout
           #(some-> (rum/deref *trigger-ref)
              (.click)) 32)))
     [editing?])

    (if multiple-values?
      (shui/button
       {:class "jtrigger h-6 empty-btn"
        :ref *trigger-ref
        :variant :text
        :size :sm
        :on-click open-popup!}
       (ui/icon "calendar-plus" {:size 16}))
      (shui/trigger-as
       :div.flex.flex-1.flex-row.gap-1.items-center.flex-wrap
       {:tabIndex 0
        :class "jtrigger min-h-[24px]"  ; FIXME: min-h-6 not works
        :ref *trigger-ref
        :on-click open-popup!}
       (if page
         (when-let [page-cp (state/get-component :block/page-cp)]
           (rum/with-key
             (page-cp {:disable-preview? true
                       :hide-close-button? true
                       :meta-click? other-position?} page)
             (:db/id page)))
         (when-not multiple-values?
           (property-empty-btn-value)))))))

(rum/defc property-value-date-picker
  [block property value opts]
  (let [multiple-values? (db-property/many? property)]
    (date-picker value
                 (merge opts
                        {:multiple-values? multiple-values?
                         :on-change (fn [page]
                                      (let [repo (state/get-current-repo)]
                                        (property-handler/set-block-property! repo (:block/uuid block)
                                                                              (:db/ident property)
                                                                              (:db/id page))))}))))

(defn- <create-page-if-not-exists!
  [property classes page]
  (let [page* (string/trim page)
        ;; inline-class is only for input from :transform-fn
        [page inline-class] (if (and (seq classes) (not (contains? db-property/db-attribute-properties (:db/ident property))))
                                (or (seq (map string/trim (rest (re-find #"(.*)#(.*)$" page*))))
                                    [page* nil])
                                [page* nil])
        id (:db/id (ldb/get-case-page (db/get-db) page))]
    (if (nil? id)
      (let [inline-class-uuid
            (when inline-class
              (or (:block/uuid (ldb/get-case-page (db/get-db) inline-class))
                  (do (log/error :msg "Given inline class does not exist" :inline-class inline-class)
                      nil)))
            class? (= :block/tags (:db/ident property))
            create-options {:redirect? false
                            :create-first-block? false
                            :tags (if inline-class-uuid
                                    [inline-class-uuid]
                                    ;; Only 1st class b/c page normally has
                                    ;; one of and not all these classes
                                    (mapv :block/uuid (take 1 classes)))}]
        (p/let [page (if class?
                       (page-handler/<create-class! page create-options)
                       (page-handler/<create! page create-options))]
          (:db/id page)))
      id)))

(defn- select-aux
  [block property {:keys [items selected-choices multiple-choices?] :as opts}]
  (let [selected-choices (->> selected-choices
                              (remove nil?)
                              (remove #(= :logseq.property/empty-placeholder %)))
        clear-value (str "No " (:block/original-name property))
        clear-value-label [:div.flex.flex-row.items-center.gap-2
                           (ui/icon "x")
                           [:div clear-value]]
        items' (->>
                (if (and (seq selected-choices) (not multiple-choices?))
                  (concat items
                          [{:value clear-value
                            :label clear-value-label
                            :clear? true}])
                  items)
                (remove #(= :logseq.property/empty-placeholder (:value %))))
        k :on-chosen
        f (get opts k)
        f' (fn [chosen selected?]
             (if (or (and (not multiple-choices?) (= chosen clear-value))
                     (and multiple-choices? (= chosen [clear-value])))
               (p/do!
                (property-handler/remove-block-property! (state/get-current-repo) (:block/uuid block)
                                                         (:db/ident property))
                (shui/popup-hide!))
               (f chosen selected?)))]
    (select/select (assoc opts
                          :selected-choices selected-choices
                          :items items'
                          k f'))
    ;(shui/multi-select-content
    ;  (map #(let [{:keys [value label]} %]
    ;          {:id value :value label}) items') nil opts)
    ))

(defn- get-title
  [e]
  (or (:block/original-name e)
      (:block/content e)))

(defn select-page
  [property
   {:keys [block multiple-choices? dropdown? input-opts] :as opts}]
  (let [repo (state/get-current-repo)
        object? (= :object (get-in property [:block/schema :type]))
        classes (:property/schema.classes property)
        tags? (= :block/tags (:db/ident property))
        alias? (= :block/alias (:db/ident property))
        tags-or-alias? (or tags? alias?)
        selected-choices (when block
                           (when-let [v (get block (:db/ident property))]
                             (if (every? de/entity? v)
                               (map :db/id v)
                               [(:db/id v)])))
        objects-or-pages
        (->>
         (cond
           (seq classes)
           (mapcat
            (fn [class]
              (if (= :logseq.class/Root (:db/ident class))
                (->> (model/get-all-classes repo)
                     (keep (fn [[_ id]]
                             (let [e (db/entity [:block/uuid id])]
                               (when-not (= :logseq.class/Root (:db/ident e))
                                 e)))))
                (->> (model/get-class-objects repo (:db/id class))
                     (keep db/entity))))
            classes)

           :else
           (->> (model/get-all-pages repo)
                (remove (fn [page]
                          (or (ldb/built-in? page)
                              ;; A page's alias can't be itself
                              (and alias? (= (or (:db/id (:block/page block))
                                                 (:db/id block))
                                             (:db/id page)))))))))
        options (map (fn [object] {:label (get-title object)
                                   :value (:db/id object)}) objects-or-pages)
        classes' (remove (fn [class] (= :logseq.class/Root (:db/ident class))) classes)
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
                                              (str "Choose " (if object? "objects" "pages"))
                                              :else
                                              (str "Choose " (if object? "object" "page")))
                 :show-new-when-not-exact-match? true
                 :extract-chosen-fn :value
                 :extract-fn :label

                 :input-opts input-opts
                 :on-chosen (fn [chosen selected?]
                              (p/let [id (if (integer? chosen) chosen
                                             (when-not (string/blank? (string/trim chosen))
                                               (<create-page-if-not-exists! property classes' chosen)))]
                                (if id
                                  (add-or-remove-property-value block property id selected?)
                                  (log/error :msg "No :db/id found or created for chosen" :chosen chosen))))})

                (and (seq classes') (not tags-or-alias?))
                (assoc
                 ;; Provides additional completion for inline classes on new pages or objects
                 :transform-fn (fn [results input]
                                 (if-let [[_ new-page class-input] (and (empty? results) (re-find #"(.*)#(.*)$" input))]
                                   (let [repo (state/get-current-repo)
                                         descendent-classes (->> classes'
                                                                 (mapcat #(model/get-class-children repo (:db/id %)))
                                                                 (map #(db/entity repo %)))]
                                     (->> (concat classes' descendent-classes)
                                          (filter #(string/includes? (:block/original-name %) class-input))
                                          (mapv (fn [p]
                                                  {:value (str new-page "#" (:block/original-name p))
                                                   :label (str new-page "#" (:block/original-name p))}))))
                                   results))))]
    (select-aux block property opts')))

(defn property-value-select-page
  [block property opts
   {:keys [*show-new-property-config?]}]
  (let [input-opts (fn [_]
                     {:on-click (fn []
                                  (when *show-new-property-config?
                                    (reset! *show-new-property-config? false)))
                      :on-key-down
                      (fn [e]
                        (case (util/ekey e)
                          "Escape"
                          (when-let [f (:on-chosen opts)] (f))
                          nil))})
        opts' (assoc opts
                     :block block
                     :input-opts input-opts)]
    (select-page property opts')))

(defn <create-new-block-from-template!
  "`template`: tag block"
  [block property template]
  (p/let [new-block-id (db/new-block-id)
          _ (db-property-handler/create-property-text-block!
             (:db/id block)
             (:db/id property)
             ""
             {:new-block-id new-block-id
              :template-id (:db/id template)})
          new-block (db/entity [:block/uuid new-block-id])]
    (shui/popup-hide!)
    new-block))

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
            closed-values? (seq (:property/closed-values property))
            ref-type? (db-property-type/ref-property-types type)
            items (if closed-values?
                    (keep (fn [block]
                            (let [icon (pu/get-block-property-value block :logseq.property/icon)
                                  value (db-property/closed-value-content block)]
                              {:label (if icon
                                        [:div.flex.flex-row.gap-2
                                         (icon-component/icon icon)
                                         value]
                                        value)
                               :value (:db/id block)})) (:property/closed-values property))
                    (->> values
                         (mapcat (fn [value]
                                   (if (coll? value)
                                     (map (fn [v] {:value v}) value)
                                     [{:value value}])))
                         (map (fn [{:keys [value]}]
                                (if (and ref-type? (number? value))
                                  (when-let [e (db/entity value)]
                                    {:label (db-property/property-value-content e)
                                     :value value})
                                  {:label value
                                   :value value})))
                         (distinct)))
            items (->> (if (= :date type)
                         (map (fn [m] (let [label (:block/original-name (db/entity (:value m)))]
                                        (when label
                                          (assoc m :label label)))) items)
                         items)
                       (remove nil?))
            on-chosen (fn [chosen selected?]
                        (let [value (if (map? chosen) (:value chosen) chosen)]
                          (add-or-remove-property-value block property value selected?)))
            selected-choices' (get block (:db/ident property))
            selected-choices (if (every? de/entity? selected-choices')
                               (map :db/id selected-choices')
                               [selected-choices'])]
        (select-aux block property
                    {:multiple-choices? multiple-choices?
                     :items items
                     :selected-choices selected-choices
                     :dropdown? dropdown?
                     :show-new-when-not-exact-match? (not (or closed-values? (= :date type)))
                     :input-default-placeholder "Select"
                     :extract-chosen-fn :value
                     :extract-fn :label
                     :content-props content-props
                     :on-chosen on-chosen
                     :input-opts (fn [_]
                                   {:on-blur (fn []
                                               (when-let [f (:on-chosen select-opts)] (f)))
                                    :on-click (fn []
                                                (when *show-new-property-config?
                                                  (reset! *show-new-property-config? false)))
                                    :on-key-down
                                    (fn [e]
                                      (case (util/ekey e)
                                        "Escape"
                                        (when-let [f (:on-chosen select-opts)] (f))
                                        nil))})})))))

(rum/defc property-normal-block-value
  [block property value-block opts]
  (let [multiple-values? (db-property/many? property)
        block-container (state/get-component :block/container)
        blocks-container (state/get-component :block/blocks-container)]
    (if value-block
      [:div.property-block-container.content.w-full
       (let [config {:id (str (if multiple-values?
                                (:block/uuid block)
                                (:block/uuid value-block)))
                     :container-id (:container-id opts)
                     :editor-box (state/get-component :editor/box)
                     :property-block? true}]
         (if (set? value-block)
           (blocks-container config (ldb/sort-by-order value-block))
           (block-container config value-block)))]
      (property-empty-btn-value))))

(rum/defc property-template-value < rum/reactive
  {:init (fn [state]
           (when-let [block-id (second (:rum/args state))]
             (db-async/<get-block (state/get-current-repo) block-id :children? false))
           state)}
  [config value opts]
  (when value
    (if (state/sub-async-query-loading value)
      [:div.text-sm.opacity-70 "loading"]
      (when-let [entity (db/sub-block (:db/id (db/entity [:block/uuid value])))]
        (let [properties-cp (:properties-cp opts)]
          (when (and entity properties-cp)
            [:div.property-block-container.content.property-template
             (properties-cp config entity (:editor-id config) opts)]))))))

(defn- create-template-block!
  [block property v-block *template-instance]
  (when-not @*template-instance
    (p/let [result (<create-new-block-from-template! block property v-block)]
      (reset! *template-instance result))))

(rum/defcs property-block-value < rum/reactive
  (rum/local nil ::template-instance)
  {:init (fn [state]
           (let [block (first (:rum/args state))]
             (when-let [block-id (or (:db/id block) (:block/uuid block))]
               (db-async/<get-block (state/get-current-repo) block-id :children? true)))
           state)}
  [state value block property opts page-cp editor-id]
  (let [*template-instance (::template-instance state)
        template-instance @*template-instance]
    (when value
      (if (state/sub-async-query-loading value)
        [:div.text-sm.opacity-70 "loading"]
        (if-let [v-block (db/sub-block (:db/id value))]
          (let [class? (contains? (:block/type v-block) "class")
                invalid-warning [:div.warning.text-sm
                                 "Invalid block value, please delete the current property."]]
            (when v-block
              (cond
                (:block/page v-block)
                (property-normal-block-value block property v-block opts)

                (and class? (seq (:class/schema.properties v-block)))
                (if template-instance
                  (property-template-value {:editor-id editor-id}
                                           (:block/uuid template-instance)
                                           opts)
                  (create-template-block! block property v-block *template-instance))

                ;; page/class/etc.
                (:block/name v-block)
                (rum/with-key
                  (page-cp {:disable-preview? true
                            :hide-close-button? true
                            :tag? class?} v-block)
                  (:db/id v-block))
                :else
                invalid-warning)))
          (property-empty-btn-value))))))

(rum/defc closed-value-item < rum/reactive
  [value {:keys [inline-text icon?]}]
  (when value
    (let [eid (if (de/entity? value) (:db/id value) [:block/uuid value])]
      (when-let [block (db/sub-block (:db/id (db/entity eid)))]
        (let [property-block? (db-property/property-created-block? block)
              value' (db-property/closed-value-content block)
              icon (pu/get-block-property-value block :logseq.property/icon)]
          (cond
            icon
            (if icon?
              (icon-component/icon icon)
              [:div.flex.flex-row.items-center.gap-2
               (icon-component/icon icon)
               (when value'
                 [:span value'])])

            property-block?
            value'

            (= type :number)
            [:span.number (str value')]

            :else
            (inline-text {} :markdown (str value'))))))))

(rum/defc select-item
  [property type value {:keys [page-cp inline-text other-position? _icon?] :as opts}]
  (let [closed-values? (seq (:property/closed-values property))
        tag? (or (:tag? opts) (= (:db/ident property) :block/tags))
        inline-text-cp (fn [content]
                         [:div.flex.flex-row.items-center
                          (inline-text {} :markdown (macro-util/expand-value-if-macro content (state/get-macros)))
                          (when (and (= type :url) other-position?)
                            (shui/button {:variant :ghost
                                          :size :sm
                                          :class "px-0 py-0 h-4"}
                                         (ui/icon "edit" {:size 14})))])]
    [:div.select-item.cursor-pointer
     (cond
       (= value :logseq.property/empty-placeholder)
       (property-empty-btn-value)

       (ldb/page? value)
       (when value
         (rum/with-key
           (page-cp {:disable-preview? true
                     :tag? tag?
                     :hide-close-button? true
                     :meta-click? other-position?} value)
           (:db/id value)))

       (= type :object)
       (when-let [reference (state/get-component :block/reference)]
         (reference {} (:block/uuid value)))

       closed-values?
       (closed-value-item value opts)

       (de/entity? value)
       (when-some [content (if (some? (:property.value/content value))
                             ;; content needs to be a string for display purposes
                             (str (:property.value/content value))
                             (:block/content value))]
         (inline-text-cp content))

       :else
       (inline-text-cp (str value)))]))

(rum/defc single-value-select
  [block property value value-f select-opts opts]
  (let [*el (rum/use-ref nil)]
    ;; Open popover initially when editing a property
    (rum/use-effect!
     (fn []
       (when (:editing? opts)
         (.click (rum/deref *el))))
     [(:editing? opts)])
    (let [schema (:block/schema property)
          type (get schema :type :default)
          select-opts' (assoc select-opts :multiple-choices? false)
          popup-content (fn content-fn [_]
                          [:div.property-select
                           (case type
                             (:number :url :default)
                             (select block property select-opts' opts)

                             (:object :page :date)
                             (property-value-select-page block property select-opts' opts))])
          trigger-id (str "trigger-" (:container-id opts) "-" (:db/id block) "-" (:db/id property))
          show! (fn [e]
                  (let [target (.-target e)]
                    (when-not (or config/publishing?
                                  (util/shift-key? e)
                                  (util/meta-key? e)
                                  (util/link? target)
                                  (when-let [node (.closest target "a")]
                                    (not (or (d/has-class? node "page-ref")
                                             (d/has-class? node "tag")))))

                      (shui/popup-show! target popup-content
                                        {:align "start"
                                         :as-dropdown? true
                                         :auto-focus? true
                                         :trigger-id trigger-id}))))]
      (shui/trigger-as
       (if (:other-position? opts) :div :div.jtrigger.flex.flex-1.w-full)
       {:ref *el
        :id trigger-id
        :tabIndex 0
        :on-click show!}
       (if (string/blank? value)
         (property-empty-text-value)
         (value-f))))))

(defn- property-editing
  [block property schema]
  [:div.flex.flex-1
   (case (:type schema)
     :template
     (when-let [template (first (:property/schema.classes property))]
       (<create-new-block-from-template! block property template))
     nil)])

(defn- property-value-inner
  [block property value {:keys [inline-text page-cp
                                editor-id dom-id row?]
                         :as opts}]
  (let [schema (:block/schema property)
        multiple-values? (db-property/many? property)
        class (str (when-not row? "flex flex-1 ")
                   (when multiple-values? "property-value-content"))
        type (:type schema)
        type (if (= :default type)
               (or
                (let [v-block (db/entity value)]
                  (when (get v-block (pu/get-pid :logseq.property/created-from-template))
                    :template))
                type)
               type)
        template? (= :template type)]
    [:div.cursor-text
     {:id (or dom-id (random-uuid))
      :tabIndex 0
      :class (str class " " (when-not (= type :default) "jtrigger"))
      :style {:min-height 24}
      :on-click (fn []
                  (when (and (= type :default) (nil? value))
                    (<create-new-block! block property "")))}
     (if (and (string/blank? value) template?)
       (when-let [template (first (:property/schema.classes schema))]
         [:a.fade-link.pointer.text-sm.jtrigger
          {:on-click (fn [e]
                       (util/stop e)
                       (<create-new-block-from-template! block property template))}
          (str "Use template #" (:block/original-name template))])
       (cond
         (= type :template)
         (property-template-value {:editor-id editor-id}
                                  value
                                  opts)

         (and (= type :default) (nil? (:block/content value)))
         [:div.jtrigger (property-empty-btn-value)]

         (= type :default)
         (property-block-value value block property opts page-cp editor-id)

         :else
         (inline-text {} :markdown (macro-util/expand-value-if-macro (str value) (state/get-macros)))))]))

(rum/defcs property-scalar-value < rum/reactive db-mixins/query rum/static
  [state block property value* {:keys [container-id editing? on-chosen]
                                :as opts}]
  (let [property (model/sub-block (:db/id property))
        schema (:block/schema property)
        type (get schema :type :default)
        editing? (or editing?
                     (state/sub-editing? [container-id (:block/uuid block) (:block/uuid property)]))
        select-type? (select-type? property type)
        closed-values? (seq (:property/closed-values property))
        select-opts {:on-chosen on-chosen}
        value (if (and (de/entity? value*) (= (:db/ident value*) :logseq.property/empty-placeholder))
                nil
                value*)]
    (if (= :logseq.property/icon (:db/ident property))
      (icon-row block)
      (if (and select-type?
               (not (and (not closed-values?) (= type :date))))
        (single-value-select block property value
                             (fn [] (select-item property type value opts))
                             select-opts
                             (assoc opts :editing? editing?))
        (case type
          :date
          (property-value-date-picker block property value (merge opts {:editing? editing?}))

          :checkbox
          (let [add-property! (fn []
                                (<add-property! block (:db/ident property)
                                                (boolean (not (db-property/property-value-content value)))))]
            [:label.flex.w-full.as-scalar-value-wrap.cursor-pointer
             (shui/checkbox {:class "jtrigger flex flex-row items-center"
                             :disabled config/publishing?
                             :auto-focus editing?
                             :checked (db-property/property-value-content value)
                             :on-checked-change add-property!
                             :on-key-down (fn [e]
                                            (when (= (util/ekey e) "Enter")
                                              (add-property!)))})])
        ;; :others
          [:div.flex.flex-1
           (if editing?
             (property-editing block property schema)
             (property-value-inner block property value opts))])))))

(rum/defc multiple-values < rum/static
  [block property v {:keys [on-chosen editing?] :as opts} schema]
  (let [type (get schema :type :default)
        date? (= type :date)
        *el (rum/use-ref nil)
        items (if (coll? v) v (when v [v]))]
    (rum/use-effect!
     (fn []
       (when editing?
         (.click (rum/deref *el))))
     [editing?])
    (let [values-cp (fn [toggle-fn]
                      (let [not-empty-value? (not= (map :db/ident items) [:logseq.property/empty-placeholder])]
                        (if (and (seq items) not-empty-value?)
                          (concat
                           (for [item items]
                             (rum/with-key (select-item property type item opts) (or (:block/uuid item) (str item))))
                           (when date?
                             [(property-value-date-picker block property nil {:toggle-fn toggle-fn})]))
                          (when-not editing?
                            (property-empty-text-value)))))
          select-cp (fn [select-opts]
                      (let [select-opts (merge {:multiple-choices? true
                                                :on-chosen (fn []
                                                             (when on-chosen (on-chosen)))}
                                               select-opts
                                               {:dropdown? false})]
                        [:div.property-select
                         (if (contains? #{:page :object} type)
                           (property-value-select-page block property
                                                       select-opts
                                                       opts)
                           (select block property select-opts opts))]))]
      (let [toggle-fn shui/popup-hide!
            content-fn (fn [{:keys [_id content-props]}]
                         (select-cp {:content-props content-props}))]
        [:div.multi-values.jtrigger
         {:tab-index "0"
          :ref *el
          :on-click (fn [^js e]
                      (let [target (.-target e)]
                        (when-not (or (util/link? target) (.closest target "a") config/publishing?)
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
         (values-cp toggle-fn)]))))

(rum/defcs property-value < rum/reactive
  [state block property v opts]
  (ui/catch-error
   (ui/block-error "Something wrong" {})
   (let [block-cp (state/get-component :block/blocks-container)
         opts (merge opts
                     {:page-cp (state/get-component :block/page-cp)
                      :inline-text (state/get-component :block/inline-text)
                      :editor-box (state/get-component :editor/box)
                      :block-cp block-cp
                      :properties-cp (state/get-component :block/properties-cp)})
         dom-id (str "ls-property-" (:db/id block) "-" (:db/id property))
         editor-id (str dom-id "-editor")
         schema (:block/schema property)
         type (some-> schema (get :type :default))
         multiple-values? (db-property/many? property)
         empty-value? (= :logseq.property/empty-placeholder v)
         v (cond
             (and multiple-values? (or (set? v) (and (coll? v) (empty? v)) (nil? v)))
             v
             multiple-values?
             #{v}
             (set? v)
             (first v)
             :else
             v)
         closed-values? (seq (:property/closed-values property))]
     [:div.property-value-inner
      {:data-type type
       :class (str (when empty-value? "empty-value")
                   (when-not (:other-position? opts) " w-full"))}
      (cond
        (and multiple-values? (= type :default) (not closed-values?))
        (property-normal-block-value block property v
                                     (assoc opts :id (str (:db/id block) "-" (:db/id property))))

        multiple-values?
        (multiple-values block property v opts schema)

        :else
        (property-scalar-value block property v
                               (merge
                                opts
                                {:editor-id editor-id
                                 :dom-id dom-id})))])))
