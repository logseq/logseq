(ns frontend.components.property.value
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.set :as set]
            [clojure.string :as string]
            [dommy.core :as d]
            [frontend.components.icon :as icon-component]
            [frontend.components.select :as select]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.model :as model]
            [frontend.handler.block :as block-handler]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.route :as route-handler]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.functions :refer [debounce]]
            [lambdaisland.glogi :as log]
            [logseq.common.util.macro :as macro-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.outliner.property :as outliner-property]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- entity-map?
  [m]
  (and (map? m) (:db/id m)))

(rum/defc property-empty-btn-value
  [property & opts]
  (let [text (cond
               (= (:db/ident property) :logseq.property/description)
               "Add description"
               :else
               "Empty")]
    (if (= text "Empty")
      (shui/button (merge {:class "empty-btn" :variant :text} opts)
                   text)
      (shui/button (merge {:class "empty-btn" :variant :text} opts)
                   text))))

(rum/defc property-empty-text-value
  [property {:keys [property-position table-view?]}]
  [:span.inline-flex.items-center.cursor-pointer.w-full
   (merge {:class "empty-text-btn" :variant :text})
   (when-not table-view?
     (if property-position
       (if-let [icon (:logseq.property/icon property)]
         (icon-component/icon icon {:color? true})
         (ui/icon "line-dashed"))
       "Empty"))])

(defn- get-selected-blocks
  []
  (some->> (state/get-selection-block-ids)
           (map (fn [id] (db/entity [:block/uuid id])))
           (seq)
           block-handler/get-top-level-blocks
           (remove ldb/property?)))

(defn get-operating-blocks
  [block]
  (let [selected-blocks (get-selected-blocks)
        view-selected-blocks (:view/selected-blocks @state/state)]
    (or (seq selected-blocks)
        (seq view-selected-blocks)
        [block])))

(defn batch-operation?
  []
  (let [selected-blocks (get-selected-blocks)
        view-selected-blocks (:view/selected-blocks @state/state)]
    (or (> (count selected-blocks) 1)
        (seq view-selected-blocks))))

(rum/defc icon-row
  [block editing?]
  (hooks/use-effect!
   (fn []
     (fn []
       (when editing?
         (editor-handler/restore-last-saved-cursor!)))))
  (let [icon-value (:logseq.property/icon block)
        clear-overlay! (fn []
                         (shui/popup-hide-all!))
        on-chosen! (fn [_e icon]
                     (let [repo (state/get-current-repo)
                           blocks (get-operating-blocks block)]
                       (property-handler/batch-set-block-property!
                        repo
                        (map :db/id blocks)
                        :logseq.property/icon
                        (when icon (select-keys icon [:type :id :color]))))
                     (clear-overlay!)
                     (when editing?
                       (editor-handler/restore-last-saved-cursor!)))
        icon (get block :logseq.property/icon)]
    (if editing?
      (icon-component/icon-search
       {:on-chosen on-chosen!
        :icon-value icon
        :del-btn? (some? icon)})
      [:div.col-span-3.flex.flex-row.items-center.gap-2
       (icon-component/icon-picker icon-value
                                   {:disabled? config/publishing?
                                    :del-btn? (some? icon-value)
                                    :on-chosen on-chosen!})])))

