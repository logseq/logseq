(ns frontend.components.property.value
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.impl.entity :as de]
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
            [frontend.handler.page :as page-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.route :as route-handler]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.functions :refer [debounce]]
            [lambdaisland.glogi :as log]
            [logseq.common.util.macro :as macro-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.outliner.property :as outliner-property]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

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
      (shui/button (merge {:class "empty-btn !text-base" :variant :text} opts)
                   text))))

(rum/defc property-empty-text-value
  [property {:keys [property-position]}]
  [:span.inline-flex.items-center.cursor-pointer
   (merge {:class "empty-text-btn" :variant :text})
   (if property-position
     (if-let [icon (:logseq.property/icon property)]
       (icon-component/icon icon {:color? true})
       (ui/icon "line-dashed"))
     "Empty")])

(rum/defc icon-row
  [block editing?]
  (let [icon-value (:logseq.property/icon block)
        clear-overlay! (fn []
                         (shui/dialog-close!)
                         (shui/popup-hide-all!))
        on-chosen! (fn [_e icon]
                     (if icon
                       (db-property-handler/set-block-property!
                        (:db/id block)
                        :logseq.property/icon
                        (select-keys icon [:type :id :color]))
                       (db-property-handler/remove-block-property!
                        (:db/id block)
                        :logseq.property/icon))
                     (clear-overlay!))]

    (rum/use-effect!
     (fn []
       (when editing?
         (clear-overlay!)
         (let [^js container (or (some-> js/document.activeElement (.closest ".page"))
                                 (gdom/getElement "main-content-container"))
               icon (get block (pu/get-pid :logseq.property/icon))]
           (util/schedule
            (fn []
              (when-let [^js target (some-> (.querySelector container (str "#ls-block-" (str (:block/uuid block))))
                                            (.querySelector ".block-main-container"))]
                (shui/popup-show! target
                                  #(icon-component/icon-search
                                    {:on-chosen on-chosen!
                                     :icon-value icon
                                     :del-btn? (some? icon)})
                                  {:id :ls-icon-picker
                                   :align :start})))))))
     [editing?])

    [:div.col-span-3.flex.flex-row.items-center.gap-2
     (icon-component/icon-picker icon-value
                                 {:disabled? config/publishing?
                                  :del-btn? (some? icon-value)
                                  :on-chosen on-chosen!})]))

