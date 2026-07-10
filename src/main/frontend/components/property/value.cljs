(ns frontend.components.property.value
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.set :as set]
            [clojure.string :as string]
            [dommy.core :as d]
            [frontend.components.icon :as icon-component]
            [frontend.components.select :as select]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.handler.block :as block-handler]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.publish :as publish-handler]
            [frontend.handler.route :as route-handler]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.rfx :as rfx]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.entity :as entity]
            [goog.functions :refer [debounce]]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.common.util.macro :as macro-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defonce string-value-on-click
  {:logseq.property.asset/external-url
   (fn [block property]
     (when-not (string/starts-with? (get block (:db/ident property)) "zotero://")
       (state/pub-event! [:asset/dialog-edit-external-url block])))})

(def ^:private editor-navigation-trigger-class "jtrigger")

(defn- property-value-block-container-class
  []
  (str "property-block-container content w-full " editor-navigation-trigger-class))

(defn- editing-navigation?
  [e]
  (= "edit" (some-> (.-currentTarget e) (.getAttribute "data-property-nav-mode"))))

(defn- move-property-value-boundary!
  [e direction]
  (util/stop e)
  (if (editing-navigation? e)
    (editor-handler/move-cross-boundary-up-down direction {:input nil})
    (editor-handler/move-property-focus-up-down direction)))

(defn- property-value-block-container-props
  [property]
  {:class (property-value-block-container-class)
   :tabIndex -1
   :on-key-down (fn [e]
                  (when (= (.-currentTarget e) js/document.activeElement)
                    (case (util/ekey e)
                      "ArrowUp"
                      (move-property-value-boundary! e :up)

                      "ArrowDown"
                      (move-property-value-boundary! e :down)

                      nil)))
   :style (if (= (:db/ident property) :logseq.property/default-value)
            {:min-width 300}
            {})})

(defn- show-inline-asset-picker?
  [editing? value]
  (and editing?
       (not (and value (:db/id value)))))

(defn- entity-map?
  [m]
  (and (map? m) (:db/id m)))

(defn- value->db-id
  [value]
  (cond
    (entity-map? value)
    (:db/id value)

    (integer? value)
    value

    :else
    nil))

(defn- property-value->ids
  [value]
  (if (and (coll? value) (not (map? value)))
    (keep value->db-id value)
    (some-> value value->db-id vector)))

(defn- property-value-selected?
  [property-value value]
  (contains? (set (property-value->ids property-value)) value))

(defn- property-multiple-values?
  [property]
  (or (db-property/many? property)
      (= (:db/ident property) :block/tags)))

(defn- property-value-popup-blocked-link?
  [target]
  (when-let [node (some-> target (.closest "a"))]
    (not (or (d/has-class? node "page-ref")
             (d/has-class? node "tag")))))

(hsx/defc property-empty-btn-value
  [property & [opts]]
  (let [text (if (= (:db/ident property) :logseq.property/description)
               (t :property/add-description)
               (ui/icon "line-dashed"))]
    (shui/button (merge {:class "empty-btn" :variant :text} (or opts {}))
                 text)))

(hsx/defc property-empty-text-value
  [property {:keys [property-position table-view?]}]
  [:span.inline-flex.items-center.cursor-pointer.w-full
   (merge {:class "empty-text-btn" :variant :text})
   (when-not table-view?
     (if (= property-position :block-below)
       (ui/icon "line-dashed")
       (if-let [icon (:logseq.property/icon property)]
         (icon-component/icon icon {:color? true})
         (ui/icon "line-dashed"))))])

(defn- get-selected-blocks
  []
  (some->> (state/get-selection-block-ids)
           (seq)
           (map (fn [id] {:block/uuid id}))
           block-handler/get-top-level-blocks
           (remove entity/property?)))

(defn get-operating-blocks
  [block]
  (let [selected-blocks (get-selected-blocks)
        view-selected-blocks (state/get-state :view/selected-blocks)]
    (or (seq view-selected-blocks)
        (when (> (count selected-blocks) 1)
          (seq selected-blocks))
        [block])))

(defn batch-operation?
  []
  (let [selected-blocks (get-selected-blocks)
        view-selected-blocks (state/get-state :view/selected-blocks)]
    (or (seq view-selected-blocks)
        (> (count selected-blocks) 1))))

