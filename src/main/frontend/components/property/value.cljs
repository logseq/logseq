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
            [dommy.core :as d]
            [frontend.search :as search]
            [goog.functions :refer [debounce]]))

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
                                                (select-keys icon [:type :id :color])))})
     (when (and icon-value (not config/publishing?))
       [:a.fade-link.flex {:on-click (fn [_e]
                                       (db-property-handler/remove-block-property!
                                        (:db/id block)
                                        :logseq.property/icon))
                           :title "Delete this icon"}
        (ui/icon "X")])]))

(defn- select-type?
  [property type]
  (or (contains? #{:node :number :url :date} type)
      ;; closed values
      (seq (:property/closed-values property))))

(defn <create-new-block!
  [block property value & {:keys [edit-block?]
                           :or {edit-block? true}}]
  (p/let [block
          (if (and (= :default (get-in property [:block/schema :type]))
                   (not (db-property/many? property)))
            (p/let [existing-value (get block (:db/ident property))
                    existing-value? (and (some? existing-value)
                                         (not= (:db/ident existing-value) :logseq.property/empty-placeholder))
                    new-block-id (when-not existing-value? (db/new-block-id))
                    _ (when-not existing-value?
                        (db-property-handler/create-property-text-block!
                         (:db/id block)
                         (:db/id property)
                         value
                         {:new-block-id new-block-id}))]
              (if existing-value? existing-value (db/entity [:block/uuid new-block-id])))
            (p/let [new-block-id (db/new-block-id)
                    _ (db-property-handler/create-property-text-block!
                       (:db/id block)
                       (:db/id property)
                       value
                       {:new-block-id new-block-id})]
              (db/entity [:block/uuid new-block-id])))]
    (when edit-block?
      (p/do!
       (editor-handler/edit-block! block :max {:container-id :unknown-container})
       (shui/popup-hide!)
       (shui/dialog-close!)))
    block))

(defn <add-property!
  "If a class and in a class schema context, add the property to its schema.
  Otherwise, add a block's property and its value"
  ([block property-key property-value] (<add-property! block property-key property-value {}))
  ([block property-id property-value' {:keys [exit-edit? class-schema?]
                                       :or {exit-edit? true}}]
   (let [repo (state/get-current-repo)
         class? (ldb/class? block)
         property (db/entity property-id)
         many? (db-property/many? property)
         checkbox? (= :checkbox (get-in property [:block/schema :type]))]
     (assert (qualified-keyword? property-id) "property to add must be a keyword")
     (p/do!
      (if (and class? class-schema?)
        (db-property-handler/class-add-property! (:db/id block) property-id)
        (if (and (db-property-type/ref-property-types (get-in property [:block/schema :type]))
                 (string? property-value'))
          (<create-new-block! block (db/entity property-id) property-value' {:edit-block? false})
          (property-handler/set-block-property! repo (:block/uuid block) property-id property-value')))
      (when exit-edit?
        (ui/hide-popups-until-preview-popup!)
        (shui/dialog-close!))
      (when-not (or many? checkbox?)
        (when-let [input (state/get-input)]
          (.focus input)))
      (when checkbox?
        (state/set-editor-action-data! {:type :focus-property-value
                                        :property property}))))))

(defn- add-or-remove-property-value
  [block property value selected? {:keys [refresh-result-f]}]
  (let [many? (db-property/many? property)]
    (p/do!
     (if selected?
       (<add-property! block (:db/ident property) value {:exit-edit? (not many?)})
       (p/do!
        (db-property-handler/delete-property-value! (:db/id block) (:db/ident property) value)
        (when (or (not many?)
                 ;; values will be cleared
                  (and many? (<= (count (get block (:db/ident property))) 1)))
          (shui/popup-hide!))))
     (when (fn? refresh-result-f) (refresh-result-f)))))

(rum/defcs calendar-inner <
  (rum/local (str "calendar-inner-" (js/Date.now)) ::identity)
  {:init (fn [state]
           (state/set-editor-action! :property-set-date)
           state)
   :will-mount (fn [state]
                 (js/setTimeout
                  #(some-> @(::identity state)
                           (js/document.getElementById)
                           (.querySelector "[aria-selected=true]")
                           (.focus)) 0)
                 state)
   :will-unmount (fn [state]
                   (shui/dialog-close!)
                   (state/set-editor-action! nil)
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
                 (ui/hide-popups-until-preview-popup!)
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
        title (when page (:block/title page))
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
        page-entity (ldb/get-case-page (db/get-db) page)
        id (:db/id page-entity)
        class? (= :block/tags (:db/ident property))
        ;; Note: property and other types shouldn't be converted to class
        page? (= "page" (:block/type page-entity))]
    (cond
      ;; page not exists or page exists but not a page type
      (or (nil? id) (and class? (not page?)))
      (let [inline-class-uuid
            (when inline-class
              (or (:block/uuid (ldb/get-case-page (db/get-db) inline-class))
                  (do (log/error :msg "Given inline class does not exist" :inline-class inline-class)
                      nil)))
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

      (and class? page? id)
      (p/let [_ (page-handler/convert-to-tag! page-entity)]
        id)

      :else
      id)))

(defn- select-aux
  [block property {:keys [items selected-choices multiple-choices?] :as opts}]
  (let [selected-choices (->> selected-choices
                              (remove nil?)
                              (remove #(= :logseq.property/empty-placeholder %)))
        clear-value (str "No " (:block/title property))
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

(defn- get-node-icon
  [node]
  (cond
    (ldb/class? node)
    "hash"
    (ldb/property? node)
    "letter-p"
    (ldb/page? node)
    "page"
    :else
    "letter-n"))

(rum/defcs ^:large-vars/cleanup-todo select-node < rum/reactive db-mixins/query
  (rum/local 0 ::refresh-count)
  [state property
   {:keys [block multiple-choices? dropdown? input-opts on-input] :as opts}
   *result]
  (let [*refresh-count (::refresh-count state)
        ;; Trigger refresh
        _ @*refresh-count
        repo (state/get-current-repo)
        classes (:property/schema.classes property)
        tags? (= :block/tags (:db/ident property))
        alias? (= :block/alias (:db/ident property))
        tags-or-alias? (or tags? alias?)
        block (db/entity (:db/id block))
        selected-choices (when block
                           (when-let [v (get block (:db/ident property))]
                             (if (every? de/entity? v)
                               (map :db/id v)
                               [(:db/id v)])))
        nodes
        (->>
         (cond
           (seq classes)
           (mapcat
            (fn [class]
              (if (= :logseq.class/Root (:db/ident class))
                (model/get-all-classes repo {:except-root-class? true})
                (model/get-class-objects repo (:db/id class))))
            classes)

           :else
           (let [result (rum/react *result)]
             (if (empty? result)
               (let [v (get block (:db/ident property))]
                 (remove #(= :logseq.property/empty-placeholder (:db/ident %))
                         (if (every? de/entity? v) v [v])))
               (remove (fn [node]
                         (or (= (:db/id block) (:db/id node))
                              ;; A page's alias can't be itself
                             (and alias? (= (or (:db/id (:block/page block))
                                                (:db/id block))
                                            (:db/id node)))))
                       result)))))
        options (map (fn [node]
                       (let [id (or (:value node) (:db/id node))
                             label (if (integer? id)
                                     (let [title (subs (:block/title node) 0 256)
                                           node (or (db/entity id) node)
                                           icon (get-node-icon node)]
                                       [:div.flex.flex-row.items-center.gap-1
                                        (when-not (:property/schema.classes property)
                                          (ui/icon icon {:size 14}))
                                        [:div title]])
                                     (or (:label node) (:block/title node)))]
                         (assoc node
                                :label-value (:block/title node)
                                :label label
                                :value id))) nodes)
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
                                              "Choose nodes"
                                              :else
                                              "Choose node")
                 :show-new-when-not-exact-match? true
                 :extract-chosen-fn :value
                 :extract-fn (fn [x] (or (:label-value x) (:label x)))
                 :input-opts input-opts
                 :on-input (debounce on-input 50)
                 :on-chosen (fn [chosen selected?]
                              (p/let [[id new?] (if (integer? chosen)
                                                  [chosen false]
                                                  (when-not (string/blank? (string/trim chosen))
                                                    (p/let [result (<create-page-if-not-exists! property classes' chosen)]
                                                      [result true])))
                                      _ (when (and (integer? id) (not (ldb/page? (db/entity id))))
                                          (db-async/<get-block repo id))]
                                (p/do!
                                 (if id
                                   (add-or-remove-property-value block property id selected? {})
                                   (log/error :msg "No :db/id found or created for chosen" :chosen chosen))
                                 (when new? (swap! *refresh-count inc)))))})

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
                                          (filter #(string/includes? (:block/title %) class-input))
                                          (mapv (fn [p]
                                                  {:value (str new-page "#" (:block/title p))
                                                   :label (str new-page "#" (:block/title p))}))))
                                   results))))]
    (select-aux block property opts')))

(rum/defcs property-value-select-node <
  (rum/local nil ::result)
  [state block property opts
   {:keys [*show-new-property-config?]}]
  (let [*result (::result state)
        input-opts (fn [_]
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
                     :input-opts input-opts
                     :on-input (fn [v]
                                 (if (string/blank? v)
                                   (reset! *result nil)
                                   (p/let [result (search/block-search (state/get-current-repo) v {:enable-snippet? false
                                                                                                   :built-in? false})]
                                     (reset! *result result)))))]
    (select-node property opts' *result)))

(rum/defcs select < rum/reactive db-mixins/query
  {:init (fn [state]
           (let [*values (atom :loading)
                 refresh-result-f (fn []
                                    (p/let [result (db-async/<get-block-property-values (state/get-current-repo)
                                                                                        (:db/ident (nth (:rum/args state) 1)))]
                                      (reset! *values result)))]
             (refresh-result-f)
             (assoc state
                    ::values *values
                    ::refresh-result-f refresh-result-f)))}
  [state block property
   {:keys [multiple-choices? dropdown? content-props] :as select-opts}
   {:keys [*show-new-property-config?]}]
  (let [*values (::values state)
        refresh-result-f (::refresh-result-f state)
        values (rum/react *values)
        block (db/sub-block (:db/id block))]
    (when-not (= :loading values)
      (let [schema (:block/schema property)
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
                               :value (:db/id block)
                               :label-value value})) (:property/closed-values property))
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
                         (map (fn [m] (let [label (:block/title (db/entity (:value m)))]
                                        (when label
                                          (assoc m :label label)))) items)
                         items)
                       (remove nil?))
            on-chosen (fn [chosen selected?]
                        (let [value (if (map? chosen) (:value chosen) chosen)]
                          (add-or-remove-property-value block property value selected?
                                                        {:refresh-result-f refresh-result-f})))
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
                     :extract-fn (fn [x] (or (:label-value x) (:label x)))
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

(rum/defcs property-normal-block-value <
  {:init (fn [state]
           (assoc state :container-id (state/get-next-container-id)))}
  [state block property value-block]
  (let [container-id (:container-id state)
        multiple-values? (db-property/many? property)
        block-container (state/get-component :block/container)
        blocks-container (state/get-component :block/blocks-container)
        value-block (if (and (coll? value-block) (every? de/entity? value-block))
                      (set (remove #(= (:db/ident %) :logseq.property/empty-placeholder) value-block))
                      value-block)]
    (if (seq value-block)
      [:div.property-block-container.content.w-full
       (let [config {:id (str (if multiple-values?
                                (:block/uuid block)
                                (:block/uuid value-block)))
                     :container-id container-id
                     :editor-box (state/get-component :editor/box)
                     :property-block? true}]
         (if (set? value-block)
           (blocks-container config (ldb/sort-by-order value-block))
           (block-container config value-block)))]
      [:div
       {:tabIndex 0
        :on-click (fn [] (<create-new-block! block property ""))}
       (property-empty-btn-value)])))

(rum/defcs property-block-value < rum/reactive db-mixins/query
  {:init (fn [state]
           (let [block (first (:rum/args state))]
             (when-let [block-id (or (:db/id block) (:block/uuid block))]
               (db-async/<get-block (state/get-current-repo) block-id :children? true)))
           state)}
  [state value block property page-cp]
  (when value
    (if (state/sub-async-query-loading value)
      [:div.text-sm.opacity-70 "loading"]
      (if-let [v-block (db/sub-block (:db/id value))]
        (let [class? (ldb/class? v-block)
              invalid-warning [:div.warning.text-sm
                               "Invalid block value, please delete the current property."]]
          (when v-block
            (cond
              (:block/page v-block)
              (property-normal-block-value block property v-block)

                ;; page/class/etc.
              (:block/name v-block)
              (rum/with-key
                (page-cp {:disable-preview? true
                          :hide-close-button? true
                          :tag? class?} v-block)
                (:db/id v-block))
              :else
              invalid-warning)))
        (property-empty-btn-value)))))

(rum/defc closed-value-item < rum/reactive db-mixins/query
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

       (or (ldb/page? value)
           (and (seq (:block/tags value))
                ;; FIXME: page-cp should be renamed to node-cp and
                ;; support this case and maybe other complex cases.
                (not (string/includes? (:block/title value) "[["))))
       (when value
         (rum/with-key
           (page-cp {:disable-preview? true
                     :tag? tag?
                     :hide-close-button? true
                     :meta-click? other-position?} value)
           (:db/id value)))

       (= type :node)
       (when-let [reference (state/get-component :block/reference)]
         (reference {} (:block/uuid value)))

       closed-values?
       (closed-value-item value opts)

       (de/entity? value)
       (when-some [content (if (some? (:property.value/content value))
                             ;; content needs to be a string for display purposes
                             (str (:property.value/content value))
                             (:block/title value))]
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

                             (:node :date)
                             (property-value-select-node block property select-opts' opts))])
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

(defn- property-value-inner
  [block property value {:keys [inline-text page-cp
                                dom-id row?]}]
  (let [schema (:block/schema property)
        multiple-values? (db-property/many? property)
        class (str (when-not row? "flex flex-1 ")
                   (when multiple-values? "property-value-content"))
        type (:type schema)]
    [:div.cursor-text
     {:id (or dom-id (random-uuid))
      :tabIndex 0
      :class (str class " " (when-not (= type :default) "jtrigger"))
      :style {:min-height 24}
      :on-click (fn []
                  (when (and (= type :default) (nil? value))
                    (<create-new-block! block property "")))}
     (cond
       (and (= type :default) (nil? (:block/title value)))
       [:div.jtrigger (property-empty-btn-value)]

       (= type :default)
       (property-block-value value block property page-cp)

       :else
       (inline-text {} :markdown (macro-util/expand-value-if-macro (str value) (state/get-macros))))]))

(rum/defcs property-scalar-value < rum/reactive db-mixins/query rum/static
  [state block property value* {:keys [container-id editing? on-chosen]
                                :as opts}]
  (let [property (model/sub-block (:db/id property))
        schema (:block/schema property)
        type (get schema :type :default)
        editing? (or editing?
                     (and (state/sub-editing? [container-id (:block/uuid block)])
                          (= (:db/id property) (:db/id (:property (state/get-editor-action-data))))))
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
          (let [add-property! (fn [] (<add-property! block (:db/ident property) (boolean (not value))))]
            [:label.flex.w-full.as-scalar-value-wrap.cursor-pointer
             (shui/checkbox {:class "jtrigger flex flex-row items-center"
                             :disabled config/publishing?
                             :auto-focus editing?
                             :checked value
                             :on-checked-change add-property!
                             :on-key-down (fn [e]
                                            (when (= (util/ekey e) "Enter")
                                              (add-property!)))})])
        ;; :others
          [:div.flex.flex-1
           (property-value-inner block property value opts)])))))

(rum/defc multiple-values-inner
  [block property v {:keys [on-chosen editing?] :as opts} schema]
  (let [type (get schema :type :default)
        date? (= type :date)
        *el (rum/use-ref nil)
        items (if (de/entity? v) #{v} v)]
    (rum/use-effect!
     (fn []
       (when editing?
         (.click (rum/deref *el))))
     [editing?])
    (let [select-cp (fn [select-opts]
                      (let [select-opts (merge {:multiple-choices? true
                                                :on-chosen (fn []
                                                             (when on-chosen (on-chosen)))}
                                               select-opts
                                               {:dropdown? false})]
                        [:div.property-select
                         (if (= :node type)
                           (property-value-select-node block property
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
         (let [not-empty-value? (not= (map :db/ident items) [:logseq.property/empty-placeholder])]
           (if (and (seq items) not-empty-value?)
             (concat
              (for [item items]
                (rum/with-key (select-item property type item opts) (or (:block/uuid item) (str item))))
              (when date?
                [(property-value-date-picker block property nil {:toggle-fn toggle-fn})]))
             (when-not editing?
               (if date?
                 [(property-empty-text-value) (property-value-date-picker block property nil {:toggle-fn toggle-fn})]
                 (property-empty-text-value)))))]))))

(rum/defc multiple-values < rum/reactive db-mixins/query
  [block property opts schema]
  (let [block (db/sub-block (:db/id block))
        value (get block (:db/ident property))
        value' (if (coll? value) value
                   (when (some? value) #{value}))]
    (multiple-values-inner block property value' opts schema)))

(rum/defcs property-value < rum/reactive
  [state block property v {:keys [show-tooltip?]
                           :as opts}]
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
         v (cond
             (and multiple-values? (or (set? v) (and (coll? v) (empty? v)) (nil? v)))
             v
             multiple-values?
             #{v}
             (set? v)
             (first v)
             :else
             v)
         empty-value? (when (coll? v) (= :logseq.property/empty-placeholder (:db/ident (first v))))
         closed-values? (seq (:property/closed-values property))
         value-cp [:div.property-value-inner
                   {:data-type type
                    :class (str (when empty-value? "empty-value")
                                (when-not (:other-position? opts) " w-full"))}
                   (cond
                     (and multiple-values? (= type :default) (not closed-values?))
                     (property-normal-block-value block property v)

                     multiple-values?
                     (multiple-values block property opts schema)

                     :else
                     (property-scalar-value block property v
                                            (merge
                                             opts
                                             {:editor-id editor-id
                                              :dom-id dom-id})))]]
     (if show-tooltip?
       (shui/tooltip-provider
        (shui/tooltip
         {:delayDuration 1200}
         (shui/tooltip-trigger
          {:onFocusCapture #(util/stop-propagation %)} value-cp)
         (shui/tooltip-content
          (str "Change " (:block/title property)))))
       value-cp))))