(defn select-type?
  [block property]
  (let [type (:logseq.property/type property)]
    (or (contains? #{:node :number :date :page :class :property} type)
       ;; closed values
        (seq (:property/closed-values property))
        (and (= (:db/ident property) :logseq.property/default-value)
             (= (:logseq.property/type block) :number)))))

(defn <create-new-block!
  [block property value & {:keys [edit-block? batch-op?]
                           :or {edit-block? true}}]
  (when-not (or (:logseq.property/hide? property)
                (= (:db/ident property) :logseq.property/default-value))
    (ui/hide-popups-until-preview-popup!))
  (let [<create-block (fn [block]
                        (if (and (contains? #{:default :url} (:logseq.property/type property))
                                 (not (db-property/many? property)))
                          (p/let [default-value (:logseq.property/default-value property)
                                  new-block-id (db/new-block-id)
                                  _ (let [value' (if (and default-value (string? value) (string/blank? value))
                                                   (db-property/property-value-content default-value)
                                                   value)]
                                      (db-property-handler/create-property-text-block!
                                       (:db/id block)
                                       (:db/id property)
                                       value'
                                       {:new-block-id new-block-id}))]
                            (db/entity [:block/uuid new-block-id]))
                          (p/let [new-block-id (db/new-block-id)
                                  _ (db-property-handler/create-property-text-block!
                                     (:db/id block)
                                     (:db/id property)
                                     value
                                     {:new-block-id new-block-id})]
                            (db/entity [:block/uuid new-block-id]))))]
    (p/let [blocks (if batch-op?
                     (p/all (map <create-block (get-operating-blocks block)))
                     (p/let [new-block (<create-block block)]
                       [new-block]))]
      (let [first-block (first blocks)]
        (when edit-block?
          (editor-handler/edit-block! first-block :max {:container-id :unknown-container}))
        first-block))))

(defn <add-property!
  "If a class and in a class schema context, add the property to its schema.
  Otherwise, add a block's property and its value"
  ([block property-id property-value] (<add-property! block property-id property-value {}))
  ([block property-id property-value {:keys [selected? exit-edit? class-schema? entity-id?]
                                      :or {exit-edit? true}}]
   (let [repo (state/get-current-repo)
         class? (ldb/class? block)
         property (db/entity property-id)
         many? (db-property/many? property)
         checkbox? (= :checkbox (:logseq.property/type property))
         blocks (get-operating-blocks block)]
     (when-not (ldb/class? property)
       (assert (qualified-keyword? property-id) "property to add must be a keyword")
       (p/do!
        (if (and class? class-schema?)
          (db-property-handler/class-add-property! (:db/id block) property-id)
          (let [block-ids (map :block/uuid blocks)
                set-query-list-view? (and (:logseq.property/query block)
                                          (= property-id :logseq.property.view/type)
                                          (= property-value (:db/id (db/entity :logseq.property.view/type.list))))]
            (ui-outliner-tx/transact!
             {:outliner-op :set-block-property}
             (property-handler/batch-set-block-property! repo block-ids property-id property-value {:entity-id? entity-id?})
             (when (and set-query-list-view?
                        (nil? (:logseq.property.view/group-by-property block)))
               (property-handler/batch-set-block-property! repo block-ids :logseq.property.view/group-by-property
                                                           (:db/id (db/entity :block/page))
                                                           {:entity-id? entity-id?})))))
        (when (seq (:view/selected-blocks @state/state))
          (notification/show! "Property updated!" :success))
        (when-not many?
          (cond
            exit-edit?
            (ui/hide-popups-until-preview-popup!)
            selected?
            (shui/popup-hide!)))
        (when-not (or many? checkbox?)
          (when-let [input (state/get-input)]
            (.focus input)))
        (when checkbox?
          (state/set-editor-action-data! {:type :focus-property-value
                                          :property property})))))))

(defn- add-or-remove-property-value
  [block property value selected? {:keys [refresh-result-f entity-id?] :as opts}]
  (let [many? (db-property/many? property)
        blocks (get-operating-blocks block)
        repo (state/get-current-repo)]
    (p/do!
     (db-async/<get-block repo (:db/id block) {:children? false})
     (when (and selected?
                (= :db.type/ref (:db/valueType property))
                (number? value)
                (not (db/entity value)))
       (db-async/<get-block repo value {:children? false}))
     (if selected?
       (<add-property! block (:db/ident property) value
                       {:selected? selected?
                        :entity-id? entity-id?
                        :exit-edit? (if (some? (:exit-edit? opts)) (:exit-edit? opts) (not many?))})
       (p/do!
        (ui-outliner-tx/transact!
         {:outliner-op :save-block}
         (db-property-handler/batch-delete-property-value! (map :db/id blocks) (:db/ident property) value))
        (when (or (not many?)
                  ;; values will be cleared
                  (and many? (<= (count (get block (:db/ident property))) 1)))
          (shui/popup-hide!))))
     (when (fn? refresh-result-f) (refresh-result-f)))))

(declare property-value)
(rum/defc repeat-setting < rum/reactive db-mixins/query
  [block property]
  (let [opts {:exit-edit? false}
        block (db/sub-block (:db/id block))]
    [:div.p-4.hidden.sm:flex.flex-col.gap-4.w-64
     [:div.mb-4
      [:div.flex.flex-row.items-center.gap-1
       [:div.w-4
        (property-value block (db/entity :logseq.property.repeat/repeated?)
                        (assoc opts
                               :on-checked-change (fn [value]
                                                    (if value
                                                      (db-property-handler/set-block-property! (:db/id block)
                                                                                               :logseq.property.repeat/temporal-property
                                                                                               (:db/id property))
                                                      (db-property-handler/remove-block-property! (:db/id block)
                                                                                                  :logseq.property.repeat/temporal-property)))))]
       (if (#{:logseq.property/deadline :logseq.property/scheduled} (:db/ident property))
         [:div "Repeat task"]
         [:div "Repeat " (if (= :date (:logseq.property/type property)) "date" "datetime")])]]
     [:div.flex.flex-row.gap-2.ls-repeat-task-frequency
      [:div.flex.text-muted-foreground
       "Every"]

      ;; recur frequency
      [:div.w-10.mr-2
       (property-value block (db/entity :logseq.property.repeat/recur-frequency) opts)]

      ;; recur unit
      [:div.w-20
       (property-value block (db/entity :logseq.property.repeat/recur-unit) (assoc opts :property property))]]
     (let [properties (->>
                       (outliner-property/get-block-full-properties (db/get-db) (:db/id block))
                       (filter (fn [property]
                                 (and (not (ldb/built-in? property))
                                      (>= (count (:property/closed-values property)) 2))))
                       (concat [(db/entity :logseq.property/status)])
                       (util/distinct-by :db/id))
           status-property (or (:logseq.property.repeat/checked-property block)
                               (db/entity :logseq.property/status))
           property-id (:db/id status-property)
           done-choice (or
                        (some (fn [choice] (when (true? (:logseq.property/choice-checkbox-state choice)) choice)) (:property/closed-values status-property))
                        (db/entity :logseq.property/status.done))]
       [:div.flex.flex-col.gap-2
        [:div.text-muted-foreground
         "When"]
        (shui/select
         (cond->
          {:on-value-change (fn [v]
                              (db-property-handler/set-block-property! (:db/id block)
                                                                       :logseq.property.repeat/checked-property
                                                                       v))}
           property-id
           (assoc :default-value property-id))
         (shui/select-trigger
          (shui/select-value {:placeholder "Select a property"}))
         (shui/select-content
          (map (fn [choice]
                 (shui/select-item {:key (str (:db/id choice))
                                    :value (:db/id choice)} (:block/title choice))) properties)))
        [:div.flex.flex-row.gap-1
         [:div.text-muted-foreground
          "is:"]
         (when done-choice
           (db-property/property-value-content done-choice))]])]))

(rum/defcs calendar-inner < rum/reactive db-mixins/query
  (rum/local (str "calendar-inner-" (js/Date.now)) ::identity)
  {:init (fn [state]
           (state/set-editor-action! :property-set-date)
           state)
   :will-mount (fn [state]
                 (js/setTimeout
                  #(some-> @(::identity state)
                           (js/document.getElementById)
                           (.querySelector "[aria-selected=true]")
                           (.focus)) 16)
                 state)
   :will-unmount (fn [state]
                   (shui/popup-hide!)
                   (state/set-editor-action! nil)
                   state)}
  [state id {:keys [block property datetime? on-change del-btn? on-delete]}]
  (let [block (db/sub-block (:db/id block))
        value (get block (:db/ident property))
        value (cond
                (map? value)
                (when-let [day (:block/journal-day value)]
                  (let [t (date/journal-day->utc-ms day)]
                    (js/Date. t)))

                (number? value)
                (js/Date. value)

                :else
                (let [d (js/Date.)]
                  (.setHours d 0 0 0)
                  d))
        *ident (::identity state)
        initial-day value
        initial-month (when value
                        (let [d (tc/to-date-time value)]
                          (js/Date. (t/last-day-of-the-month (t/date-time (t/year d) (t/month d))))))
        select-handler!
        (fn [^js d]
          (when d
            (let [journal (date/js-date->journal-title d)]
              (p/do!
               (when-not (model/get-journal-page journal)
                 (page-handler/<create! journal {:redirect? false}))
               (when (fn? on-change)
                 (let [value (if datetime? (tc/to-long d) (model/get-journal-page journal))]
                   (on-change value)))
               (when-not datetime?
                 (shui/popup-hide! id)
                 (ui/hide-popups-until-preview-popup!))))))]
    [:div.flex.flex-row.gap-2
     [:div.flex.flex-1.items-center
      (ui/nlp-calendar
       (cond->
        {:initial-focus true
         :datetime? datetime?
         :selected initial-day
         :id @*ident
         :del-btn? del-btn?
         :on-delete on-delete
         :on-day-click select-handler!}
         initial-month
         (assoc :default-month initial-month)))]
     [:div.hidden.sm:initial
      (shui/separator {:orientation "vertical"})]
     (repeat-setting block property)]))

(rum/defc overdue
  [date content]
  (let [[current-time set-current-time!] (hooks/use-state (t/now))]
    (hooks/use-effect!
     (fn []
       (let [timer (js/setInterval (fn [] (set-current-time! (t/now))) (* 1000 60 3))]
         #(js/clearInterval timer)))
     [])
    (let [overdue? (when date (t/after? current-time (t/plus date (t/seconds 59))))]
      [:div
       (cond-> {} overdue? (assoc :class "overdue"
                                  :title "Overdue"))
       content])))

(defn- start-of-local-day [^js d]
  ;; clone the date and reset to local midnight
  (doto (js/Date. d)
    (.setHours 0 0 0 0)))

(defn- human-date-label [utc-ms]
  ;; utc-ms is stored deadline/scheduled time
  (let [given-date (start-of-local-day (js/Date. utc-ms))
        today      (start-of-local-day (js/Date.))
        ms-in-day  (* 24 60 60 1000)
        tomorrow   (js/Date. (+ (.getTime today) ms-in-day))
        yesterday  (js/Date. (- (.getTime today) ms-in-day))]
    (cond
      (= (.getTime given-date) (.getTime yesterday)) "Yesterday"
      (= (.getTime given-date) (.getTime today))     "Today"
      (= (.getTime given-date) (.getTime tomorrow))  "Tomorrow"
      :else nil)))

(rum/defc datetime-value
  [value property-id repeated-task?]
  (when-let [date (t/to-default-time-zone (tc/from-long value))]
    (let [content [:div.ls-datetime.flex.flex-row.gap-1.items-center
                   (when-let [page-cp (state/get-component :block/page-cp)]
                     (let [page-title (date/journal-name date)]
                       (rum/with-key
                         (page-cp {:disable-preview? true
                                   :show-non-exists-page? true
                                   :label (human-date-label value)}
                                  {:block/name page-title})
                         page-title)))
                   (let [date (js/Date. value)
                         hours (.getHours date)
                         minutes (.getMinutes date)]
                     [:span.select-none
                      (if (= 0 hours minutes)
                        (ui/icon "edit" {:size 14 :class "text-muted-foreground hover:text-foreground align-middle"})
                        (str (util/zero-pad hours)
                             ":"
                             (util/zero-pad minutes)))])]]
      (if (or repeated-task? (contains? #{:logseq.property/deadline :logseq.property/scheduled} property-id))
        (overdue date content)
        content))))

(defn- delete-block-property!
  [block property]
  (editor-handler/move-cross-boundary-up-down :up {})
  (property-handler/remove-block-property! (state/get-current-repo)
                                           (:db/id block)
                                           (:db/ident property)))

(rum/defc date-picker
  [value {:keys [block property datetime? on-change on-delete del-btn? editing? multiple-values? other-position?]}]
  (let [*el (hooks/use-ref nil)
        content-fn (fn [{:keys [id]}] (calendar-inner id
                                                      {:block block
                                                       :property property
                                                       :on-change on-change
                                                       :value value
                                                       :del-btn? del-btn?
                                                       :on-delete on-delete
                                                       :datetime? datetime?}))
        open-popup! (fn [e]
                      (when-not (or (util/meta-key? e) (util/shift-key? e))
                        (util/stop e)
                        (editor-handler/save-current-block!)
                        (when-not config/publishing?
                          (shui/popup-show! (.-target e) content-fn
                                            {:align "start" :auto-focus? true}))))
        repeated-task? (:logseq.property.repeat/repeated? block)]
    (if editing?
      (content-fn {:id :date-picker})
      (if multiple-values?
        (shui/button
         {:class "jtrigger h-6 empty-btn"
          :variant :text
          :size :sm
          :on-click open-popup!
          :on-key-down (fn [e]
                         (when (contains? #{"Backspace" "Delete"} (util/ekey e))
                           (delete-block-property! block property)))}
         (ui/icon "calendar-plus" {:size 16}))
        (shui/trigger-as
         :div.flex.flex-1.flex-row.gap-1.items-center.flex-wrap
         {:ref *el
          :tabIndex 0
          :class "jtrigger min-h-[24px]"                     ; FIXME: min-h-6 not works
          :on-click open-popup!
          :on-key-down (fn [e]
                         (case (util/ekey e)
                           ("Backspace" "Delete")
                           (delete-block-property! block property)
                           (" " "Enter")
                           (do (some-> (rum/deref *el) (.click))
                               (util/stop e))
                           nil))}
         [:div.flex.flex-row.gap-1.items-center
          (when repeated-task?
            (ui/icon "repeat" {:size 14 :class "opacity-40"}))
          (cond
            (map? value)
            (let [date (tc/to-date-time (date/journal-day->utc-ms (:block/journal-day value)))
                  compare-value (some-> date
                                        (t/plus (t/days 1))
                                        (t/minus (t/seconds 1)))
                  content (when-let [page-cp (state/get-component :block/page-cp)]
                            (rum/with-key
                              (page-cp {:disable-preview? true
                                        :meta-click? other-position?
                                        :label (human-date-label value)} value)
                              (:db/id value)))]
              (if (or repeated-task? (contains? #{:logseq.property/deadline :logseq.property/scheduled} (:db/id property)))
                (overdue compare-value content)
                content))

            (number? value)
            (datetime-value value (:db/ident property) repeated-task?)

            :else
            (property-empty-btn-value nil))])))))

(rum/defc property-value-date-picker
  [block property value opts]
  (let [multiple-values? (db-property/many? property)
        repo (state/get-current-repo)
        datetime? (= :datetime (:logseq.property/type property))]
    (date-picker value
                 (merge opts
                        {:block block
                         :property property
                         :datetime? datetime?
                         :multiple-values? multiple-values?
                         :on-change (fn [value]
                                      (let [blocks (get-operating-blocks block)]
                                        (property-handler/batch-set-block-property! repo (map :block/uuid blocks)
                                                                                    (:db/ident property)
                                                                                    (if datetime?
                                                                                      value
                                                                                      (:db/id value)))))
                         :del-btn? (some? value)
                         :on-delete (fn [e]
                                      (util/stop-propagation e)
                                      (let [blocks (get-operating-blocks block)]
                                        (property-handler/batch-set-block-property! repo (map :block/uuid blocks)
                                                                                    (:db/ident property)
                                                                                    nil))
                                      (shui/popup-hide!))}))))

(defn- <create-page-if-not-exists!
  [block property classes page]
  (let [page* (string/trim page)
        ;; inline-class is only for input from :transform-fn
        [page inline-class] (if (and (seq classes) (not (contains? db-property/db-attribute-properties (:db/ident property))))
                              (or (seq (map string/trim (rest (re-find #"(.*)#(.*)$" page*))))
                                  [page* nil])
                              [page* nil])
        page-entity (ldb/get-case-page (db/get-db) page)
        id (:db/id page-entity)
        class? (or (= :block/tags (:db/ident property))
                   (and (= :logseq.property.class/extends (:db/ident property))
                        (ldb/class? block))
                   (let [classes (:logseq.property/classes property)]
                     (and (seq classes)
                          (every? (fn [class]
                                    (or
                                     (= :logseq.class/Tag (:db/ident class))
                                     (some (fn [e]
                                             (= :logseq.class/Tag (:db/ident e)))
                                           (ldb/get-class-extends class))))
                                  classes))))
        ;; Note: property and other types shouldn't be converted to class
        page? (ldb/internal-page? page-entity)]
    (cond
      ;; page not exists or page exists but not a page type
      (or (nil? id) (and class? (not page?)))
      (let [inline-class-uuid
            (when inline-class
              (or (:block/uuid (ldb/get-case-page (db/get-db) inline-class))
                  (do (log/error :msg "Given inline class does not exist" :inline-class inline-class)
                      nil)))
            create-options {:redirect? false
                            :tags (if inline-class-uuid
                                    [inline-class-uuid]
                                    ;; Only 1st class b/c page normally has
                                    ;; one of and not all these classes
                                    (let [tag (db/entity :logseq.class/Tag)
                                          classes' (if (= (map :db/id classes) [(:db/id tag)])
                                                     classes
                                                     (->> (remove (fn [c] (= (:db/id c) (:db/id tag))) classes)
                                                          (take 1)))]
                                      (mapv :block/uuid classes')))}]
        (p/let [page (if class?
                       (db-page-handler/<create-class! page create-options)
                       (page-handler/<create! page create-options))]
          (:db/id page)))

      (and class? page? id)
      (p/let [_ (db-page-handler/convert-page-to-tag! page-entity)]
        id)

      :else
      id)))

(defn- sort-select-items
  [property selected-choices items]
  (if (:property/closed-values property)
    items                   ; sorted by order
    (sort-by
     (juxt (fn [item] (not (selected-choices (:db/id item))))
           db-property/property-value-content)
     items)))

(rum/defc select-aux
  [block property {:keys [items selected-choices multiple-choices?] :as opts}]
  (let [selected-choices (->> selected-choices
                              (remove nil?)
                              (remove #(= :logseq.property/empty-placeholder %))
                              set)
        clear-value (str "No " (:block/title property))
        clear-value-label [:div.flex.flex-row.items-center.gap-1.text-sm
                           (ui/icon "x" {:size 14})
                           [:div clear-value]]
        [sorted-items set-items!] (hooks/use-state (sort-select-items property selected-choices items))
        items' (->>
                (if (and (seq selected-choices)
                         (not multiple-choices?)
                         (not (and (ldb/class? block) (= (:db/ident property) :logseq.property.class/extends)))
                         (not= (:db/ident property) :logseq.property.view/type))
                  (concat sorted-items
                          (when-not (or (= (:logseq.property/default-value property)
                                           (get block (:db/ident property)))
                                        (= (:logseq.property/scalar-default-value property)
                                           (get block (:db/ident property))))
                            [{:value clear-value
                              :label clear-value-label
                              :clear? true}]))
                  sorted-items)
                (remove #(= :logseq.property/empty-placeholder (:value %))))
        k :on-chosen
        f (get opts k)
        f' (fn [chosen selected?]
             (if (or (and (not multiple-choices?) (= chosen clear-value))
                     (and multiple-choices? (= chosen [clear-value])))
               (p/do!
                (let [blocks (get-operating-blocks block)
                      block-ids (map :block/uuid blocks)]
                  (property-handler/batch-remove-block-property!
                   (state/get-current-repo)
                   block-ids
                   (:db/ident property)))
                (when-not (false? (:exit-edit? opts))
                  (shui/popup-hide!)))
               (f chosen selected?)))]
    (hooks/use-effect!
     (fn []
       (when-not (= (count items) (count sorted-items))
         (set-items! (sort-select-items property selected-choices items))))
     [items])
    (select/select (assoc opts
                          :selected-choices selected-choices
                          :items items'
                          :close-modal? false
                          k f'))))

(rum/defc ^:large-vars/cleanup-todo select-node < rum/static
  [property
   {:keys [block multiple-choices? dropdown? input-opts on-input add-new-choice! target] :as opts}
   result]
  (let [[*input set-input!] (hooks/use-state nil)
        repo (state/get-current-repo)
        classes (:logseq.property/classes property)
        tags? (= :block/tags (:db/ident property))
        alias? (= :block/alias (:db/ident property))
        tags-or-alias? (or tags? alias?)
        block (or (db/entity (:db/id block)) block)
        selected-choices (when block
                           (when-let [v (get block (:db/ident property))]
                             (if (every? entity-map? v)
                               (map :db/id v)
                               [(:db/id v)])))
        extends-property? (= (:db/ident property) :logseq.property.class/extends)
        children-pages (when extends-property? (model/get-structured-children repo (:db/id block)))
        property-type (:logseq.property/type property)
        nodes (cond
                extends-property?
                (let [extends (->> (mapcat (fn [e] (ldb/get-class-extends e)) (:logseq.property.class/extends block))
                                   distinct)
                      ;; Disallows cyclic hierarchies
                      exclude-ids (-> (set (map (fn [id] (:block/uuid (db/entity id))) children-pages))
                                      (conj (:block/uuid block)) ; break cycle
                                      ;; hide parent extends for existing values
                                      (set/union (set (map :block/uuid extends))))
                      options (if (ldb/class? block)
                                (model/get-all-classes repo {:except-extends-hidden-tags? true})
                                result)

                      excluded-options (->> options
                                            (remove (fn [e] (contains? exclude-ids (:block/uuid e)))))]
                  excluded-options)

                (= :class property-type)
                (cond->
                 (model/get-all-classes
                  repo
                  {:except-root-class? true
                   :except-private-tags? (not (contains? #{:logseq.property/template-applied-to} (:db/ident property)))})
                  (not (or (and (entity-util/page? block) (not (ldb/internal-page? block))) (:logseq.property/created-from-property block)))
                  (conj (db/entity :logseq.class/Page)))

                (= :property property-type)
                (property-handler/get-class-property-choices)

                (seq classes)
                (->>
                 (mapcat
                  (fn [class]
                    (model/get-class-objects repo (:db/id class)))
                  classes)
                 distinct)

                :else
                (if (empty? result)
                  (let [v (get block (:db/ident property))]
                    (remove #(= :logseq.property/empty-placeholder (:db/ident %))
                            (if (every? entity-map? v) v [v])))
                  (remove (fn [node]
                            (let [node' (if (:value node)
                                          (assoc (:value node) :block/title (:label node))
                                          node)
                                  node (or (some-> (:db/id node') db/entity) node)]
                              (or (= (:db/id block) (:db/id node))
                                  ;; A page's alias can't be itself
                                  (and alias? (= (or (:db/id (:block/page block))
                                                     (:db/id block))
                                                 (:db/id node)))
                                  (= :logseq.property/empty-placeholder (:db/ident node))
                                  (cond
                                    (= property-type :class)
                                    (ldb/private-tags (:db/ident node))

                                    (and property-type (not= property-type :node))
                                    (if (= property-type :page)
                                      (not (db/page? node))
                                      (not (contains? (ldb/get-entity-types node) property-type)))

                                    :else
                                    false))))
                          result)))
        options (map (fn [node]
                       (let [node (if (:value node)
                                    (assoc (:value node) :block/title (:label node))
                                    node)
                             id (:db/id node)
                             [header label] (if (integer? id)
                                              (when-let [title (if (seq (:logseq.property/classes property))
                                                                 (some-> (db-content/recur-replace-uuid-in-block-title node)
                                                                         (subs 0 256))
                                                                 (block-handler/block-unique-title node))]
                                                (let [node (or (db/entity id) node)
                                                      header (when-not (db/page? node)
                                                               (when-let [breadcrumb (state/get-component :block/breadcrumb)]
                                                                 [:div.text-xs.opacity-70
                                                                  (breadcrumb {:search? true} (state/get-current-repo) (:block/uuid node)
                                                                              {:disabled? true})]))
                                                      label [:div.flex.flex-row.items-center.gap-1
                                                             (when-not (or (:logseq.property/classes property)
                                                                           (contains? #{:class :property} property-type))
                                                               (icon-component/get-node-icon-cp node {:ignore-current-icon? true}))
                                                             [:div (if (contains? #{:class :property :page} property-type)
                                                                     title
                                                                     (block-handler/block-title-with-icon node title icon-component/icon))]]]
                                                  [header label]))
                                              [nil (:block/title node)])]
                         (assoc node
                                :header header
                                :label-value (:block/title node)
                                :label label
                                :value id
                                :disabled? (and tags? (contains?
                                                       (set/union #{:logseq.class/Journal :logseq.class/Whiteboard}
                                                                  (set/difference ldb/internal-tags #{:logseq.class/Page}))
                                                       (:db/ident node)))))) nodes)
        classes' (remove (fn [class] (= :logseq.class/Root (:db/ident class))) classes)
        opts' (cond->
               (merge
                opts
                {:multiple-choices? multiple-choices?
                 :tap-*input-val set-input!
                 :items options
                 :selected-choices selected-choices
                 :dropdown? dropdown?
                 :input-default-placeholder (cond
                                              tags?
                                              "Set tags"
                                              alias?
                                              "Set alias"
                                              :else
                                              (str "Set " (:block/title property)))
                 :show-new-when-not-exact-match? (not
                                                  (or (and extends-property?
                                                           (or (contains? (set children-pages) (:db/id block))
                                                               (when-let [input (when *input @*input)]
                                                                 (when-not (string/blank? input)
                                                                   (some (fn [ident]
                                                                           (= input (:block/title (db/entity ident)))) ldb/extends-hidden-tags)))))
                                                      ;; Don't allow creating private tags
                                                      (and (= :block/tags (:db/ident property))
                                                           (seq (set/intersection (set (map :db/ident classes'))
                                                                                  ldb/private-tags)))))
                 :extract-chosen-fn :value
                 :extract-fn (fn [x] (or (:label-value x) (:label x)))
                 :input-opts input-opts
                 :on-input (debounce on-input 50)
                 :on-chosen (fn [chosen selected?]
                              (p/let [add-tag-property? (and (= (:db/ident property) :logseq.property.class/properties) (not (integer? chosen)))
                                      id (if (integer? chosen)
                                           chosen
                                           (when-not (string/blank? (string/trim chosen))
                                             (if (= (:db/ident property) :logseq.property.class/properties)
                                               (do
                                                 (shui/popup-hide!)
                                                 (state/pub-event! [:editor/new-property {:block block
                                                                                          :class-schema? true
                                                                                          :property-key chosen
                                                                                          :target target}]))
                                               (<create-page-if-not-exists! block property classes' chosen))))
                                      _ (when (and (integer? id) (not (entity-util/page? (db/entity id))))
                                          (db-async/<get-block repo id))]
                                (if id
                                  (p/do!
                                   (add-or-remove-property-value block property id selected? {})
                                   (when (fn? add-new-choice!)
                                     (add-new-choice!
                                      (let [e (db/entity id)]
                                        {:value (select-keys e [:db/id :block/uuid])
                                         :label (:block/title e)}))))
                                  (when-not add-tag-property?
                                    (log/error :msg "No :db/id found or created for chosen" :chosen chosen)))))})

                (= :block/tags (:db/ident property))
                (assoc :exact-match-exclude-items
                       (set (map (fn [ident] (:block/title (db/entity ident))) ldb/private-tags)))

                (and (seq classes') (not tags-or-alias?))
                (assoc
                  ;; Provides additional completion for inline classes on new pages or objects
                 :transform-fn (fn [results input]
                                 (if-let [[_ new-page class-input] (and (empty? results) (re-find #"(.*)#(.*)$" input))]
                                   (let [repo (state/get-current-repo)
                                         descendent-classes (->> classes'
                                                                 (mapcat #(model/get-structured-children repo (:db/id %)))
                                                                 (map #(db/entity repo %)))]
                                     (->> (concat classes' descendent-classes)
                                          (filter #(string/includes? (:block/title %) class-input))
                                          (mapv (fn [p]
                                                  {:value (str new-page "#" (:block/title p))
                                                   :label (str new-page "#" (:block/title p))}))))
                                   results))))]
    (select-aux block property opts')))

(rum/defc property-value-select-node < rum/static
  [block property opts
   {:keys [*show-new-property-config?]}]
  (let [[initial-choices set-initial-choices!] (hooks/use-state nil)
        [result set-result!] (hooks/use-state nil)
        set-result-and-initial-choices! (fn [value]
                                          (set-initial-choices! value)
                                          (set-result! value))
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
                                   (set-result! initial-choices)
                                   ;; TODO rank initial choices higher
                                   (p/let [result (search/block-search (state/get-current-repo) v {:enable-snippet? false
                                                                                                   :built-in? false})]
                                     (set-result! result))))
                     :add-new-choice! (fn [new-choice]
                                        (set-initial-choices! (conj (vec initial-choices) new-choice))))
        repo (state/get-current-repo)
        classes (:logseq.property/classes property)
        class? (= :class (:logseq.property/type property))
        non-root-classes (cond-> (remove (fn [c] (= (:db/ident c) :logseq.class/Root)) classes)
                           class?
                           (conj (frontend.db/entity :logseq.class/Tag)))
        extends-property? (= (:db/ident property) :logseq.property.class/extends)]

    ;; effect runs once
    (hooks/use-effect!
     (fn []
       (cond
         extends-property?
         nil

         (seq non-root-classes)
         (p/let [result (p/all (map (fn [class] (db-async/<get-tag-objects repo (:db/id class))) non-root-classes))
                 result' (distinct (apply concat result))]
           (set-result-and-initial-choices! result'))

         :else
         (p/let [result (db-async/<get-property-values (:db/ident property))]
           (set-result-and-initial-choices! result))))
     [])

    (select-node property opts' result)))

(rum/defcs select < rum/reactive db-mixins/query
  {:init (fn [state]
           (let [*values (atom :loading)
                 refresh-result-f (fn []
                                    (let [[block property _] (:rum/args state)]
                                      (p/let [property-ident (if (= :logseq.property/default-value (:db/ident property))
                                                               (:db/ident block)
                                                               (:db/ident property))
                                              result (db-async/<get-property-values property-ident)]
                                        (reset! *values result))))]
             (refresh-result-f)
             (assoc state
                    ::values *values
                    ::refresh-result-f refresh-result-f)))}
  [state block property
   {:keys [multiple-choices? dropdown? content-props] :as select-opts}
   {:keys [*show-new-property-config? exit-edit?] :as opts}]
  (let [*values (::values state)
        refresh-result-f (::refresh-result-f state)
        values (rum/react *values)]
    (when-not (= :loading values)
      (let [type (:logseq.property/type property)
            closed-values? (seq (:property/closed-values property))
            items (if closed-values?
                    (let [date? (and
                                 (= (:db/ident property) :logseq.property.repeat/recur-unit)
                                 (= :date (:logseq.property/type (:property opts))))
                          values (cond->> (:property/closed-values property)
                                   date?
                                   (remove (fn [b] (contains? #{:logseq.property.repeat/recur-unit.minute :logseq.property.repeat/recur-unit.hour} (:db/ident b)))))]
                      (keep (fn [block]
                              (let [icon (pu/get-block-property-value block :logseq.property/icon)
                                    value (db-property/closed-value-content block)]
                                {:label (if icon
                                          [:div.flex.flex-row.gap-1.items-center
                                           (icon-component/icon icon {:color? true})
                                           value]
                                          value)
                                 :value (:db/id block)
                                 :label-value value}))
                            values))
                    (->> values
                         (map (fn [{:keys [value label]}]
                                {:label label
                                 :value (:db/id value)}))
                         (distinct)))
            items (->> (cond
                         (= :checkbox type)
                         [{:label "True"
                           :value true}
                          {:label "False"
                           :value false}]
                         (= :date type)
                         (map (fn [m] (let [label (:block/title (db/entity (:value m)))]
                                        (when label
                                          (assoc m :label label)))) items)
                         :else
                         items)
                       (remove nil?))
            on-chosen (fn [chosen selected?]
                        (let [value (if (map? chosen) (:value chosen) chosen)]
                          (add-or-remove-property-value block property value selected?
                                                        {:entity-id? (when (integer? value) true)
                                                         :exit-edit? exit-edit?
                                                         :refresh-result-f refresh-result-f})))
            selected-choices' (get block (:db/ident property))
            selected-choices (when-not (= type :checkbox)
                               (if (every? #(and (map? %) (:db/id %)) selected-choices')
                                 (map :db/id selected-choices')
                                 [selected-choices']))]
        (select-aux block property
                    {:multiple-choices? multiple-choices?
                     :items items
                     :selected-choices selected-choices
                     :dropdown? dropdown?
                     :show-new-when-not-exact-match? (not (or closed-values? (= :date type)))
                     :input-default-placeholder (str "Set " (:block/title property))
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
  [state block property value-block opts]
  (let [container-id (:container-id state)
        multiple-values? (db-property/many? property)
        block-container (state/get-component :block/container)
        blocks-container (state/get-component :block/blocks-container)
        value-block (if (and (coll? value-block) (every? entity-map? value-block))
                      (set (remove #(= (:db/ident %) :logseq.property/empty-placeholder) value-block))
                      value-block)
        default-value (:logseq.property/default-value property)
        default-value? (and
                        (:db/id default-value)
                        (= (:db/id value-block) (:db/id default-value))
                        (not= (:db/ident property) :logseq.property/default-value))
        table-text-property-render (:table-text-property-render opts)]
    (if table-text-property-render
      (table-text-property-render
       value-block
       {:create-new-block #(<create-new-block! block property "")
        :property-ident (:db/ident property)})
      (cond
        (seq value-block)
        [:div.property-block-container.content.w-full
         {:style (if (= (:db/ident property) :logseq.property/default-value)
                   {:min-width 300}
                   {})}
         (let [config {:id (str (if multiple-values?
                                  (:block/uuid block)
                                  (:block/uuid value-block)))
                       :container-id container-id
                       :editor-box (state/get-component :editor/box)
                       :property-block? true
                       :on-block-content-pointer-down (when default-value?
                                                        (fn [_e]
                                                          (<create-new-block! block property (or (:block/title default-value) ""))))
                       :p-block (:db/id block)
                       :p-property (:db/id property)
                       :view? (:view? opts)}]
           (if (set? value-block)
             (blocks-container config (ldb/sort-by-order value-block))
             (rum/with-key
               (block-container (assoc config
                                       :block/uuid (:block/uuid value-block)
                                       :property-default-value? default-value?) value-block)
               (str (:db/id block) "-" (:db/id property) "-" (:db/id value-block)))))]

        :else
        [:div.w-full.h-full.jtrigger.ls-empty-text-property.text-muted-foreground
         {:tabIndex 0
          :class (if (:table-view? opts) "cursor-pointer" "cursor-text")
          :style {:min-height 20 :margin-left 3}
          :on-click #(<create-new-block! block property "")}
         (when (:class-schema? opts)
           "Add description")]))))

(rum/defc property-block-value
  [value block property page-cp opts]
  (let [v-block value
        class? (ldb/class? v-block)]
    (cond
      (entity-util/page? v-block)
      (rum/with-key
        (page-cp {:disable-preview? true
                  :tag? class?
                  :with-tags? false} v-block)
        (:db/id v-block))

      :else
      (property-normal-block-value block property v-block opts))))

(rum/defc closed-value-item < rum/reactive db-mixins/query
  [value {:keys [inline-text icon?]}]
  (when value
    (let [eid (if (entity-map? value) (:db/id value) [:block/uuid value])
          block (or (db/sub-block (:db/id (db/entity eid))) value)
          property-block? (db-property/property-created-block? block)
          value' (db-property/closed-value-content block)
          icon (pu/get-block-property-value block :logseq.property/icon)]
      (cond
        icon
        (if icon?
          (icon-component/icon icon {:color? true})
          [:div.flex.flex-row.items-center.gap-1.h-6
           (icon-component/icon icon {:color? true})
           (when value'
             [:span value'])])

        property-block?
        value'

        (= type :number)
        [:span.number (str value')]

        :else
        [:span.inline-flex.w-full
         (let [value' (str value')
               value' (if (string/blank? value')
                        "Empty"
                        value')]
           (inline-text {} :markdown value'))]))))

(rum/defc select-item
  [property type value {:keys [page-cp inline-text other-position? property-position table-view? _icon?] :as opts}]
  (let [closed-values? (seq (:property/closed-values property))
        tag? (or (:tag? opts) (= (:db/ident property) :block/tags))
        inline-text-cp (fn [content]
                         [:div.flex.flex-row.items-center
                          (inline-text {} :markdown (macro-util/expand-value-if-macro content (state/get-macros)))])]
    [:div.select-item.cursor-pointer
     (cond
       (= value :logseq.property/empty-placeholder)
       (property-empty-btn-value property)

       closed-values?
       (closed-value-item value opts)

       (or (entity-util/page? value)
           (seq (:block/tags value)))
       (when value
         (let [opts {:disable-preview? true
                     :tag? tag?
                     :with-tags? false
                     :property-position property-position
                     :other-position? other-position?
                     :table-view? table-view?
                     :ignore-alias? (= :block/alias (:db/ident property))
                     :on-context-menu
                     (fn [e]
                       (util/stop e)
                       (shui/popup-show! (.-target e)
                                         (fn []
                                           [:<>
                                            (shui/dropdown-menu-item
                                             {:key "open"
                                              :on-click #(route-handler/redirect-to-page! (:block/uuid value))}
                                             (str "Open " (:block/title value)))

                                            (shui/dropdown-menu-item
                                             {:key "open sidebar"
                                              :on-click #(state/sidebar-add-block! (state/get-current-repo) (:db/id value) :page)}
                                             "Open in sidebar")])
                                         {:as-dropdown? true
                                          :content-props {:on-click (fn [] (shui/popup-hide!))}
                                          :align "start"}))}]
           (rum/with-key (page-cp opts value) (:db/id value))))

       (contains? #{:node :class :property :page} type)
       (when-let [reference (state/get-component :block/reference)]
         (when value (reference {:table-view? table-view?} (:block/uuid value))))

       (and (map? value) (some? (db-property/property-value-content value)))
       (let [content (str (db-property/property-value-content value))]
         (inline-text-cp content))

       :else
       (inline-text-cp (str value)))]))

(rum/defc single-value-select
  [block property value select-opts {:keys [value-render] :as opts}]
  (let [*el (hooks/use-ref nil)
        editing? (:editing? opts)
        type (:logseq.property/type property)
        select-opts' (assoc select-opts :multiple-choices? false)
        popup-content (fn content-fn [target]
                        [:div.property-select
                         (case type
                           (:entity :number :default :url :checkbox)
                           (select block property select-opts' opts)

                           (:node :class :property :page :date)
                           (property-value-select-node block property select-opts' (assoc opts :target target)))])
        trigger-id (str "trigger-" (:container-id opts) "-" (:db/id block) "-" (:db/id property))
        show-popup! (fn [target]
                      (shui/popup-show! target (fn [] (popup-content target))
                                        {:align "start"
                                         :as-dropdown? true
                                         :auto-focus? true
                                         :trigger-id trigger-id}))]
    (if editing?
      (popup-content nil)
      (let [show! (fn [e]
                    (util/stop e)
                    (state/clear-selection!)
                    (let [target (when e (.-target e))]
                      (when-not (or config/publishing?
                                    (util/shift-key? e)
                                    (util/meta-key? e)
                                    (util/link? target)
                                    (when-let [node (.closest target "a")]
                                      (not (or (d/has-class? node "page-ref")
                                               (d/has-class? node "tag")))))
                        (show-popup! target))))]
        (shui/trigger-as
         (if (:other-position? opts) :div.jtrigger :div.jtrigger.flex.flex-1.w-full.cursor-pointer)
         {:ref *el
          :id trigger-id
          :tabIndex 0
          :on-click show!
          :on-key-down (fn [e]
                         (case (util/ekey e)
                           ("Backspace" "Delete")
                           (delete-block-property! block property)
                           (" " "Enter")
                           (do (some-> (rum/deref *el) (.click))
                               (util/stop e))
                           nil))}
         (if (string/blank? value)
           (property-empty-text-value property opts)
           (value-render)))))))

(defn- property-value-inner
  [block property value {:keys [inline-text page-cp
                                dom-id row?]
                         :as opts}]
  (let [multiple-values? (db-property/many? property)
        class (str (when-not row? "flex flex-1 ")
                   (when multiple-values? "property-value-content"))
        type (:logseq.property/type property)
        text-ref-type? (db-property-type/text-ref-property-types type)]
    [:div.cursor-text
     {:id (or dom-id (random-uuid))
      :tabIndex 0
      :class (str class " " (when-not text-ref-type? "jtrigger"))
      :on-key-down (fn [e]
                     (when-not text-ref-type?
                       (when (contains? #{"Backspace" "Delete"} (util/ekey e))
                         (delete-block-property! block property))))
      :style {:min-height 24}}
     (cond
       (and (= :logseq.property/default-value (:db/ident property)) (nil? (:block/title value)))
       [:div.jtrigger.cursor-pointer.text-sm.px-2
        {:on-click #(<create-new-block! block property "")}
        "Set default value"]

       text-ref-type?
       (property-block-value value block property page-cp opts)

       :else
       (inline-text {} :markdown (macro-util/expand-value-if-macro (str value) (state/get-macros))))]))

(rum/defc single-number-input
  [block property value-block table-view?]
  (let [[editing? set-editing!] (hooks/use-state false)
        *ref (hooks/use-ref nil)
        *input-ref (hooks/use-ref nil)
        number-value (db-property/property-value-content value-block)
        [value set-value!] (hooks/use-state number-value)
        [*value _] (hooks/use-state (atom value))
        set-property-value! (fn [value & {:keys [exit-editing?]
                                          :or {exit-editing? true}}]
                              (p/do!
                               (if (string/blank? value)
                                 (when (get block (:db/ident property))
                                   (db-property-handler/remove-block-property! (:db/id block) (:db/ident property)))
                                 (when (not= (string/trim (str number-value))
                                             (string/trim (str value)))
                                   (db-property-handler/set-block-property! (:db/id block)
                                                                            (:db/ident property)
                                                                            value)))

                               (set-value! (str (db-property/property-value-content
                                                 (get (db/entity (:db/id block)) (:db/ident property)))))

                               (when exit-editing?
                                 (set-editing! false))))]
    (hooks/use-effect!
     (fn []
       #(set-property-value! @*value))
     [])
    [:div.ls-number.flex.flex-1.jtrigger
     {:ref *ref
      :on-click #(do
                   (state/clear-selection!)
                   (set-editing! true))}
     (if editing?
       (shui/input
        {:ref *input-ref
         :auto-focus true
         :class (str "ls-number-input h-6 px-0 py-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                     (when table-view? " text-sm"))
         :value value
         :on-change (fn [e]
                      (set-value! (util/evalue e))
                      (reset! *value (util/evalue e)))
         :on-blur (fn [_e]
                    (p/do!
                     (set-property-value! value)))
         :on-key-down (fn [e]
                        (let [input (rum/deref *input-ref)
                              pos (cursor/pos input)
                              k (util/ekey e)]
                          (when-not (util/input-text-selected? input)
                            (case k
                              ("ArrowUp" "ArrowDown")
                              (do
                                (util/stop-propagation e)
                                (set-editing! false)
                                (editor-handler/move-cross-boundary-up-down (if (= "ArrowUp" (util/ekey e)) :up :down) {})
                                (set-property-value! value {:exit-editing? false}))

                              "Backspace"
                              (when (zero? pos)
                                (p/do!
                                 (db-property-handler/remove-block-property! (:db/id block) (:db/ident property))
                                 (editor-handler/move-cross-boundary-up-down :up {:pos :max})))

                              ("Escape" "Enter")
                              (p/do!
                               (set-property-value! value)
                               (.focus (rum/deref *ref)))

                              nil))))})
       value)]))

(rum/defcs property-scalar-value-aux < rum/static rum/reactive
  [state block property value* {:keys [editing? on-chosen]
                                :as opts}]
  (let [property (model/sub-block (:db/id property))
        type (:logseq.property/type property)
        batch? (batch-operation?)
        closed-values? (seq (:property/closed-values property))
        select-type?' (or (select-type? block property)
                          (and editing? batch? (contains? #{:default :url :checkbox} type) (not closed-values?)))
        select-opts {:on-chosen on-chosen}
        value (if (and (entity-map? value*) (= (:db/ident value*) :logseq.property/empty-placeholder))
                nil
                value*)]
    (cond
      (= :logseq.property/icon (:db/ident property))
      (icon-row block editing?)

      (and (= type :number) (not editing?) (not closed-values?))
      (single-number-input block property value (:table-view? opts))

      :else
      (if (and select-type?'
               (not (and (not closed-values?) (= type :date))))
        (let [classes (outliner-property/get-block-classes (db/get-db) (:db/id block))
              display-as-checkbox? (and (some
                                         (fn [block]
                                           (-> (set (map :db/id (:logseq.property/checkbox-display-properties block)))
                                               (contains? (:db/id property))))
                                         (conj classes block))
                                        (seq (:property/closed-values property))
                                        (boolean? (:logseq.property/choice-checkbox-state value*)))]
          (if display-as-checkbox?
            (let [checked? (:logseq.property/choice-checkbox-state value*)]
              (shui/checkbox {:checked checked?
                              :class "mt-1"
                              :on-checked-change (fn [value]
                                                   (let [choices (:property/closed-values property)
                                                         choice (some (fn [choice] (when (= value (:logseq.property/choice-checkbox-state choice))
                                                                                     choice)) choices)]
                                                     (when choice
                                                       (db-property-handler/set-block-property! (:db/id block) (:db/ident property) (:db/id choice)))))}))
            (single-value-select block property value
                                 select-opts
                                 (assoc opts
                                        :editing? editing?
                                        :value-render (fn [] (select-item property type value opts))))))
        (case type
          (:date :datetime)
          (property-value-date-picker block property value (merge opts {:editing? editing?}))

          :checkbox
          (let [add-property! (fn [value]
                                (<add-property! block (:db/ident property) value opts)
                                (when-let [on-checked-change (:on-checked-change opts)]
                                  (on-checked-change value)))]
            [:label.flex.w-full.as-scalar-value-wrap.cursor-pointer
             (shui/checkbox {:class "jtrigger flex flex-row items-center"
                             :disabled config/publishing?
                             :auto-focus editing?
                             :checked value
                             :on-checked-change (fn []
                                                  (add-property! (boolean (not value))))
                             :on-key-down (fn [e]
                                            (when (= (util/ekey e) "Enter")
                                              (add-property! (boolean (not value))))
                                            (when (contains? #{"Backspace" "Delete"} (util/ekey e))
                                              (delete-block-property! block property)))})])
          ;; :others
          [:div.flex.flex-1
           (property-value-inner block property value opts)])))))

(rum/defc property-scalar-value
  [block property value* {:keys [container-id editing?]
                          :as opts}]
  (let [block-editing? (state/sub-editing? [container-id (:block/uuid block)])
        editing (or editing?
                    (and block-editing?
                         (= (:db/id property) (:db/id (:property (state/get-editor-action-data))))))]
    (property-scalar-value-aux block property value* (assoc opts :editing? editing))))

(rum/defc multiple-values-inner
  [block property v {:keys [on-chosen editing?] :as opts}]
  (let [type (:logseq.property/type property)
        date? (= type :date)
        *el (hooks/use-ref nil)
        items (cond->> (if (entity-map? v) #{v} v)
                (= (:db/ident property) :block/tags)
                (remove (fn [v] (contains? ldb/hidden-tags (:db/ident v)))))
        select-cp (fn [select-opts target]
                    (let [select-opts (merge {:multiple-choices? true
                                              :on-chosen (fn []
                                                           (when on-chosen (on-chosen)))}
                                             select-opts
                                             (when-not editing?
                                               {:dropdown? false}))]
                      [:div.property-select
                       (if (contains? #{:node :page :class :property} type)
                         (property-value-select-node block property
                                                     (assoc select-opts :target target)
                                                     opts)
                         (select block property select-opts opts))]))]
    (if editing?
      (select-cp {} nil)
      (let [toggle-fn shui/popup-hide!
            content-fn (fn [{:keys [_id content-props]} target]
                         (select-cp {:content-props content-props} target))
            show-popup! (fn [^js e]
                          (let [target (.-target e)]
                            (when-not (or (util/link? target) (.closest target "a") config/publishing?)
                              (shui/popup-show! (rum/deref *el)
                                                (fn [opts]
                                                  (content-fn opts target))
                                                {:as-dropdown? true :as-content? false
                                                 :align "start" :auto-focus? true}))))]
        [:div.multi-values.jtrigger
         {:tab-index "0"
          :ref *el
          :on-click show-popup!
          :on-key-down (fn [^js e]
                         (case (.-key e)
                           (" " "Enter")
                           (do (some-> (rum/deref *el) (.click))
                               (util/stop e))
                           ("Backspace" "Delete")
                           (delete-block-property! block property)
                           :dune))
          :class "flex flex-1 flex-row items-center flex-wrap gap-1"}
         (let [not-empty-value? (not= (map :db/ident items) [:logseq.property/empty-placeholder])]
           (if (and (seq items) not-empty-value?)
             (concat
              (->> (for [item items]
                     (rum/with-key
                       (select-item property type item (assoc opts :show-popup! show-popup!))
                       (or (:block/uuid item) (str item))))
                   (interpose [:span.opacity-50.-ml-1 ","]))
              (when date?
                [(property-value-date-picker block property nil {:toggle-fn toggle-fn})]))
             (if date?
               (property-value-date-picker block property nil {:toggle-fn toggle-fn})
               (property-empty-text-value property opts))))]))))

(rum/defc multiple-values < rum/reactive db-mixins/query
  [block property opts]
  (let [value (get block (:db/ident property))
        value' (if (coll? value) value
                   (when (some? value) #{value}))]
    (multiple-values-inner block property value' opts)))

(rum/defcs ^:large-vars/cleanup-todo property-value < rum/reactive db-mixins/query
  [state block property {:keys [show-tooltip? p-block p-property editing?]
                         :as opts}]
  (ui/catch-error
   (ui/block-error "Something wrong" {})
   (let [block-cp (state/get-component :block/blocks-container)
         opts (merge opts
                     {:page-cp (state/get-component :block/page-cp)
                      :inline-text (state/get-component :block/inline-text)
                      :editor-box (state/get-component :editor/box)
                      :block-cp block-cp
                      :properties-cp :properties-cp})
         dom-id (str "ls-property-" (:db/id block) "-" (:db/id property))
         editor-id (str dom-id "-editor")
         type (:logseq.property/type property)
         multiple-values? (db-property/many? property)
         v (let [v (get block (:db/ident property))]
             (or
              (cond
                (and multiple-values? (or (set? v) (coll? v) (nil? v)))
                v
                multiple-values?
                #{v}
                (set? v)
                (first v)
                :else
                v)
              (:logseq.property/default-value property)))
         self-value-or-embedded? (fn [v]
                                   (or (= (:db/id v) (:db/id block))
                                       ;; property value self embedded
                                       (and (:db/id block) (= (:db/id (:block/link v)) (:db/id block)))))]
     (if (and (or (and (entity-map? v)
                       (self-value-or-embedded? v))
                  (and (coll? v) (every? entity-map? v)
                       (some self-value-or-embedded? v))
                  (and (:db/id block)
                       (= p-block (:db/id block))
                       (= p-property (:db/id property))))
              (not= :logseq.class/Tag
                    (:db/ident (db/entity (:db/id block)))))
       [:div.flex.flex-row.items-center.gap-1
        [:div.warning "Self reference"]
        (shui/button {:variant :outline
                      :size :sm
                      :class "h-5"
                      :on-click (fn []
                                  (db-property-handler/remove-block-property!
                                   (:db/id block)
                                   (:db/ident property)))}
                     "Fix it!")]
       (let [empty-value? (when (coll? v) (= :logseq.property/empty-placeholder (:db/ident (first v))))
             closed-values? (seq (:property/closed-values property))
             value-cp [:div.property-value-inner
                       {:data-type type
                        :class (str (when empty-value? "empty-value")
                                    (when-not (:other-position? opts) " w-full"))
                        :on-pointer-down (fn [e]
                                           (when-not (some-> (.-target e) (.closest "[data-radix-popper-content-wrapper]"))
                                             (state/clear-selection!)))}
                       (cond
                         (and multiple-values? (contains? #{:default :url} type) (not closed-values?) (not editing?))
                         (property-normal-block-value block property v opts)

                         multiple-values?
                         (multiple-values block property opts)

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
              {:onFocusCapture #(util/stop-propagation %)
               :as-child true}
              value-cp)
             (shui/tooltip-content
              (str "Change " (:block/title property)))))
           value-cp))))))