(hsx/defc icon-row
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
                     (let [blocks (get-operating-blocks block)]
                       (property-handler/batch-set-block-property!
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

(defn direct-value-picker-type?
  [type]
  (contains? #{:date :datetime :asset} type))

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
                                  new-block-id (ldb/new-block-id)
                                  _ (let [value' (if (and default-value (string? value) (string/blank? value))
                                                   (db-property/property-value-content default-value)
                                                   value)]
                                      (db-property-handler/create-property-text-block!
                                       (:db/id block)
                                       (:db/id property)
                                       value'
                                       {:new-block-id new-block-id}))]
                            (db-async/<get-block (state/get-current-repo) new-block-id {:children? false}))
                          (p/let [new-block-id (ldb/new-block-id)
                                  _ (db-property-handler/create-property-text-block!
                                     (:db/id block)
                                     (:db/id property)
                                     value
                                     {:new-block-id new-block-id})]
                            (db-async/<get-block (state/get-current-repo) new-block-id {:children? false}))))]
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
   (p/let [repo (state/get-current-repo)
           class? (entity/class? block)
           property (db-async/<get-block repo property-id {:children? false})
           many? (db-property/many? property)
           checkbox? (= :checkbox (:logseq.property/type property))
           blocks (get-operating-blocks block)
           list-view-type (state/<invoke-db-worker :thread-api/pull repo [:db/id] :logseq.property.view/type.list)
           block-page-property (state/<invoke-db-worker :thread-api/pull repo [:db/id] :block/page)]
     (when-not (entity/class? property)
       (assert (qualified-keyword? property-id) "property to add must be a keyword")
       (p/do!
        (if (and class? class-schema?)
          (db-property-handler/class-add-property! (:db/id block) property-id)
          (let [block-ids (map :block/uuid blocks)
                set-query-list-view? (and (:logseq.property/query block)
                                          (= property-id :logseq.property.view/type)
                                          (= property-value (:db/id list-view-type)))]
            (ui-outliner-tx/transact!
             {:outliner-op :set-block-property}
             (property-handler/batch-set-block-property! block-ids property-id property-value {:entity-id? entity-id?})
             (when (and set-query-list-view?
                        (nil? (:logseq.property.view/group-by-property block)))
               (property-handler/batch-set-block-property! block-ids :logseq.property.view/group-by-property
                                                           (:db/id block-page-property)
                                                           {:entity-id? entity-id?})))))
        (when (seq (state/get-state :view/selected-blocks))
          (notification/show! (t :property/update-success) :success))
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
  (let [many? (property-multiple-values? property)
        blocks (get-operating-blocks block)
        current-block-ref (or (:block/uuid (first blocks))
                              (:db/id (first blocks))
                              (:db/id block))
        repo (state/get-current-repo)]
    (p/let [current-block (db-async/<get-block repo current-block-ref {:children? false})
            selected? (if many?
                        (not (property-value-selected? (get current-block (:db/ident property)) value))
                        selected?)
            _ (when (and selected?
                         (= :db.type/ref (:db/valueType property))
                         (number? value))
                (db-async/<get-block repo value {:children? false}))]
     (if selected?
       (if many?
         (db-property-handler/batch-set-property! (map :block/uuid blocks)
                                                  (:db/ident property)
                                                  value
                                                  {:entity-id? entity-id?})
         (<add-property! block (:db/ident property) value
                         {:selected? selected?
                          :entity-id? entity-id?
                          :exit-edit? (if (some? (:exit-edit? opts)) (:exit-edit? opts) (not many?))}))
       (p/do!
        (db-property-handler/batch-delete-property-value! (map :block/uuid blocks) (:db/ident property) value)
        (when (or (not many?)
                  ;; values will be cleared
                  (and many? (<= (count (get block (:db/ident property))) 1)))
          (shui/popup-hide!))))
     (when (fn? refresh-result-f) (refresh-result-f)))))

(declare property-value)

(defn- <property-with-closed-values
  [repo property-ident]
  (p/let [property (state/<invoke-db-worker :thread-api/pull repo '[*] property-ident)
          closed-values (db-async/<get-property-closed-values repo property-ident)]
    (cond-> property
      (seq closed-values)
      (assoc :property/closed-values closed-values))))

(hsx/defc repeat-setting
  [block property]
  (let [opts {:exit-edit? false}
        repo (state/get-current-repo)
        [repeat-properties set-repeat-properties!] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (p/let [repeated-property (<property-with-closed-values repo :logseq.property.repeat/repeated?)
               recur-frequency-property (<property-with-closed-values repo :logseq.property.repeat/recur-frequency)
               recur-unit-property (<property-with-closed-values repo :logseq.property.repeat/recur-unit)
               repeat-type-property (<property-with-closed-values repo :logseq.property.repeat/repeat-type)
               status-property (<property-with-closed-values repo :logseq.property/status)
	               status-done (state/<invoke-db-worker :thread-api/pull repo '[*] :logseq.property/status.done)
	               {:keys [full-properties]} (db-async/<get-display-properties repo block
	                                                                            {:publishing? config/publishing?
	                                                                             :state-hide-empty-properties? (:ui/hide-empty-properties? (state/get-config))}
	                                                                            true)]
	         (set-repeat-properties!
	          {:repeated-property repeated-property
	           :recur-frequency-property recur-frequency-property
	           :recur-unit-property recur-unit-property
	           :repeat-type-property repeat-type-property
	           :status-property status-property
	           :status-done status-done
	           :full-properties full-properties}))
       nil)
     [repo])
	    (when-let [{:keys [repeated-property recur-frequency-property recur-unit-property repeat-type-property status-property status-done full-properties]} repeat-properties]
      [:div.p-4.hidden.sm:flex.flex-col.gap-4.w-64.text-sm
       [:div.mb-4
        [:div.flex.flex-row.items-center.gap-1
         [:div.w-4
          (property-value block repeated-property
                          (assoc opts
                                 :on-checked-change (fn [value]
                                                      (if value
                                                        (db-property-handler/set-block-property! (:db/id block)
                                                                                                 :logseq.property.repeat/temporal-property
                                                                                                 (:db/id property))
                                                        (db-property-handler/remove-block-property! (:db/id block)
                                                                                                    :logseq.property.repeat/temporal-property)))))]
         (if (#{:logseq.property/deadline :logseq.property/scheduled} (:db/ident property))
           [:div (t :property.repeat/task)]
           [:div (t (if (= :date (:logseq.property/type property))
                      :property.repeat/date
                      :property.repeat/datetime))])]]
       [:div.flex.flex-row.gap-2.ls-repeat-task-frequency.text-sm
        [:div.flex.text-muted-foreground
         (t :property.repeat/every)]
        [:div.w-10.mr-2
         (property-value block recur-frequency-property opts)]
        [:div.w-20
         (property-value block recur-unit-property (assoc opts :property property))]]
       [:div.flex.flex-col.gap-1.min-w-0.ls-repeat-type-setting.text-sm
        [:div.text-muted-foreground
         (t :property.repeat/next-date)]
        (property-value block repeat-type-property opts)]
	       (let [properties (->> full-properties
	                         (filter (fn [property']
	                                   (and (not (ldb/built-in? property'))
	                                        (>= (count (:property/closed-values property')) 2))))
                         (concat [status-property])
                         (util/distinct-by :db/id))
             property-options (mapv (fn [property']
                                      {:label (db-property/built-in-display-title property' t)
                                       :value (:db/id property')})
                                    properties)
             status-property (or (:logseq.property.repeat/checked-property block)
                                 status-property)
             property-id (:db/id status-property)
             done-choice (or
                          (some (fn [choice] (when (true? (:logseq.property/choice-checkbox-state choice)) choice)) (:property/closed-values status-property))
                          status-done)]
         [:div.flex.flex-col.gap-2.text-sm
          [:div.text-muted-foreground
           (t :property.repeat/when)]
          (shui/select
            (cond->
              {:items property-options
               :on-value-change (fn [v]
                                  (db-property-handler/set-block-property! (:db/id block)
                                                                           :logseq.property.repeat/checked-property
                                                                           v))}
              property-id
              (assoc :default-value property-id))
            (shui/select-trigger
             (shui/select-value {:placeholder (t :property/select-property-placeholder)}))
            (shui/select-content
             (map (fn [choice]
                    (shui/select-item {:key (str (:db/id choice))
                                       :value (:db/id choice)}
                                      (db-property/built-in-display-title choice t))) properties)))
          [:div.flex.flex-row.gap-1.text-sm
           [:div.text-muted-foreground
            (t :property.repeat/is-label)]
           (when done-choice
             (db-property/built-in-display-title done-choice t))]])])))

(defn- <resolve-journal-page-for-date
  ([^js d]
   (<resolve-journal-page-for-date d
                                   state/get-current-repo
                                   db-async/<get-block
                                   page-handler/<create!
                                   date/js-date->journal-title))
  ([^js d get-current-repo-f get-block-f create-page-f journal-title-f]
   (p/let [journal (journal-title-f d)
           page (get-block-f (get-current-repo-f) journal {:children? false})
           journal-page (when (:block/journal-day page)
                          page)]
     (if journal-page
       journal-page
       (create-page-f journal {:redirect? false})))))

(def ^:private selected-day-selector
  "[role='gridcell'][aria-selected='true'] button, [role='gridcell'] button[tabindex='0']")

(defn- calendar-default-month
  [^js d]
  (js/Date. (.getFullYear d) (.getMonth d) 1))

(defn- focus-selected-day!
  [id remaining]
  (when (pos? remaining)
    (if-let [selected-day (some-> id
                                  (js/document.getElementById)
                                  (.querySelector selected-day-selector))]
      (.focus selected-day)
      (js/setTimeout #(focus-selected-day! id (dec remaining)) 16))))

(hsx/defc calendar-inner
  [id {:keys [block property datetime? on-change del-btn? on-delete]}]
  (let [value (get block (:db/ident property))
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
        *ident (hooks/use-memo #(atom (str "calendar-inner-" (js/Date.now))) [])
        initial-day value
        initial-month (when value (calendar-default-month value))
        select-handler! (hooks/use-callback
                         (fn [^js d]
                           (when d
                             (p/let [journal-page (<resolve-journal-page-for-date d)]
                               (p/do!
                                (when (fn? on-change)
                                  (let [value (if datetime? (tc/to-long d) journal-page)]
                                    (on-change value)))
                                (when-not datetime?
                                  (shui/popup-hide! id)
                                  (ui/hide-popups-until-preview-popup!))))))
                         [id datetime? on-change])]
    (hooks/use-window-keydown
     (fn [^js e]
       (when (and (= "Enter" (util/ekey e))
                  (not (some-> (.-target e)
                               (.closest ".ls-nlp-calendar input"))))
         (select-handler! initial-day)
         (util/stop e)))
     [initial-day select-handler!])
    (hooks/use-effect!
     (fn []
       (state/set-editor-action! :property-set-date)
       (js/setTimeout #(focus-selected-day! @*ident 10) 16)
       #(do
          (shui/popup-hide!)
          (state/set-editor-action! nil)))
     [])
    [:div.ls-property-date-picker.flex.flex-row.gap-2
     [:div.flex.items-center
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

(hsx/defc overdue
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
                                  :title (t :property/overdue)))
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
      (= (.getTime given-date) (.getTime yesterday)) (t :date.nlp/yesterday)
      (= (.getTime given-date) (.getTime today))     (t :date.nlp/today)
      (= (.getTime given-date) (.getTime tomorrow))  (t :date.nlp/tomorrow)
      :else nil)))

(defn- date-page-link-props
  [other-position?]
  (cond-> {}
    other-position?
    (assoc :on-click util/stop-propagation)))

(hsx/defc datetime-value
  [value property-id repeated-task? {:keys [datetime? other-position? suppress-inline-edit-icon?]}]
  (when-let [date (t/to-default-time-zone (tc/from-long value))]
    (let [content [:div.ls-datetime.flex.flex-row.gap-1.items-center
                   (when-let [page-cp (state/get-component :block/page-cp)]
                     (let [page-title (date/journal-name date)]
                       ^{:key page-title}
                       [:span.inline-flex (date-page-link-props other-position?)
                        (page-cp {:disable-preview? true
                                  :show-non-exists-page? true
                                  :label (human-date-label value)}
                                 {:block/name page-title})]))
                   (when datetime?
                     (let [date (js/Date. value)
                           hours (.getHours date)
                           minutes (.getMinutes date)]
                       [:span.select-none
                        (if (= 0 hours minutes)
                          (when-not (or other-position? suppress-inline-edit-icon?)
                            (ui/icon "edit" {:size 14 :class "text-muted-foreground hover:text-foreground align-middle"}))
                          (str (util/zero-pad hours)
                               ":"
                               (util/zero-pad minutes)))]))]]
      (if (or repeated-task? (contains? #{:logseq.property/deadline :logseq.property/scheduled} property-id))
        (overdue date content)
        content))))

(defn- delete-block-property!
  [block property]
  (editor-handler/move-cross-boundary-up-down :up {})
  (property-handler/remove-block-property! (:db/id block)
                                           (:db/ident property)))

(defn- prevent-bottom-property-edit-pointer-dismiss
  [^js e]
  (when (some-> (.-target e) (.closest ".bottom-property-edit-icon"))
    (.preventDefault e)
    false))

(hsx/defc date-picker
  [value {:keys [block property datetime? on-change on-delete del-btn? editing? multiple-values? other-position?
                 suppress-inline-edit-icon? property-position]}]
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
                                            {:align "start"
                                             :auto-focus? true
                                             :content-props {:without-animation true
                                                             :onPointerDownOutside prevent-bottom-property-edit-pointer-dismiss}}))))
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
                           (do (some-> (hooks/deref *el) (.click))
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
                            ^{:key (:db/id value)}
                            [:span.inline-flex (date-page-link-props other-position?)
                             (page-cp {:disable-preview? true
                                       :label (human-date-label value)} value)])]
              (if (or repeated-task? (contains? #{:logseq.property/deadline :logseq.property/scheduled} (:db/id property)))
                (overdue compare-value content)
                content))

            (number? value)
            (datetime-value value
                            (:db/ident property)
                            repeated-task?
                            {:datetime? datetime?
                             :other-position? other-position?
                             :suppress-inline-edit-icon? suppress-inline-edit-icon?})

            :else
            (property-empty-btn-value nil {:property-position property-position}))])))))

(hsx/defc property-value-date-picker
  [block property value opts]
  (let [multiple-values? (db-property/many? property)
        datetime? (= :datetime (:logseq.property/type property))]
    (date-picker value
                 (merge opts
                        {:block block
                         :property property
	                         :datetime? datetime?
	                         :multiple-values? multiple-values?
	                         :on-change (fn [value]
	                                      (let [blocks (get-operating-blocks block)]
	                                        (property-handler/batch-set-block-property! (map :block/uuid blocks)
	                                                                                    (:db/ident property)
                                                                                    (if datetime?
                                                                                      value
                                                                                      (:db/id value)))))
                         :del-btn? (some? value)
                         :on-delete (fn [e]
                                      (util/stop-propagation e)
                                      (let [blocks (get-operating-blocks block)]
                                        (property-handler/batch-set-block-property! (map :block/uuid blocks)
                                                                                    (:db/ident property)
                                                                                    nil))
                                      (shui/popup-hide!))}))))

(defn- <create-page-if-not-exists!
  [block property classes page]
  (p/let [repo (state/get-current-repo)
          page* (string/trim page)
          ;; inline-class is only for input from :transform-fn
          [page inline-class] (if (and (seq classes) (not (contains? db-property/db-attribute-properties (:db/ident property))))
                                (or (seq (map string/trim (rest (re-find #"(.*)#(.*)$" page*))))
                                    [page* nil])
                                [page* nil])
          page-entity (db-async/<get-block repo page {:children? false})
          id (:db/id page-entity)
          class? (or (= :block/tags (:db/ident property))
                     (and (= :logseq.property.class/extends (:db/ident property))
                          (entity/class? block))
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
          page? (entity/internal-page? page-entity)]
    (cond
      ;; page not exists or page exists but not a page type
      (or (nil? id) (and class? (not page?)))
      (p/let [inline-class-entity (when inline-class
                                    (db-async/<get-block repo inline-class {:children? false}))
              inline-class-uuid
              (when inline-class
                (or (:block/uuid inline-class-entity)
                    (do (log/error :msg "Given inline class does not exist" :inline-class inline-class)
                        nil)))
            create-options {:redirect? false
                            :tags (if inline-class-uuid
                                    [inline-class-uuid]
                                    ;; Only 1st class b/c page normally has
                                    ;; one of and not all these classes
                                    (let [classes' (if (= (map :db/ident classes) [:logseq.class/Tag])
                                                     classes
                                                     (->> (remove (fn [c] (= :logseq.class/Tag (:db/ident c))) classes)
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

(hsx/defc select-aux
  [block property {:keys [items selected-choices multiple-choices?] :as opts}]
  (let [selected-choices (->> selected-choices
                              (remove nil?)
                              (remove #(= :logseq.property/empty-placeholder %))
                              set)
        clear-value (t :property/clear-value)
        clear-value-label [:div.flex.flex-row.items-center.gap-1.text-sm
                           (ui/icon "x" {:size 14})
                           [:div clear-value]]
        sorted-items (hooks/use-memo
                      #(sort-select-items property selected-choices items)
                      [property selected-choices items])
        items' (->>
                (if (and (seq selected-choices)
                         (not multiple-choices?)
                         (not (and (entity/class? block) (= (:db/ident property) :logseq.property.class/extends)))
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
                   block-ids
                   (:db/ident property)))
                (when-not (false? (:exit-edit? opts))
                  (shui/popup-hide!)))
               (f chosen selected?)))]
    (select/select (assoc opts
                          :selected-choices selected-choices
                          :items items'
                          :close-modal? false
                          k f'))))

(defn- add-initial-node-choice
  [initial-choices new-choice]
  (let [choice-node-value (fn [choice]
                            (or (:value choice) choice))
        node-choice-match? (fn [choice]
                             (let [choice-value (choice-node-value choice)
                                   new-value (choice-node-value new-choice)]
                               (or
                                (and (:db/id choice-value) (= (:db/id choice-value) (:db/id new-value)))
                                (and (:block/uuid choice-value) (= (:block/uuid choice-value) (:block/uuid new-value)))
                                (= choice-value new-value))))
        initial-choices' (vec initial-choices)]
    (if (some node-choice-match? initial-choices')
      initial-choices'
      (conj initial-choices' new-choice))))

(def ^:private broad-scoped-node-class-idents
  #{:logseq.class/Page})

(defn- broad-scoped-node-property?
  [property classes]
  (and (= :node (:logseq.property/type property))
       (some #(contains? broad-scoped-node-class-idents (:db/ident %)) classes)))

(defn- scoped-class-ids
  [classes structured-children-by-class-id]
  (->> classes
       (mapcat (fn [class]
                 (cons (:db/id class)
                       (get structured-children-by-class-id (:db/id class)))))
       set))

(defn- node-matches-scoped-classes?
  [class-ids node]
  (let [node-value (or (:value node) node)
        node' node-value]
    (some #(contains? class-ids (if (integer? %) % (:db/id %))) (:block/tags node'))))

(defn- scoped-class-nodes
  [property classes result structured-children-by-class-id]
  (let [broad-scope? (broad-scoped-node-property? property classes)]
    (if (some? result)
      (let [class-ids (scoped-class-ids classes structured-children-by-class-id)]
        (filter #(node-matches-scoped-classes? class-ids %) result))
      (when broad-scope?
        []))))

(defn- <load-initial-node-choices
  ([repo property non-root-classes]
   (<load-initial-node-choices repo property non-root-classes
                               db-async/<get-property-values
                               db-async/<get-tag-objects))
  ([repo property non-root-classes <get-property-values <get-tag-objects]
   (if (= :property (:logseq.property/type property))
     (property-handler/get-class-property-choices)
     (if (seq non-root-classes)
       (if (broad-scoped-node-property? property non-root-classes)
         (<get-property-values (:db/ident property))
         (p/let [result (p/all (mapv (fn [class] (<get-tag-objects repo (:db/id class))) non-root-classes))]
           (distinct (apply concat result))))
       (<get-property-values (:db/ident property))))))

(hsx/defc ^:large-vars/cleanup-todo select-node
  [property
   {:keys [block multiple-choices? dropdown? input-opts on-input add-new-choice! target] :as opts}
  result]
  (let [[*input set-input!] (hooks/use-state nil)
        {:keys [all-classes class-options extends-class-options structured-children-by-class-id]} (:class-data opts)
        classes (:logseq.property/classes property)
        tags? (= :block/tags (:db/ident property))
        page-class (some (fn [class]
                           (when (= :logseq.class/Page (:db/ident class))
                             class))
                         all-classes)
        page-class-id (:db/id page-class)
        page-class-title (or (:block/title page-class)
                             (block-handler/block-unique-title page-class))
        page-option {:label-value page-class-title
                     :label [:div.flex.flex-row.items-center.gap-1
                             [:div page-class-title]]
                     :value page-class-id}
        alias? (= :block/alias (:db/ident property))
        tags-or-alias? (or tags? alias?)
        block block
        alias-source-page (when alias? (or (:block/page block) block))
        alias-source-page-id (:db/id alias-source-page)
        alias-source-page-owned? (and alias? (:block/alias-source-page-id alias-source-page))
        selected-choices (when block
                           (property-value->ids (get block (:db/ident property))))
        selected-choice-ids (set selected-choices)
        extends-property? (= (:db/ident property) :logseq.property.class/extends)
        children-pages (when extends-property? (get structured-children-by-class-id (:db/id block)))
        property-type (:logseq.property/type property)
        nodes (cond
                extends-property?
                (let [extends (->> (mapcat (fn [e] (ldb/get-class-extends e)) (:logseq.property.class/extends block))
                                   distinct)
                      ;; Disallows cyclic hierarchies
                      exclude-ids (-> (set children-pages)
                                      (conj (:db/id block)) ; break cycle
                                      ;; hide parent extends for existing values
                                      (set/union (set (map :db/id extends))))
                      options (if (entity/class? block)
                                extends-class-options
                                result)

                      excluded-options (->> options
                                            (remove (fn [e] (contains? exclude-ids (:db/id e)))))]
                  excluded-options)

                (= :class property-type)
                (let [include-page-class? (or (contains? selected-choice-ids page-class-id)
                                              (not (or (and (entity/page? block) (not (entity/internal-page? block)))
                                                       (:logseq.property/created-from-property block))))]
                  (cond-> class-options
                    include-page-class?
                    (conj page-class)))

	                (= :property property-type)
	                result

                (seq classes)
                (scoped-class-nodes property classes result structured-children-by-class-id)

                :else
                (if (empty? result)
                  (let [v (get block (:db/ident property))]
                    (remove #(= :logseq.property/empty-placeholder (:db/ident %))
                            (if (every? entity-map? v) v [v])))
                  (remove (fn [node]
                            (let [node' (if (:value node)
                                          (assoc (:value node) :block/title (:label node))
                                          node)
                                  node node']
                              (or (= (:db/id block) (:db/id node))
                                  ;; A page's alias can't be itself
                                  (and alias? (= alias-source-page-id (:db/id node)))
                                  ;; Candidate is already owned by a different page as an alias
                                  (and alias?
                                       (when-let [owner-id (:block/alias-source-page-id node)]
                                         (not= owner-id alias-source-page-id)))
                                  ;; Candidate already owns aliases (alias pages must be leaf nodes)
                                  (and alias? (seq (:block/alias node)))
                                  ;; Source page is already an alias of another page
                                  alias-source-page-owned?
                                  (= :logseq.property/empty-placeholder (:db/ident node))
                                  (cond
                                    (= property-type :class)
                                    (ldb/private-tags (:db/ident node))

                                    (and property-type (not= property-type :node))
                                    (if (= property-type :page)
                                      (not (entity/page? node))
                                      (not (contains? (ldb/get-entity-types node) property-type)))

                                    :else
                                    false))))
                          result)))
        nodes (cond->> nodes
                tags?
                (remove entity/property?))
        options (map (fn [node]
                       (let [node (if (:value node)
                                    (assoc (:value node) :block/title (:label node))
                                    node)
                             id (:db/id node)
                             title (when (integer? id)
                                     (if (seq (:logseq.property/classes property))
                                       (some-> (db-content/recur-replace-uuid-in-block-title node)
                                               (subs 0 256))
                                       (block-handler/block-unique-title node)))
                             [header label] (if (integer? id)
                                              (when title
                                                (let [node node
                                                      header (when-not (entity/page? node)
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
                                                     :label-value (or (:block/title node) title)
                                                     :label label
                                                     :value id
                                                     :disabled? (and tags? (contains?
                                                                            (set/union #{:logseq.class/Journal}
                                                                                       (set/difference ldb/internal-tags #{:logseq.class/Page}))
                                                                            (:db/ident node)))))) nodes)
        options (let [allow-page-class? (or (contains? selected-choice-ids page-class-id)
                                            (not (or (and (entity/page? block) (not (entity/internal-page? block)))
                                                     (:logseq.property/created-from-property block))))]
                  (if (and tags? allow-page-class? page-class page-class-title)
                    (cons page-option (remove #(= (:value %) page-class-id) options))
                    options))
        classes' (remove (fn [class] (= :logseq.class/Root (:db/ident class))) classes)
        opts' (cond->
               (merge
                opts
                {:multiple-choices? multiple-choices?
                 :tap-*input-val set-input!
                 :items options
                 :selected-choices selected-choices
                 :dropdown? dropdown?
                 :input-default-placeholder (t :property/set-placeholder (db-property/built-in-display-title property t))
                 :show-new-when-not-exact-match? (not
                                                  (or (and extends-property?
                                                  (or (contains? (set children-pages) (:db/id block))
                                                      (when-let [input (when *input @*input)]
                                                        (when-not (string/blank? input)
                                                          (some (fn [ident]
                                                                  (= input (name ident))) ldb/extends-hidden-tags)))))
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
                                      entity (when (integer? id)
                                               (db-async/<get-block (state/get-current-repo) id {:children? false}))]
                                (if id
                                  (p/do!
                                   (add-or-remove-property-value block property id selected? {})
                                   (when (fn? add-new-choice!)
                                     (add-new-choice!
                                      {:value (select-keys entity [:db/id :block/uuid])
                                       :label (:block/title entity)})))
                                  (when-not add-tag-property?
                                    (log/error :msg "No :db/id found or created for chosen" :chosen chosen)))))})

                (= :block/tags (:db/ident property))
                (assoc :exact-match-exclude-items
                       (set (map name ldb/private-tags))
                       :choose-first-on-enter? true
                       :transform-fn
                       (fn [results input]
                         (if (and page-class-id
                                  page-class-title
                                  (string/includes? (string/lower-case page-class-title)
                                                    (string/lower-case (or input ""))))
                           (cons page-option (remove #(= (:value %) page-class-id) results))
                           results)))

                (and (seq classes') (not tags-or-alias?))
                (assoc
                 ;; Provides additional completion for inline classes on new pages or objects
                 :transform-fn (fn [results input]
                                 (if-let [[_ new-page class-input] (and (empty? results) (re-find #"(.*)#(.*)$" input))]
                                   (let [descendent-classes (->> classes'
                                                                 (mapcat #(get structured-children-by-class-id (:db/id %)))
                                                                 (keep (fn [id]
                                                                         (some (fn [class]
                                                                                 (when (= id (:db/id class))
                                                                                   class))
                                                                               all-classes))))]
                                     (->> (concat classes' descendent-classes)
                                          (filter #(string/includes? (:block/title %) class-input))
                                          (mapv (fn [p]
                                                  {:value (str new-page "#" (:block/title p))
                                                   :label (str new-page "#" (:block/title p))}))))
                                   results))))]
    (select-aux block property opts')))

(defn- class-by-ident
  [classes ident]
  (some (fn [class]
          (when (= ident (:db/ident class))
            class))
        classes))

(def ^:private all-classes-query-options
  {:except-root-class? false
   :except-private-tags? false})

(hsx/defc property-value-select-node
  [block property opts
   {:keys [*show-new-property-config?]}]
  (let [[initial-choices set-initial-choices-state!] (hooks/use-state nil)
        [result set-result!] (hooks/use-state nil)
        *initial-choices (hooks/use-ref nil)
        current-initial-choices (fn []
                                  (or (hooks/deref *initial-choices) initial-choices))
        set-initial-choices! (fn [value]
                               (hooks/set-ref! *initial-choices value)
                               (set-initial-choices-state! value))
        set-result-and-initial-choices! (fn [value]
                                          (set-initial-choices! value)
                                          (set-result! value))
        repo (state/get-current-repo)
        classes (:logseq.property/classes property)
        class? (= :class (:logseq.property/type property))
        [class-data set-class-data!] (hooks/use-state nil)
        all-classes (:all-classes class-data)
        page-class (class-by-ident all-classes :logseq.class/Page)
        tag-class (class-by-ident all-classes :logseq.class/Tag)
        input-opts (fn [_]
                     {:on-click (fn []
                                  (when *show-new-property-config?
                                    (reset! *show-new-property-config? false)))
                      :on-key-down
                      (fn [e]
                        (cond
                          (and (util/meta-key? e)
                               (.-shiftKey e)
                               (= "m" (string/lower-case (util/ekey e))))
                          (do
                            (shui/popup-hide!)
                            (editor-handler/move-selected-blocks e))

                          (= "Escape" (util/ekey e))
                          (when-let [f (:on-chosen opts)] (f))

                          :else
                          nil))})
        opts' (assoc opts
                     :block block
                     :class-data class-data
                     :input-opts input-opts
                     :on-input (fn [v]
                                 (if (string/blank? v)
                                   (set-result! (current-initial-choices))
                                   ;; TODO rank initial choices higher
                                  (p/let [result (search/block-search (state/get-current-repo) v {:enable-snippet? false
                                                                                                   :built-in? false})]
                                    (set-result!
                                     (cond-> result
                                       (and page-class
                                            (= :block/tags (:db/ident property))
                                            (string/includes? (string/lower-case "Page")
                                                              (string/lower-case v)))
                                       (conj page-class))))))
                     :add-new-choice! (fn [new-choice]
                                        (set-initial-choices! (add-initial-node-choice (current-initial-choices) new-choice))))
        non-root-classes (cond-> (remove (fn [c] (= (:db/ident c) :logseq.class/Root)) classes)
                           (and class? tag-class)
                           (conj tag-class))
        extends-property? (= (:db/ident property) :logseq.property.class/extends)]

    (hooks/use-effect!
     (fn []
       (p/let [all-classes (db-async/<get-all-classes repo all-classes-query-options)
               class-options (db-async/<get-all-classes
                              repo
                              {:except-root-class? true
                               :except-private-tags? (not (contains? #{:logseq.property/template-applied-to} (:db/ident property)))})
               extends-class-options (db-async/<get-all-classes repo {:except-extends-hidden-tags? true})
               class-ids (->> (concat all-classes classes [(when extends-property? block)])
                              (keep :db/id)
                              distinct)
               structured-children (p/all
                                    (mapv (fn [class-id]
                                            (p/let [children (db-async/<get-structured-children repo class-id)]
                                              [class-id children]))
                                          class-ids))]
         (set-class-data! {:all-classes all-classes
                           :class-options class-options
                           :extends-class-options extends-class-options
                           :structured-children-by-class-id (into {} structured-children)}))
       nil)
     [repo (:db/ident property) (:db/id block)])

    ;; effect runs once
    (hooks/use-effect!
     (fn []
       (when (and class-data (not extends-property?))
         (p/let [result (<load-initial-node-choices repo property non-root-classes)]
           (set-result-and-initial-choices! result)))
       nil)
     [class-data])

    (when class-data
      (select-node property opts' result))))

(hsx/defc select
  [block property
   {:keys [multiple-choices? dropdown? content-props] :as select-opts}
   {:keys [*show-new-property-config? exit-edit?] :as opts}]
  (let [*values (hooks/use-memo #(atom :loading) [(:db/ident block) (:db/ident property)])
           [values] (hooks/use-atom *values)
           refresh-result-f (hooks/use-callback
                             (fn []
                               (p/let [property-ident (if (= :logseq.property/default-value (:db/ident property))
                                                        (:db/ident block)
                                                        (:db/ident property))
                                       result (db-async/<get-property-values property-ident)]
                                 (reset! *values result)))
                             [(:db/ident block) (:db/ident property)])]
       (hooks/use-effect!
        (fn []
          (reset! *values :loading)
          (refresh-result-f))
        [refresh-result-f])
       (when-not (= :loading values)
         (let [type (:logseq.property/type property)
               closed-values? (seq (:property/closed-values property))
               items (if closed-values?
                       (let [date? (and
                                    (= (:db/ident property) :logseq.property.repeat/recur-unit)
                                    (= :date (:logseq.property/type (:property opts))))
                             values (cond->> (db-property/scoped-closed-values property block)
                                      date?
                                      (remove (fn [b] (contains? #{:logseq.property.repeat/recur-unit.minute :logseq.property.repeat/recur-unit.hour} (:db/ident b)))))]
                         (keep (fn [block]
                                 (let [icon (pu/get-block-property-value block :logseq.property/icon)
                                       value (or (db-property/built-in-display-title block t)
                                                 (db-property/closed-value-content block))]
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
                            [{:label (t :ui/true)
                              :value true}
                             {:label (t :ui/false)
                              :value false}]
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
                      :input-default-placeholder (t :property/set-placeholder (db-property/built-in-display-title property t))
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

(hsx/defc property-normal-block-value
  [block property value-block opts]
  (let [container-id (state/use-container-id)
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
        [:div (property-value-block-container-props property)
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
             ^{:key (str (:db/id block) "-" (:db/id property) "-" (:db/id value-block))}
             [:<> (block-container (assoc config
                                          :block/uuid (:block/uuid value-block)
                                          :property-default-value? default-value?) value-block)]))]

        :else
        [:div.w-full.h-full.jtrigger.ls-empty-text-property.text-muted-foreground
         {:tabIndex 0
          :class (if (:table-view? opts) "cursor-pointer" "cursor-text")
          :style {:min-height 20 :margin-left 3}
          :on-click #(<create-new-block! block property "")}
         (when (:class-schema? opts)
           (t :property/add-description))]))))

(hsx/defc property-block-value
  [value block property page-cp opts]
  (let [v-block value
        class? (entity/class? v-block)]
    (cond
      (entity/page? v-block)
      ^{:key (:db/id v-block)}
      [:<> (page-cp {:disable-preview? true
                     :tag? class?
                     :with-tags? false} v-block)]

      :else
      (property-normal-block-value block property v-block opts))))

(hsx/defc single-string-input
  [block property value table-view?]
  (let [[editing? set-editing!] (hooks/use-state false)
        *ref (hooks/use-ref nil)
        string-value (cond
                       (string? value) value
                       (some? value) (str (db-property/property-value-content value))
                       :else "")
        [value set-value!] (hooks/use-state string-value)
        set-property-value! (fn [value & {:keys [exit-editing?]
                                          :or {exit-editing? true}}]
                              (let [next-value (or value "")
                                    blank? (string/blank? next-value)]
                                (p/do!
                                 (if blank?
                                   (when (get block (:db/ident property))
                                     (db-property-handler/remove-block-property! (:db/id block) (:db/ident property)))
                                 (when (not= string-value next-value)
                                     (db-property-handler/set-block-property! (:db/id block)
                                                                              (:db/ident property)
                                                                              next-value)))
                                 (set-value! (if blank? "" next-value))
                                 (when exit-editing?
                                   (set-editing! false)))))]
    (hooks/use-effect!
     (fn []
       (set-value! string-value)
       #())
     [string-value])

    [:div.ls-string.flex.flex-1.jtrigger
     {:ref *ref
      :on-click #(do
                   (state/clear-selection!)
                   (set-editing! true))}
     (if editing?
       (shui/input
        {:auto-focus true
         :class (str "ls-string-input h-6 px-0 py-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                     (when table-view? " text-sm"))
         :value value
         :on-change (fn [e]
                      (set-value! (util/evalue e)))
         :on-blur (fn [_e]
                    (p/do!
                     (set-property-value! value)))
         :on-key-down (fn [e]
                        (case (util/ekey e)
                          "Enter"
                          (do
                            (util/stop e)
                            (set-property-value! value))
                          "Escape"
                          (do
                            (util/stop e)
                            (set-value! string-value)
                            (set-editing! false)
                            (some-> (hooks/deref *ref) (.focus)))
                          nil))})
       (if (string/blank? string-value)
         (property-empty-text-value property {:table-view? table-view?})
         string-value))]))

(hsx/defc closed-value-item
  [value {:keys [inline-text icon?]}]
  (let [block value]
    (when value
       (let [property-block? (db-property/property-created-block? block)
             value' (or (db-property/built-in-display-title block t)
                        (db-property/closed-value-content block))
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
                           (t :ui/empty)
                           value')]
              (inline-text {} :markdown value'))])))))

(defn multiple-values-trigger-class
  [{:keys [expanded? other-position? page-property?]}]
  (str "flex flex-1 min-w-0 flex-row items-center gap-1 "
       (if (and other-position? (not expanded?) (not page-property?))
         "flex-nowrap multi-values-nowrap"
         (str "flex-wrap " (when expanded? "multi-values-expanded")))))

(defn multiple-value-item-class
  [{:keys [expanded? other-position? page-property? show-popup!]}]
  (when (and show-popup! other-position? (not expanded?) (not page-property?))
    "shrink-0"))

(hsx/defc select-item
  [property type value {:keys [page-cp inline-text other-position? property-position table-view? _icon?] :as opts}]
  (let [closed-values? (seq (:property/closed-values property))
        tag? (or (:tag? opts) (= (:db/ident property) :block/tags))
        inline-text-cp (fn [content]
                         [:div.flex.flex-row.items-center
                          (inline-text {} :markdown (macro-util/expand-value-if-macro content (state/get-macros)))])]
    [:div.select-item.cursor-pointer
     {:class (multiple-value-item-class opts)}
     (cond
       (= value :logseq.property/empty-placeholder)
       (property-empty-btn-value property opts)

       closed-values?
       (closed-value-item value opts)

       (or (entity/page? value)
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
                                             (t :ui/open-named (:block/title value)))

                                            (shui/dropdown-menu-item
                                             {:key "open sidebar"
                                              :on-click #(state/sidebar-add-block! (state/get-current-repo) (:db/id value) :page)}
                                             (t :sidebar.right/open))])
                                         {:as-dropdown? true
                                          :content-props {:on-click (fn [] (shui/popup-hide!))}
                                          :align "start"}))}]
           ^{:key (:db/id value)}
           [:<> (page-cp opts value)]))

       (contains? #{:node :class :property :page :asset} type)
       (when-let [reference (state/get-component :block/reference)]
         (when value (reference {:table-view? table-view?} (:block/uuid value))))

       (and (map? value) (some? (db-property/property-value-content value)))
       (let [content (str (db-property/property-value-content value))]
         (inline-text-cp content))

       :else
       (inline-text-cp (str value)))]))

(hsx/defc single-value-select
  [block property value select-opts {:keys [value-render popup-focus-trigger? popup-auto-focus-trigger?] :as opts}]
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
                      (when-let [anchor (hooks/deref *el)]
                        (shui/popup-show! anchor (fn [] (popup-content target))
                                          (cond->
                                           {:align "start"
                                            :as-dropdown? true
                                            :auto-focus? (not (false? popup-auto-focus-trigger?))
                                            :force-popover? true
                                            :trigger-id trigger-id}
                                            (some? popup-focus-trigger?)
                                            (assoc :focus-trigger? popup-focus-trigger?)))))]
    (if editing?
      (popup-content nil)
      (let [show! (fn [e]
                    (util/stop e)
                    (state/clear-selection!)
                    (let [target (when e (.-target e))]
                      (when-not (or config/publishing?
                                    (util/shift-key? e)
                                    (util/meta-key? e)
                                    (property-value-popup-blocked-link? target))
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
                           (do (some-> (hooks/deref *el) (.click))
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
        (t :property/set-default-value)]

       (= (:db/ident property) :logseq.property.publish/published-url)
       [:div.flex.items-center.gap-2.w-full
        [:a {:href (:block/title value)
             :target "_blank"}
         (:block/title value)]

        (when-not config/publishing?
          (shui/button
           {:variant :text
            :size :sm
            :class "text-xs"
            :on-click (fn [e]
                        (util/stop e)
                        (publish-handler/unpublish-page! block))}
           (t :publish/unpublish)))]

       text-ref-type?
       (property-block-value value block property page-cp opts)

       :else
       (let [content (inline-text {} :markdown (macro-util/expand-value-if-macro (str value) (state/get-macros)))]
         (cond
           (contains? (set (keys string-value-on-click))
                      (:db/ident property))
           [:div.w-full {:on-click (fn []
                                     (let [f (get string-value-on-click (:db/ident property))]
                                       (f block property)))}
            content]

           :else
           content)))]))

(hsx/defc single-number-input
  [block property value-block table-view?]
  (let [[editing? set-editing!] (hooks/use-state false)
        *ref (hooks/use-ref nil)
        *input-ref (hooks/use-ref nil)
        number-value (db-property/property-value-content value-block)
        number-value-str (if (some? number-value) (str number-value) "")
        [value set-value!] (hooks/use-state number-value-str)
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

                               (set-value! (if (string/blank? value) "" (str value)))

                               (when exit-editing?
                                 (set-editing! false))))]
    (hooks/use-effect!
     (fn []
       #(set-property-value! @*value))
     [])

    (hooks/use-effect!
     (fn []
       (set-value! number-value-str)
       #())
     [number-value-str])

    [:div.ls-number.flex.flex-1.jtrigger
     {:ref *ref
      :on-click #(do
                   (state/clear-selection!)
                   (set-editing! true))}
     (if editing?
       (shui/input
        {:ref *input-ref
         :auto-focus true
         :class (str "ls-number-input !h-6 min-h-0 px-0 !py-0 border-none bg-transparent leading-6 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                     (when table-view? " text-sm"))
         :value value
         :type "number"
         :on-change (fn [e]
                      (set-value! (util/evalue e))
                      (reset! *value (util/evalue e)))
         :on-blur (fn [_e]
                    (p/do!
                     (set-property-value! value)))
         :on-key-down (fn [e]
                        (let [input (hooks/deref *input-ref)
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
                               (.focus (hooks/deref *ref)))

                              nil))))})
       (if (string/blank? value)
         (property-empty-btn-value property)
         value))]))

(defn- asset-icon-for-type
  "Returns a tabler-icon name for a given asset file extension string."
  [asset-type]
  (let [kw (some-> asset-type keyword)]
    (cond
      (contains? (common-config/img-formats) kw) "photo"
      (contains? config/audio-formats kw) "music"
      (contains? config/video-formats kw) "movie"
      (= :pdf kw) "file-type-pdf"
      :else "file")))

(defn- asset-image?
  [asset-type]
  (contains? (common-config/img-formats) (some-> asset-type keyword)))

(defn- asset-video?
  [asset-type]
  (contains? config/video-formats (some-> asset-type keyword)))

(def ^:private asset-embedded-control-selector
  ".asset-action-bar, .ui__popover-content, .ui__dropdown-menu-content, .ui__context-menu-content, [role='menu'], [role='menuitem'], button, a, input, textarea, select")

(defn- asset-embedded-control-click?
  [^js target]
  (some? (some-> target (.closest asset-embedded-control-selector))))

(def ^:private asset-thumb-fit-class
  "CSS escape hatch that makes asset-cp's output fit the wrapper's bounding box.
  asset-cp wraps the <img> in a div.asset-container with no size constraint of
  its own, so max-h-full on the img resolves against an auto-sized parent and
  never actually caps height. Forcing .asset-container to w-full h-full (plus
  flex centering) gives the img a real bounded parent; the !w-auto/!h-auto +
  !max-w-full/!max-h-full + object-contain rules then shrink it proportionally
  to fit without cropping any aspect ratio."
  (str "[&_.asset-container]:!w-full [&_.asset-container]:!h-full "
       "[&_.asset-container]:flex [&_.asset-container]:items-center [&_.asset-container]:justify-center "
       "[&_img]:!w-auto [&_img]:!h-auto [&_img]:!max-w-full [&_img]:!max-h-full [&_img]:object-contain"))

(def asset-picker-grid-style
  {:width "min(640px, calc(100vw - 32px))"
   :max-width "100%"
   :box-sizing "border-box"
   :max-height "min(480px, calc(100vh - 96px))"
   :overflow "auto"})

(def asset-picker-items-grid-style
  {:grid-template-columns "repeat(auto-fill, minmax(140px, 1fr))"})

(defn- asset-value-id
  [value]
  (cond
    (map? value) (:db/id value)
    (number? value) value
    :else nil))

(defn- asset-selected-ids
  [block property]
  (let [value (get block (:db/ident property))]
    (cond
      (nil? value)
      #{}

      (map? value)
      (if-let [id (asset-value-id value)]
        #{id}
        #{})

      (coll? value)
      (set (keep asset-value-id value))

      :else
      (if-let [id (asset-value-id value)]
        #{id}
        #{}))))

(defn- assets-selected-first
  [assets selected-ids]
  (->> assets
       (map-indexed vector)
       (sort-by (fn [[idx asset]]
                  [(if (contains? selected-ids (:db/id asset)) 0 1)
                   idx]))
       (mapv second)))

(defn- show-asset-picker-error!
  [message err]
  (log/error :msg message :error err)
  (notification/show!
   (t :asset/picker-set-failed)
   :error))

(hsx/defc asset-value-content
  [value]
  (let [asset-type (:logseq.property.asset/type value)
        image? (asset-image? asset-type)
        video? (asset-video? asset-type)
        preview! (fn [e]
                   (when-not (asset-embedded-control-click? (.-target e))
                     (util/stop e)
                     (state/pub-event! [:asset/show-preview value])))
        preview-key! (fn [e]
                       (when (contains? #{" " "Enter"} (util/ekey e))
                         (preview! e)))]
    (if video?
      (shui/button
       {:variant :outline
        :size :sm
        :class "gap-1 h-auto whitespace-normal text-left"
        :data-asset-preview-trigger true
        :on-click preview!}
       (ui/icon "movie" {:size 14})
       [:span (:block/title value)])
      (when-let [asset-cp (state/get-component :block/asset-cp)]
        (if image?
          [:div.asset-value-thumb.flex-shrink-0.rounded.overflow-hidden.flex.items-center.justify-center
           {:class asset-thumb-fit-class
            :style {:width 80 :height 80}
            :role "button"
            :tabIndex 0
            :data-asset-preview-trigger true
            :onClickCapture preview!
            :on-key-down preview-key!}
           ^{:key (str "asset-cp-" (:block/uuid value))}
           [:<> (asset-cp {:disable-resize? true} value)]]
          [:div.asset-value-thumb.flex-shrink-0.flex.items-center
           {:role "button"
            :tabIndex 0
            :data-asset-preview-trigger true
            :onClickCapture preview!
            :on-key-down preview-key!}
           ^{:key (str "asset-cp-" (:block/uuid value))}
           [:<> (asset-cp {:disable-resize? true} value)]])))))

(defn- <select-assets!
  [block property many? selected-ids set-selected-ids! on-chosen assets]
  (let [asset-ids (vec (keep :db/id assets))]
    (when (seq asset-ids)
      (-> (if many?
            (p/all (map (fn [asset-id]
                          (db-property-handler/set-block-property!
                           (:db/id block) (:db/ident property) asset-id))
                        asset-ids))
            (db-property-handler/set-block-property!
             (:db/id block) (:db/ident property) (first asset-ids)))
          (p/then
           (fn []
             (set-selected-ids!
              (if many?
                (into selected-ids asset-ids)
                #{(first asset-ids)}))
             (when-not many?
               (shui/popup-hide!))))
          (p/then #(when on-chosen (on-chosen)))
          (p/catch #(show-asset-picker-error! "Failed to set asset property" %))))))

(defn- <unselect-asset!
  [block property many? selected-ids set-selected-ids! on-chosen asset]
  (when-let [asset-id (:db/id asset)]
    (-> (if many?
          (db-property-handler/delete-property-value!
           (:db/id block) (:db/ident property) asset-id)
          (db-property-handler/remove-block-property!
           (:db/id block) (:db/ident property)))
        (p/then
         (fn []
           (set-selected-ids! (disj selected-ids asset-id))
           (when on-chosen (on-chosen))))
        (p/catch #(show-asset-picker-error! "Failed to unset asset property" %)))))

(defn- open-asset-file-picker!
  [upload-files!]
  (let [input (js/document.createElement "input")
        cleanup! (fn []
                   (some-> (.-parentNode input)
                           (.removeChild input)))]
    (set! (.-type input) "file")
    (set! (.-multiple input) true)
    (set! (.. input -style -display) "none")
    (.addEventListener input "change"
                       (fn [e]
                         (let [input (.-target e)]
                           (upload-files! (.-files input))
                           (cleanup!))))
    (.addEventListener input "cancel" cleanup!)
    (.appendChild js/document.body input)
    (.click input)))

(hsx/defc asset-grid-upload-button
  [saving? open-file-picker!]
  [:div.flex.items-center.justify-end.mb-2.min-w-0
   (shui/button
    {:size :sm
     :variant :outline
     :class "max-w-full whitespace-nowrap"
     :disabled saving?
     :on-click (fn [e]
                 (util/stop e)
                 (open-file-picker!))}
    (ui/icon "upload" {:size 14})
    (t :asset/add-assets))])

(hsx/defc asset-grid-cell
  [asset selected? toggle-asset!]
  (let [asset-type (:logseq.property.asset/type asset)
        image? (asset-image? asset-type)]
    [:div.asset-picker-cell.relative.rounded.overflow-hidden.border.flex.flex-col.p-0.hover:bg-gray-03.cursor-pointer
     {:key (str (:block/uuid asset))
      :title (:block/title asset)
      :role "button"
      :tabIndex 0
      :style {:aspect-ratio "1 / 1"}
      :class (when selected? "ring-2 ring-primary border-primary")
      :aria-pressed selected?
      :on-click #(toggle-asset! asset)
      :on-key-down (fn [e]
                     (when (contains? #{" " "Enter"} (util/ekey e))
                       (util/stop e)
                       (toggle-asset! asset)))}
     [:div.asset-picker-title.w-full.px-1.py-0.5.text-xs.truncate.text-left.border-b.opacity-80
      (:block/title asset)]
     [:div.flex.flex-1.items-center.justify-center.w-full.overflow-hidden.p-1.pointer-events-none
      {:style {:min-height 0}}
      (if image?
        (when-let [asset-cp (state/get-component :block/asset-cp)]
          [:div.flex.items-center.justify-center.w-full.h-full
           {:class asset-thumb-fit-class}
           (asset-cp {:disable-resize? true} asset)])
        [:div.flex.flex-col.items-center.justify-center.gap-1.opacity-70
         (ui/icon (asset-icon-for-type asset-type) {:size 40})
         [:span.text-xs.uppercase (or asset-type (t :asset/picker-fallback-type))]])]
     [:div.absolute.right-1.bottom-1.pointer-events-none.rounded.bg-popover.shadow-sm
      (shui/checkbox {:checked selected?
                      :tabIndex -1
                      :aria-hidden true})]]))

(hsx/defc asset-grid-assets
  [assets selected-ids toggle-asset!]
  [:div.grid.gap-2
   {:style asset-picker-items-grid-style}
   (for [asset (assets-selected-first assets selected-ids)]
     ^{:key (str (:block/uuid asset))}
     [asset-grid-cell asset
      (contains? selected-ids (:db/id asset))
      toggle-asset!])])

(hsx/defc asset-grid-popup-content
  [block property {:keys [on-chosen]}]
  (let [[assets set-assets!] (hooks/use-state nil)
        [selected-ids set-selected-ids!] (hooks/use-state (asset-selected-ids block property))
        [saving? set-saving!] (hooks/use-state false)
        repo (state/get-current-repo)
        many? (db-property/many? property)
        select-assets! #(<select-assets! block property many? selected-ids set-selected-ids! on-chosen %)
        unselect-asset! #(<unselect-asset! block property many? selected-ids set-selected-ids! on-chosen %)
        toggle-asset! (fn [asset]
                        (if (contains? selected-ids (:db/id asset))
                          (unselect-asset! asset)
                          (select-assets! [asset])))
        upload-files! (fn [^js files]
                        (let [files (array-seq files)]
                          (when (seq files)
                            (set-saving! true)
                            (-> (editor-handler/db-based-save-assets! repo files)
                                (p/then
                                 (fn [saved-assets]
                                   (let [saved-assets (vec (remove nil? saved-assets))]
                                     (when (seq saved-assets)
                                       (set-assets! (vec (concat (or assets []) saved-assets)))
                                       (select-assets! saved-assets)))))
                                (p/catch #(show-asset-picker-error! "Failed to add assets from picker" %))
                                (p/finally #(set-saving! false))))))]
    (hooks/use-effect!
     (fn []
       (p/let [asset-class (state/<invoke-db-worker :thread-api/pull repo [:db/id] :logseq.class/Asset)
               result (when asset-class
                        (db-async/<get-tag-objects repo (:db/id asset-class)))]
         (set-assets! (vec result))))
     [])
    [:div.asset-picker-grid.p-3
     {:style asset-picker-grid-style}
     (asset-grid-upload-button saving? #(open-asset-file-picker! upload-files!))
     (cond
       (nil? assets)
       [:div.p-4.opacity-60 (t :ui/loading)]

       (empty? assets)
       [:div.p-4.opacity-60.flex.flex-col.gap-1
        [:div (t :asset/picker-empty)]
        [:div.text-sm (t :asset/picker-empty-hint)]]

       :else
       (asset-grid-assets assets selected-ids toggle-asset!))]))

(hsx/defc asset-value-picker
  [block property value opts]
  (let [*el (hooks/use-ref nil)
        editing? (:editing? opts)
        show-grid! (fn [target]
                     (when-not config/publishing?
                       (shui/popup-show! target
                                         (fn [] (asset-grid-popup-content block property opts))
                                         {:align "start"
                                          :auto-focus? true})))
        show-grid-from-click! (fn [e]
                                (when-not (some-> (.-target e)
                                                  (.closest (str "[data-asset-preview-trigger], "
                                                                 asset-embedded-control-selector)))
                                  (util/stop e)
                                  (show-grid! (or (.-currentTarget e) (hooks/deref *el)))))]
    (if (show-inline-asset-picker? editing? value)
      [:div.property-select.w-full
       (asset-grid-popup-content block property opts)]
      (shui/trigger-as
       :div.jtrigger.flex.flex-1.w-full
       {:ref *el
        :tabIndex 0
        :aria-label (t :asset/picker-open)
        :onClickCapture show-grid-from-click!
        :on-click show-grid-from-click!
        :on-key-down (fn [e]
                       (case (util/ekey e)
                         "ArrowUp"
                         (move-property-value-boundary! e :up)

                         "ArrowDown"
                         (move-property-value-boundary! e :down)

                         ("Backspace" "Delete")
                         (when-not config/publishing?
                           (delete-block-property! block property))
                         (" " "Enter")
                         (do (show-grid! (or (.-currentTarget e) (hooks/deref *el)))
                             (util/stop e))
                         nil))}
       (if (and value (:db/id value))
         [:div.flex.items-center.gap-2.w-full.flex-wrap
          (asset-value-content value)]
         [:div.w-full.cursor-pointer
          {:on-click show-grid-from-click!}
          (property-empty-text-value property opts)])))))

(hsx/defc property-scalar-value-aux
  [block property value* {:keys [editing? on-chosen]
                          :as opts}]
  (let [type (:logseq.property/type property)
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

      (= type :string)
      (single-string-input block property value (:table-view? opts))

      (= type :asset)
      (asset-value-picker block property value (assoc opts :editing? editing?))

      :else
      (if (and select-type?'
               (not (and (not closed-values?) (contains? #{:date :datetime} type))))
        (let [classes (:block/tags block)
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
            [:label.flex.w-full.items-center.as-scalar-value-wrap.cursor-pointer
             ^{:key "checkbox"}
             [:<> (shui/checkbox {:class "jtrigger flex flex-row items-center"
                                  :style {:width 16
                                          :min-width 16}
                                  :disabled config/publishing?
                                  :auto-focus editing?
                                  :checked value
                                  :on-checked-change (fn []
                                                       (add-property! (not value)))
                                  :on-key-down (fn [e]
                                                 (when (= (util/ekey e) "Enter")
                                                   (add-property! (not value)))
                                                 (when (contains? #{"Backspace" "Delete"} (util/ekey e))
                                                   (delete-block-property! block property)))})]])
          ;; :others
          [:div.flex.flex-1
           ^{:key "property-value-inner"}
           [:<> (property-value-inner block property value opts)]])))))

(hsx/defc property-scalar-value
  [block property value* {:keys [container-id editing?]
                          :as opts}]
  (let [block-editing? (boolean (get (rfx/use-sub [:editor/editing?])
                                     [container-id (:block/uuid block)]))
        editing (or editing?
                    (and block-editing?
                         (= (:db/id property) (:db/id (:property (state/get-editor-action-data))))))]
    (property-scalar-value-aux block property value* (assoc opts :editing? editing))))

(hsx/defc multiple-values-inner
  [block property v {:keys [on-chosen editing?] :as opts}]
  (let [type (:logseq.property/type property)
        date? (contains? #{:date :datetime} type)
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
                       (case type
                         :asset
                         (asset-grid-popup-content block property select-opts)

                         (:node :page :class :property)
                         (property-value-select-node block property
                                                     (assoc select-opts :target target)
                                                     opts)

                         (select block property select-opts opts))]))]
    (if editing?
      (if date?
        (property-value-date-picker block property nil (assoc opts :editing? true))
        (select-cp {} nil))
      (let [toggle-fn shui/popup-hide!
            content-fn (fn [{:keys [_id content-props]} target]
                         (select-cp {:content-props content-props} target))
            show-popup! (fn [^js e]
                          (let [target (.-target e)]
                            (when-not (or config/publishing?
                                          (property-value-popup-blocked-link? target))
                              (shui/popup-show! (hooks/deref *el)
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
                           (do (some-> (hooks/deref *el) (.click))
                               (util/stop e))
                           ("Backspace" "Delete")
                           (delete-block-property! block property)
                           :dune))
          :class (multiple-values-trigger-class opts)}
                 (let [items' (vec items)
                       not-empty-value? (not= (map :db/ident items') [:logseq.property/empty-placeholder])]
                   (if (and (seq items) not-empty-value?)
                     (if (= type :asset)
                       (for [item items']
                         ^{:key (or (:block/uuid item) (str item))}
                         [asset-value-content item])
                       (concat
                        (for [[idx item] (map-indexed vector items')]
                          ^{:key (str "value-" (or (:block/uuid item) item) "-" idx)}
                          [:<>
                           [select-item property type item (assoc opts :show-popup! show-popup!)]
                           (when (< idx (dec (count items')))
                             [:span.opacity-50.-ml-1 ","])])
                        (when date?
                          [^{:key "empty-date-picker"}
                           (property-value-date-picker block property nil {:toggle-fn toggle-fn})])))
             (if date?
               (property-value-date-picker block property nil {:toggle-fn toggle-fn})
               (if (= type :asset)
                 [:div.w-full.cursor-pointer
                  {:on-click show-popup!}
                  (property-empty-text-value property opts)]
                 (property-empty-text-value property opts)))))]))))

(hsx/defc multiple-values
  [block property opts]
  (let [value (get block (:db/ident property))
           value' (if (coll? value) value
                      (when (some? value) #{value}))]
       (multiple-values-inner block property value' opts)))

(defn- resolved-property-value-for-render
  [block property multiple-values?]
  (let [v (get block (:db/ident property))
        block-loaded? (some? (:block/uuid block))]
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
     (when block-loaded?
       (:logseq.property/default-value property)))))

(hsx/defc ^:large-vars/cleanup-todo property-value
  [block property {:keys [show-tooltip? p-block p-property editing?]
                   :as opts}]
  (ui/catch-error
   (ui/block-error (t :sync/something-wrong) {})
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
            v (resolved-property-value-for-render block property multiple-values?)
            self-value-or-embedded? (fn [v]
                                      (or (= (:db/id v) (:db/id block))
                                          ;; property value self embedded
                                          (and (:db/id block) (= (:block/link-id v) (:db/id block)))))]
      (if (and (or (and (entity-map? v)
                        (self-value-or-embedded? v))
                   (and (coll? v) (every? entity-map? v)
                        (some self-value-or-embedded? v))
                   (and (:db/id block)
                        (= p-block (:db/id block))
                        (= p-property (:db/id property))))
               (not (some #(= :logseq.class/Tag (:db/ident %)) (:block/tags block))))
        [:div.flex.flex-row.items-center.gap-1
         [:div.warning (t :property/self-reference)]
         (shui/button {:variant :outline
                       :size :sm
                       :class "h-5"
                       :on-click (fn []
                                   (db-property-handler/remove-block-property!
                                    (:db/id block)
                                    (:db/ident property)))}
                      (t :ui/fix))]
        (let [empty-value? (when (coll? v) (= :logseq.property/empty-placeholder (:db/ident (first v))))
              closed-values? (seq (:property/closed-values property))
              value-cp [:div.property-value-inner
                        {:data-type type
                         :class (str (when empty-value? "empty-value")
                                     (when-not (:other-position? opts) " w-full"))
                         :on-pointer-down (fn [e]
                                            (when-not (some-> (.-target e)
                                                             (.closest ".ui__popover-content, .ui__dropdown-menu-content, .ui__context-menu-content"))
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
              {:delay 1200}
              (shui/tooltip-trigger
               {:onFocusCapture #(util/stop-propagation %)
                :as-child true}
               value-cp)
              (shui/tooltip-portal
               (shui/tooltip-content
                (t :property/change-tooltip (db-property/built-in-display-title property t))))))
            value-cp))))))