(defn- select-type?
  [block property type]
  (or (contains? #{:node :number :date :page :class :property} type)
      ;; closed values
      (seq (:property/closed-values property))
      (and (= (:db/ident property) :logseq.property/default-value)
           (= (get-in block [:block/schema :type]) :number))))

(defn <create-new-block!
  [block property value & {:keys [edit-block?]
                           :or {edit-block? true}}]
  (when-not (or (get-in property [:block/schema :hide?])
                (= (:db/ident property) :logseq.property/default-value))
    (ui/hide-popups-until-preview-popup!)
    (shui/dialog-close!))
  (p/let [block
          (if (and (contains? #{:default :url} (get-in property [:block/schema :type]))
                   (not (db-property/many? property)))
            (p/let [existing-value (get block (:db/ident property))
                    default-value (:logseq.property/default-value property)
                    existing-value? (and (some? existing-value)
                                         (not= (:db/ident existing-value) :logseq.property/empty-placeholder)
                                         (not= (:db/id existing-value) (:db/id default-value)))
                    new-block-id (when-not existing-value? (db/new-block-id))
                    _ (when-not existing-value?
                        (let [value' (if (and default-value (string? value) (string/blank? value))
                                       (db-property/property-value-content default-value)
                                       value)]
                          (db-property-handler/create-property-text-block!
                           (:db/id block)
                           (:db/id property)
                           value'
                           {:new-block-id new-block-id})))]
              (if existing-value? existing-value (db/entity [:block/uuid new-block-id])))
            (p/let [new-block-id (db/new-block-id)
                    _ (db-property-handler/create-property-text-block!
                       (:db/id block)
                       (:db/id property)
                       value
                       {:new-block-id new-block-id})]
              (db/entity [:block/uuid new-block-id])))]
    (when edit-block?
      (editor-handler/edit-block! block :max {:container-id :unknown-container}))
    block))

(defn- get-operating-blocks
  [block]
  (let [selected-blocks (some->> (state/get-selection-block-ids)
                                 (map (fn [id] (db/entity [:block/uuid id])))
                                 (seq)
                                 block-handler/get-top-level-blocks
                                 (remove ldb/property?))]
    (or (seq selected-blocks) [block])))

(defn <add-property!
  "If a class and in a class schema context, add the property to its schema.
  Otherwise, add a block's property and its value"
  ([block property-key property-value] (<add-property! block property-key property-value {}))
  ([block property-id property-value {:keys [selected? exit-edit? class-schema?]
                                      :or {exit-edit? true}}]
   (let [repo (state/get-current-repo)
         class? (ldb/class? block)
         property (db/entity property-id)
         many? (db-property/many? property)
         checkbox? (= :checkbox (get-in property [:block/schema :type]))
         blocks (get-operating-blocks block)]
     (assert (qualified-keyword? property-id) "property to add must be a keyword")
     (p/do!
      (if (and class? class-schema?)
        (db-property-handler/class-add-property! (:db/id block) property-id)
        (let [block-ids (map :block/uuid blocks)]
          (if (and (db-property-type/all-ref-property-types (get-in property [:block/schema :type]))
                   (string? property-value))
            (p/let [new-block (<create-new-block! block (db/entity property-id) property-value {:edit-block? false})]
              (when (seq (remove #{(:db/id block)} (map :db/id block)))
                (property-handler/batch-set-block-property! repo block-ids property-id (:db/id new-block)))
              new-block)
            (property-handler/batch-set-block-property! repo block-ids property-id property-value))))
      (cond
        exit-edit?
        (do
          (ui/hide-popups-until-preview-popup!)
          (shui/dialog-close!))
        selected?
        (shui/popup-hide!))
      (when-not (or many? checkbox?)
        (when-let [input (state/get-input)]
          (.focus input)))
      (when checkbox?
        (state/set-editor-action-data! {:type :focus-property-value
                                        :property property}))))))

(defn- add-or-remove-property-value
  [block property value selected? {:keys [refresh-result-f] :as opts}]
  (let [many? (db-property/many? property)
        blocks (get-operating-blocks block)]
    (p/do!
     (if selected?
       (<add-property! block (:db/ident property) value
                       {:selected? selected?
                        :exit-edit? (if (some? (:exit-edit? opts)) (:exit-edit? opts) (not many?))})
       (p/do!
        (ui-outliner-tx/transact!
         {:outliner-op :save-block}
         (doseq [block blocks]
           (db-property-handler/delete-property-value! (:db/id block) (:db/ident property) value)))
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
    [:div.p-4.flex.flex-col.gap-4.w-64
     [:div.mb-4
      [:div.flex.flex-row.items-center.gap-1
       [:div.w-4
        (property-value block (db/entity :logseq.task/repeated?)
                        (assoc opts
                               :on-checked-change (fn [value]
                                                    (if value
                                                      (db-property-handler/set-block-property! (:db/id block)
                                                                                               :logseq.task/scheduled-on-property
                                                                                               (:db/id property))
                                                      (db-property-handler/remove-block-property! (:db/id block)
                                                                                                  :logseq.task/scheduled-on-property)))))]
       [:div "Set as repeated task"]]]
     [:div.flex.flex-row.gap-2
      [:div.flex.text-muted-foreground.mr-4
       "Every"]

      ;; recur frequency
      [:div.w-6
       (property-value block (db/entity :logseq.task/recur-frequency) opts)]

      ;; recur unit
      [:div.w-20
       (property-value block (db/entity :logseq.task/recur-unit) (assoc opts :property property))]]
     (let [properties (->>
                       (outliner-property/get-block-full-properties (db/get-db) (:db/id block))
                       (filter (fn [property]
                                 (and (not (ldb/built-in? property))
                                      (>= (count (:property/closed-values property)) 2))))
                       (concat [(db/entity :logseq.task/status)])
                       (util/distinct-by :db/id))
           status-property (or (:logseq.task/recur-status-property block)
                               (db/entity :logseq.task/status))
           property-id (:db/id status-property)
           done-choice (or
                        (some (fn [choice] (when (true? (:logseq.property/choice-checkbox-state choice)) choice)) (:property/closed-values status-property))
                        (db/entity :logseq.task/status.done))]
       [:div.flex.flex-col.gap-2
        [:div.text-muted-foreground
         "Reschedule when"]
        (shui/select
         (cond->
          {:on-value-change (fn [v]
                              (db-property-handler/set-block-property! (:db/id block)
                                                                       :logseq.task/recur-status-property
                                                                       v))}
           property-id
           (assoc :default-value property-id))
         (shui/select-trigger
          (shui/select-value {:placeholder "Select a property"}))
         (shui/select-content
          (map (fn [choice]
                 (shui/select-item {:value (:db/id choice)} (:block/title choice))) properties)))
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
                   (shui/dialog-close!)
                   (state/set-editor-action! nil)
                   state)}
  [state id {:keys [block property datetime? on-change del-btn? on-delete]}]
  (let [block (db/sub-block (:db/id block))
        value (get block (:db/ident property))
        value (cond
                (map? value)
                (js/Date. (date/journal-title->long (:block/title value)))

                (number? value)
                (js/Date. value)

                :else
                (let [d (js/Date.)]
                  (.setHours d 0 0 0)
                  d))
        *ident (::identity state)
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
                 (when-not (db/get-page journal)
                   (page-handler/<create! journal {:redirect? false
                                                   :create-first-block? false}))
                 (when (fn? on-change)
                   (let [value (if datetime? (tc/to-long d) (db/get-page journal))]
                     (on-change value)))
                 (when-not datetime?
                   (shui/popup-hide! id)
                   (ui/hide-popups-until-preview-popup!)
                   (shui/dialog-close!)))))))]
    [:div.flex.flex-row.gap-2
     [:div.flex.flex-col
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
     (shui/separator {:orientation "vertical"})
     (repeat-setting block property)]))

(rum/defc overdue
  [date content]
  (let [[current-time set-current-time!] (rum/use-state (t/now))]
    (rum/use-effect!
     (fn []
       (let [timer (js/setInterval (fn [] (set-current-time! (t/now))) (* 1000 60 3))]
         #(js/clearInterval timer)))
     [])
    (let [overdue? (when date (t/after? current-time (t/plus date (t/seconds 59))))]
      [:div
       (cond-> {} overdue? (assoc :class "overdue"
                                  :title "Overdue"))
       content])))

(defn- human-date-label
  [date]
  (let [today (t/today)]
    (cond
      (and (or (t/after? date today)
               (t/equal? date today))
           (t/before? date (t/plus today (t/days 1))))
      "Today"
      (and (or (t/equal? date (t/plus today (t/days 1)))
               (t/after? date (t/plus today (t/days 1))))
           (t/before? date (t/plus today (t/days 2))))
      "Tomorrow"
      (and (or (t/equal? date (t/minus today (t/days 1)))
               (t/after? date (t/minus today (t/days 1))))
           (t/before? date today))
      "Yesterday"
      :else
      nil)))

(rum/defc datetime-value
  [value property-id repeated-task?]
  (when-let [date (tc/from-long value)]
    (let [content [:div.ls-datetime.flex.flex-row.gap-1.items-center
                   (when-let [page-cp (state/get-component :block/page-cp)]
                     (let [page-title (date/journal-name (date/js-date->goog-date (js/Date. value)))]
                       (rum/with-key
                         (page-cp {:disable-preview? true
                                   :show-non-exists-page? true
                                   :label (human-date-label date)}
                                  {:block/name page-title})
                         page-title)))
                   (let [date (js/Date. value)
                         hours (.getHours date)
                         minutes (.getMinutes date)]
                     [:span.select-none
                      (str (util/zero-pad hours)
                           ":"
                           (util/zero-pad minutes))])]]
      (if (or repeated-task? (contains? #{:logseq.task/deadline :logseq.task/scheduled} property-id))
        (overdue date content)
        content))))

(rum/defc date-picker
  [value {:keys [block property datetime? on-change on-delete del-btn? editing? multiple-values? other-position?]}]
  (let [*trigger-ref (rum/use-ref nil)
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
        repeated-task? (:logseq.task/repeated? block)]
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
        :class "jtrigger min-h-[24px]"                     ; FIXME: min-h-6 not works
        :ref *trigger-ref
        :on-click open-popup!}
       [:div.flex.flex-row.gap-1.items-center
        (when repeated-task?
          (ui/icon "repeat" {:size 14 :class "opacity-40"}))
        (cond
          (map? value)
          (let [date (tc/to-date-time (date/journal-title->long (:block/title value)))
                compare-value (some-> date
                                      (t/plus (t/days 1))
                                      (t/minus (t/seconds 1)))
                content (when-let [page-cp (state/get-component :block/page-cp)]
                          (rum/with-key
                            (page-cp {:disable-preview? true
                                      :meta-click? other-position?
                                      :label (human-date-label date)} value)
                            (:db/id value)))]
            (if (or repeated-task? (contains? #{:logseq.task/deadline :logseq.task/scheduled} (:db/id property)))
              (overdue compare-value content)
              content))

          (number? value)
          (datetime-value value (:db/ident property) repeated-task?)

          :else
          (property-empty-btn-value nil))]))))

(rum/defc property-value-date-picker
  [block property value opts]
  (let [multiple-values? (db-property/many? property)
        repo (state/get-current-repo)
        datetime? (= :datetime (get-in property [:block/schema :type]))]
    (date-picker value
                 (merge opts
                        {:block block
                         :property property
                         :datetime? datetime?
                         :multiple-values? multiple-values?
                         :on-change (fn [value]
                                      (let [journal (when (number? value)
                                                      (date/journal-name (date/js-date->goog-date (js/Date. value))))]
                                        (p/do!
                                         (when-not (db/get-page journal)
                                           (page-handler/<create! journal
                                                                  {:redirect? false
                                                                   :create-first-block? false
                                                                   :tags #{:logseq.class/Journal}}))
                                         (property-handler/set-block-property! repo (:block/uuid block)
                                                                               (:db/ident property)
                                                                               (if datetime?
                                                                                 value
                                                                                 (:db/id value))))))
                         :del-btn? (some? value)
                         :on-delete (fn []
                                      (property-handler/set-block-property! repo (:block/uuid block)
                                                                            (:db/ident property) nil)
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
                   (and (= :logseq.property/parent (:db/ident property))
                        (ldb/class? block)))
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
                            :create-first-block? false
                            :tags (if inline-class-uuid
                                    [inline-class-uuid]
                                    ;; Only 1st class b/c page normally has
                                    ;; one of and not all these classes
                                    (mapv :block/uuid (take 1 classes)))}]
        (p/let [page (if class?
                       (db-page-handler/<create-class! page create-options)
                       (page-handler/<create! page create-options))]
          (:db/id page)))

      (and class? page? id)
      (p/let [_ (db-page-handler/convert-to-tag! page-entity)]
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
                (if (and (seq selected-choices)
                         (not multiple-choices?)
                         (not (and (ldb/class? block) (= (:db/ident property) :logseq.property/parent)))
                         (not= (:db/ident property) :logseq.property.view/type))
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
                (let [blocks (get-operating-blocks block)
                      block-ids (map :block/uuid blocks)]
                  (property-handler/batch-remove-block-property!
                   (state/get-current-repo)
                   block-ids
                   (:db/ident property)))
                (when-not (false? (:exit-edit? opts))
                  (shui/popup-hide!)))
               (f chosen selected?)))]
    (select/select (assoc opts
                          :selected-choices selected-choices
                          :items items'
                          k f'))))

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

(rum/defc ^:large-vars/cleanup-todo select-node < rum/static
  [property
   {:keys [block multiple-choices? dropdown? input-opts on-input] :as opts}
   result]
  (let [[refresh-count set-refresh-count!] (rum/use-state 0)
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
        parent-property? (= (:db/ident property) :logseq.property/parent)
        children-pages (when parent-property? (model/get-structured-children repo (:db/id block)))
        nodes
        (->>
         (cond
           parent-property?
           (let [;; Disallows cyclic hierarchies
                 exclude-ids (-> (set (map (fn [id] (:block/uuid (db/entity id))) children-pages))
                                 (conj (:block/uuid block))) ; break cycle
                 options (if (ldb/class? block)
                           (model/get-all-classes repo)
                           (when (ldb/internal-page? block)
                             (cond->>
                              (->> (model/get-all-pages repo)
                                   (filter ldb/internal-page?)
                                   (remove ldb/built-in?)))))
                 excluded-options (remove (fn [e] (contains? exclude-ids (:block/uuid e))) options)]
             excluded-options)

           (seq classes)
           (->>
            (mapcat
             (fn [class]
               (if (= :logseq.class/Root (:db/ident class))
                 (model/get-all-classes repo {:except-root-class? true})
                 (model/get-class-objects repo (:db/id class))))
             classes)
            distinct)

           :else
           (let [property-type (get-in property [:block/schema :type])]
             (if (empty? result)
               (let [v (get block (:db/ident property))]
                 (remove #(= :logseq.property/empty-placeholder (:db/ident %))
                         (if (every? de/entity? v) v [v])))
               (remove (fn [node]
                         (or (= (:db/id block) (:db/id node))
                             ;; A page's alias can't be itself
                             (and alias? (= (or (:db/id (:block/page block))
                                                (:db/id block))
                                            (:db/id node)))
                             (when (and property-type (not= property-type :node))
                               (if (= property-type :page)
                                 (not (db/page? node))
                                 (not (contains? (ldb/get-entity-types node) property-type))))))
                       result)))))

        options (map (fn [node]
                       (let [id (or (:value node) (:db/id node))
                             [header label] (if (integer? id)
                                              (let [node-title (if (seq (:property/schema.classes property))
                                                                 (:block/title node)
                                                                 (block-handler/block-unique-title node))
                                                    title (subs node-title 0 256)
                                                    node (or (db/entity id) node)
                                                    icon (get-node-icon node)
                                                    header (when-not (db/page? node)
                                                             (when-let [breadcrumb (state/get-component :block/breadcrumb)]
                                                               [:div.text-xs.opacity-70
                                                                (breadcrumb {:search? true} (state/get-current-repo) (:block/uuid block) {})]))
                                                    label [:div.flex.flex-row.items-center.gap-1
                                                           (when-not (:property/schema.classes property)
                                                             (ui/icon icon {:size 14}))
                                                           [:div title]]]
                                                [header label])
                                              [nil (or (:label node) (:block/title node))])]
                         (assoc node
                                :header header
                                :label-value (:block/title node)
                                :label label
                                :value id
                                :disabled? (and tags? (contains?
                                                       (set/union #{:logseq.class/Journal :logseq.class/Whiteboard} ldb/internal-tags)
                                                       (:db/ident node)))))) nodes)
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
                 :show-new-when-not-exact-match? (if (or (and parent-property? (contains? (set children-pages) (:db/id block)))
                                                         ;; Don't allow creating private tags
                                                         (seq (set/intersection (set (map :db/ident classes))
                                                                                ldb/private-tags)))
                                                   false
                                                   true)
                 :extract-chosen-fn :value
                 :extract-fn (fn [x] (or (:label-value x) (:label x)))
                 :input-opts input-opts
                 :on-input (debounce on-input 50)
                 :on-chosen (fn [chosen selected?]
                              (p/let [[id new?] (if (integer? chosen)
                                                  [chosen false]
                                                  (when-not (string/blank? (string/trim chosen))
                                                    (p/let [result (<create-page-if-not-exists! block property classes' chosen)]
                                                      [result true])))
                                      _ (when (and (integer? id) (not (ldb/page? (db/entity id))))
                                          (db-async/<get-block repo id))]
                                (p/do!
                                 (if id
                                   (add-or-remove-property-value block property id selected? {})
                                   (log/error :msg "No :db/id found or created for chosen" :chosen chosen))
                                 (when new? (set-refresh-count! (inc refresh-count))))))})

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
  (let [[result set-result!] (rum/use-state nil)
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
                                   (set-result! nil)
                                   (p/let [result (search/block-search (state/get-current-repo) v {:enable-snippet? false
                                                                                                   :built-in? false})]
                                     (set-result! result)))))
        repo (state/get-current-repo)
        classes (:property/schema.classes property)
        non-root-classes (remove (fn [c] (= (:db/ident c) :logseq.class/Root)) classes)
        parent-property? (= (:db/ident property) :logseq.property/parent)]
    (when (and (not parent-property?) (seq non-root-classes))
      ;; effect runs once
      (rum/use-effect!
       (fn []
         (p/let [result (p/all (map (fn [class] (db-async/<get-tag-objects repo (:db/id class))) non-root-classes))
                 result' (distinct (apply concat result))]
           (set-result! result')))
       []))
    (select-node property opts' result)))

(rum/defcs select < rum/reactive db-mixins/query
  {:init (fn [state]
           (let [*values (atom :loading)
                 refresh-result-f (fn []
                                    (let [[block property _] (:rum/args state)]
                                      (p/let [property-ident (if (= :logseq.property/default-value (:db/ident property))
                                                               (:db/ident block)
                                                               (:db/ident property))
                                              result (db-async/<get-block-property-values (state/get-current-repo)
                                                                                          property-ident)]
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
        values (rum/react *values)
        block (db/sub-block (:db/id block))]
    (when-not (= :loading values)
      (let [schema (:block/schema property)
            type (:type schema)
            closed-values? (seq (:property/closed-values property))
            ref-type? (db-property-type/all-ref-property-types type)
            items (if closed-values?
                    (let [date? (and
                                 (= (:db/ident property) :logseq.task/recur-unit)
                                 (= :date (get-in (:property opts) [:block/schema :type])))
                          values (cond->> (:property/closed-values property)
                                   date?
                                   (remove (fn [b] (contains? #{:logseq.task/recur-unit.minute :logseq.task/recur-unit.hour} (:db/ident b)))))]
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
                                                        {:exit-edit? exit-edit?
                                                         :refresh-result-f refresh-result-f})))
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
                      value-block)
        default-value (:logseq.property/default-value property)
        default-value? (and
                        (:db/id default-value)
                        (= (:db/id value-block) (:db/id default-value))
                        (not= (:db/ident property) :logseq.property/default-value))]
    (if (seq value-block)
      [:div.property-block-container.content.w-full
       (let [config {:id (str (if multiple-values?
                                (:block/uuid block)
                                (:block/uuid value-block)))
                     :container-id container-id
                     :editor-box (state/get-component :editor/box)
                     :property-block? true
                     :on-block-content-pointer-down (when default-value?
                                                      (fn [_e]
                                                        (<create-new-block! block property (or (:block/title default-value) ""))))}]
         (if (set? value-block)
           (blocks-container config (ldb/sort-by-order value-block))
           (rum/with-key
             (block-container (assoc config :property-default-value? default-value?) value-block)
             (str (:db/id property) "-" (:block/uuid value-block)))))]
      [:div
       {:tabIndex 0
        :on-click (fn [] (<create-new-block! block property ""))}
       (property-empty-btn-value property)])))

(rum/defcs property-block-value < rum/reactive db-mixins/query
  {:init (fn [state]
           (let [block (first (:rum/args state))]
             (when-let [block-id (or (:db/id block) (:block/uuid block))]
               (db-async/<get-block (state/get-current-repo) block-id :children? true)))
           state)}
  [state value block property page-cp]
  (when value
    (if (state/sub-async-query-loading (:block/uuid value))
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
              (ldb/page? v-block)
              (rum/with-key
                (page-cp {:disable-preview? true
                          :tag? class?} v-block)
                (:db/id v-block))
              :else
              invalid-warning)))
        (property-empty-btn-value property)))))

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
              (icon-component/icon icon {:color? true})
              [:div.flex.flex-row.items-center.gap-2.h-6
               (icon-component/icon icon {:color? true})
               (when value'
                 [:span value'])])

            property-block?
            value'

            (= type :number)
            [:span.number (str value')]

            :else
            (inline-text {} :markdown (str value'))))))))

(rum/defc select-item
  [property type value {:keys [page-cp inline-text other-position? property-position _icon?] :as opts}]
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

       (or (ldb/page? value)
           (and (seq (:block/tags value))
                ;; FIXME: page-cp should be renamed to node-cp and
                ;; support this case and maybe other complex cases.
                (not (string/includes? (:block/title value) "[["))))
       (when value
         (rum/with-key
           (page-cp {:disable-preview? true
                     :tag? tag?
                     :property-position property-position
                     :meta-click? other-position?} value)
           (:db/id value)))

       (contains? #{:node :class :property :page} type)
       (when-let [reference (state/get-component :block/reference)]
         (reference {} (:block/uuid value)))

       (de/entity? value)
       (when-some [content (str (db-property/property-value-content value))]
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
                             (:entity :number :default :url)
                             (select block property select-opts' opts)

                             (:node :class :property :page :date)
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
       (if (:other-position? opts) :div.jtrigger :div.jtrigger.flex.flex-1.w-full)
       {:ref *el
        :id trigger-id
        :tabIndex 0
        :on-click show!}
       (if (string/blank? value)
         (property-empty-text-value property opts)
         (value-f))))))

(defn- property-value-inner
  [block property value {:keys [inline-text page-cp
                                dom-id row?]}]
  (let [schema (:block/schema property)
        multiple-values? (db-property/many? property)
        class (str (when-not row? "flex flex-1 ")
                   (when multiple-values? "property-value-content"))
        type (:type schema)
        text-ref-type? (db-property-type/text-ref-property-types type)]
    [:div.cursor-text
     {:id (or dom-id (random-uuid))
      :tabIndex 0
      :class (str class " " (when-not text-ref-type? "jtrigger"))
      :style {:min-height 24}
      :on-click (fn []
                  (when (and text-ref-type? (nil? value))
                    (<create-new-block! block property "")))}
     (cond
       (and (= :logseq.property/default-value (:db/ident property)) (nil? (:block/title value)))
       [:div.jtrigger.cursor-pointer.text-sm.px-2 "Set default value"]

       (and text-ref-type? (nil? (:block/title value)))
       [:div.jtrigger (property-empty-btn-value property)]

       text-ref-type?
       (property-block-value value block property page-cp)

       :else
       (inline-text {} :markdown (macro-util/expand-value-if-macro (str value) (state/get-macros))))]))

(rum/defcs property-scalar-value < rum/static rum/reactive
  [state block property value* {:keys [container-id editing? on-chosen]
                                :as opts}]
  (let [property (model/sub-block (:db/id property))
        schema (:block/schema property)
        type (get schema :type :default)
        editing? (or editing?
                     (and (state/sub-editing? [container-id (:block/uuid block)])
                          (= (:db/id property) (:db/id (:property (state/get-editor-action-data))))))
        select-type?' (select-type? block property type)
        closed-values? (seq (:property/closed-values property))
        select-opts {:on-chosen on-chosen}
        value (if (and (de/entity? value*) (= (:db/ident value*) :logseq.property/empty-placeholder))
                nil
                value*)]
    (if (= :logseq.property/icon (:db/ident property))
      (icon-row block editing?)
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
                                 (fn [] (select-item property type value opts))
                                 select-opts
                                 (assoc opts :editing? editing?))))
        (case type
          (:date :datetime)
          (property-value-date-picker block property value (merge opts {:editing? editing?}))

          :checkbox
          (let [add-property! (fn []
                                (let [value' (boolean (not value))]
                                  (<add-property! block (:db/ident property) value' opts)
                                  (when-let [on-checked-change (:on-checked-change opts)]
                                    (on-checked-change value'))))]
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
        items (cond->> (if (de/entity? v) #{v} v)
                (= (:db/ident property) :block/tags)
                (remove (fn [v] (contains? ldb/hidden-tags (:db/ident v)))))]
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
                         (if (contains? #{:node :page :class :property} type)
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
          :class "flex flex-1 flex-row items-center flex-wrap gap-x-2 gap-y-2"}
         (let [not-empty-value? (not= (map :db/ident items) [:logseq.property/empty-placeholder])]
           (if (and (seq items) not-empty-value?)
             (concat
              (->> (for [item items]
                     (rum/with-key (select-item property type item opts) (or (:block/uuid item) (str item))))
                   (interpose [:span.opacity-50.-ml-2 ","]))
              (when date?
                [(property-value-date-picker block property nil {:toggle-fn toggle-fn})]))
             (if date?
               (property-value-date-picker block property nil {:toggle-fn toggle-fn})
               (property-empty-text-value property opts))))]))))

(rum/defc multiple-values < rum/reactive db-mixins/query
  [block property opts schema]
  (let [block (db/sub-block (:db/id block))
        value (get block (:db/ident property))
        value' (if (coll? value) value
                   (when (some? value) #{value}))]
    (multiple-values-inner block property value' opts schema)))

(rum/defcs property-value < rum/reactive db-mixins/query
  [state block property {:keys [show-tooltip?]
                         :as opts}]
  (ui/catch-error
   (ui/block-error "Something wrong" {})
   (let [block (db/sub-block (:db/id block))
         block-cp (state/get-component :block/blocks-container)
         properties-cp (state/get-component :block/properties-cp)
         opts (merge opts
                     {:page-cp (state/get-component :block/page-cp)
                      :inline-text (state/get-component :block/inline-text)
                      :editor-box (state/get-component :editor/box)
                      :block-cp block-cp
                      :properties-cp :properties-cp})
         dom-id (str "ls-property-" (:db/id block) "-" (:db/id property))
         editor-id (str dom-id "-editor")
         schema (:block/schema property)
         type (some-> schema (get :type :default))
         multiple-values? (db-property/many? property)
         v (get block (:db/ident property))
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
         property-ident (:db/ident property)
         value-cp [:div.property-value-inner
                   {:data-type type
                    :class (str (when empty-value? "empty-value")
                                (when-not (:other-position? opts) " w-full"))}
                   (cond
                     (= property-ident :logseq.property.class/properties)
                     (properties-cp {} block {:selected? false
                                              :class-schema? true})

                     (and multiple-values? (contains? #{:default :url} type) (not closed-values?))
                     (property-normal-block-value block property v)

                     multiple-values?
                     (multiple-values block property opts schema)

                     :else
                     (let [parent? (= property-ident :logseq.property/parent)
                           value-cp (property-scalar-value block property v
                                                           (merge
                                                            opts
                                                            {:editor-id editor-id
                                                             :dom-id dom-id}))
                           page-ancestors (when parent?
                                            (let [ancestor-pages (loop [parents [block]]
                                                                   (if-let [parent (:logseq.property/parent (last parents))]
                                                                     (when-not (contains? (set parents) parent)
                                                                       (recur (conj parents parent)))
                                                                     parents))]
                                              (->> (reverse ancestor-pages)
                                                   (remove (fn [e] (= (:db/id block) (:db/id e))))
                                                   butlast)))]
                       (if (seq page-ancestors)
                         [:div.flex.flex-1.items-center.gap-1
                          (interpose [:span.opacity-50.text-sm " > "]
                                     (concat
                                      (map (fn [{title :block/title :as ancestor}]
                                             [:a.whitespace-nowrap {:on-click #(route-handler/redirect-to-page! (:block/uuid ancestor))} title])
                                           page-ancestors)
                                      [value-cp]))]
                         value-cp)))]]
     (if show-tooltip?
       (shui/tooltip-provider
        (shui/tooltip
         {:delayDuration 1200}
         (shui/tooltip-trigger
          {:onFocusCapture #(util/stop-propagation %)} value-cp)
         (shui/tooltip-content
          (str "Change " (:block/title property)))))
       value-cp))))
