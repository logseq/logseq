(ns frontend.components.property
  "Block properties management."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.components.dnd :as dnd]
            [frontend.components.icon :as icon-component]
            [frontend.components.property.config :as property-config]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.route :as route-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.api.block :as api-block]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.property :as outliner-property]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn- <add-property-from-dropdown
  "Adds an existing or new property from dropdown. Used from a block or page context."
  [entity id-or-name* schema {:keys [class-schema? block-uuid]}]
  (p/let [repo (state/get-current-repo)
          id-or-name (or block-uuid id-or-name*)
          ;; Both conditions necessary so that a class can add its own page properties
          add-class-property? (and (ldb/class? entity) class-schema?)
          property (db-async/<get-block repo id-or-name {:children? false})
          property? (ldb/property? property)
          property-title (or (:block/title property) id-or-name)]
    ;; existing property selected or entered
    (if property?
      (do
        (when (and (not (ldb/public-built-in-property? property))
                   (ldb/built-in? property))
          (notification/show! (t :property/private-built-in-not-usable) :error))
        property)
      ;; new property entered or converting page to property
      (if (db-property/valid-property-name? property-title)
        (p/let [opts (cond-> {:property-name property-title}
                       (and (not property?) (ldb/internal-page? property))
                       (assoc :properties {:db/id (:db/id property)}))
                result (db-property-handler/upsert-property! nil schema opts)
                property (db/entity (:db/id result))
                _ (when add-class-property?
                    (pv/<add-property! entity (:db/ident property) "" {:class-schema? class-schema? :exit-edit? false}))]
          property)
        (notification/show! (t :property.validation/invalid-name) :error)))))

(defn- enable-block-properties-renderers?
  [{:keys [sidebar? sidebar-properties?]} class?]
  (and config/lsp-enabled?
       (not class?)
       (not sidebar?)
       (not sidebar-properties?)))

(defn- prefer-exact-property-title-match
  [results input]
  (if (string/blank? input)
    results
    (let [exact-title? (fn [item]
                         (= (some-> (:block/title item) string/lower-case)
                            (string/lower-case input)))]
      (sort-by (fn [item] (if (exact-title? item) 0 1)) results))))

;; TODO: This component should be cleaned up as it's only used for new properties and used to be used for existing properties
(hsx/defc property-type-select
  [property {:keys [*property *property-name *property-schema built-in? disabled?
                    show-type-change-hints? block *show-new-property-config?
                    *show-class-select?
                    default-open? class-schema?]
             :as opts}]
  (shortcut/use-disable-all-shortcuts!)
  (let [property-name (or (and *property-name @*property-name) (db-property/built-in-display-title property t))
        property-schema (or (and *property-schema @*property-schema)
                            (select-keys property [:logseq.property/type]))
        schema-types (->> (concat db-property-type/user-built-in-property-types
                                  (when built-in?
                                    db-property-type/internal-built-in-property-types))
                          (map (fn [type]
                                 {:label (property-config/property-type-label type)
                                  :value type})))]
    [:div {:class "flex items-center"}
     (shui/select
       (cond->
         {:default-open (boolean default-open?)
          :disabled disabled?
          :on-value-change
          (fn [v]
            (let [type (keyword (string/lower-case v))
                  update-schema-fn #(assoc % :logseq.property/type type)]
              (when *property-schema
                (swap! *property-schema update-schema-fn))
              (let [schema (or (and *property-schema @*property-schema)
                               (update-schema-fn property-schema))]
                (when *show-new-property-config?
                  (reset! *show-new-property-config? :adding-property))
                (p/let [property' (when block (<add-property-from-dropdown block property-name schema opts))
                        property (or property' property)
                        add-class-property? (and (ldb/class? block) class-schema?)]
                  (when *property (reset! *property property))
                  (p/do!
                   (when *show-new-property-config?
                     (reset! *show-new-property-config? false))
                   (when (= (:logseq.property/type schema) :node) (reset! *show-class-select? true))
                   (db-property-handler/upsert-property!
                    (:db/ident property)
                    schema
                    {})

                   (cond
                     (and *show-class-select? @*show-class-select?)
                     nil
                     add-class-property?
                     (shui/popup-hide!)
                     (pv/batch-operation?)
                     nil
                     (and block (= type :checkbox))
                     (p/do!
                      (ui/hide-popups-until-preview-popup!)
                      (let [value (if-some [value (:logseq.property/scalar-default-value property)]
                                    value
                                    false)]
                        (pv/<add-property! block (:db/ident property) value {:exit-edit? true})))
                     (and block
                          (contains? #{:default :url} type)
                          (not (seq (:property/closed-values property))))
                     (pv/<create-new-block! block property "" {:batch-op? true})))))))}

         ;; only set when in property configure modal
         (and *property-name (:logseq.property/type property-schema))
         (assoc :default-value (name (:logseq.property/type property-schema))))
       (shui/select-trigger
        {:class "!px-2 !py-0 !h-8"}
        (shui/select-value
         {:placeholder (t :property/select-type-placeholder)}))
       (shui/select-content
        (shui/select-group
         (for [{:keys [label value disabled]} schema-types]
           (shui/select-item {:key label :value value :disabled disabled
                              :on-key-down (fn [e]
                                             (when (= "Enter" (.-key e))
                                               (util/stop-propagation e)))} label)))))
     (when show-type-change-hints?
       (ui/tooltip (svg/info)
                   [:span (t :property/type-change-warning)]))]))

(hsx/defc property-select
  [select-opts]
  (let [[properties set-properties!] (hooks/use-state nil)
        [q set-q!] (hooks/use-state "")]
    (hooks/use-effect!
     (fn []
       (p/let [repo (state/get-current-repo)
               properties (if (:class-schema? select-opts)
                            (property-handler/get-class-property-choices)
                            (db-model/get-all-properties repo {:remove-ui-non-suitable-properties? true
                                                               :block (:block select-opts)}))]
         (set-properties! properties)))
     [])
    (hooks/use-effect!
     (fn []
       (p/let [repo (state/get-current-repo)
               block (when-not (string/blank? q)
                       (db-async/<get-block repo q {:children? false}))
               internal-page-exists? (ldb/internal-page? block)]
         (when internal-page-exists?
           (set-properties!
            (cons (assoc block :convert-page-to-property? true) properties)))))
     [q])
    (let [transform-fn (:transform-fn select-opts)
          items (->>
                 (map (fn [x]
                        (let [convert? (:convert-page-to-property? x)]
                          {:label (if convert?
                                    (t :property/convert-page-to-property (:block/title x))
                                    (let [property-title (or (db-property/built-in-display-title x t)
                                                             (:block/title x))
                                          ident (:db/ident x)
                                          ns' (some-> ident (namespace))
                                          plugin? (some-> ident (api-block/plugin-property-key?))
                                          _plugin-name (and plugin? (second (re-find #"^plugin\.property\.([^.]+)" ns')))]
                                      [:span.flex.gap-1.items-center
                                       {:title (str ident)}
                                       (if plugin?
                                         [:span.pt-1 (shui/tabler-icon "puzzle" {:size 15 :class "opacity-40"})]
                                         [:span.pt-1 (shui/tabler-icon "letter-t" {:size 15 :class "opacity-40"})])
                                       [:strong.font-normal property-title
                                        (when plugin? [:span.ml-1.text-xs.opacity-40 (str "" _plugin-name)])]]))
                           :value (or (:block/uuid x) (:db/ident x))
                           :db/ident (:db/ident x)
                           :block/title (or (db-property/built-in-display-title x t)
                                            (:block/title x))
                           :convert-page-to-property? convert?})) properties)
                 (util/distinct-by-last-wins (fn [item] (or (:value item) (:db/ident item)))))
          property-transform-fn (fn [results input]
                                  (let [results (prefer-exact-property-title-match results input)
                                        tags-item (when (= "tags" (string/lower-case (or input "")))
                                                    (some #(when (= :block/tags (:db/ident %)) %) items))
                                        results (if tags-item
                                                  (cons tags-item (remove #(= :block/tags (:db/ident %)) results))
                                                  results)]
                                    (cond-> results
                                      (fn? transform-fn)
                                      (transform-fn input))))]
      [:div.ls-property-add.flex.flex-row.items-center.property-key
       {:data-keep-selection true}
       [:div.ls-property-key
        (select/select (merge
                        {:items items
                         :grouped? true
                         :extract-fn :block/title
                         :dropdown? false
                         :close-modal? false
                         :new-case-sensitive? true
                         :show-new-when-not-exact-match? true
                         ;; :exact-match-exclude-items (fn [s] (contains? excluded-properties s))
                         :input-default-placeholder (t :property/add-or-change)
                         :on-input set-q!
                         :choose-first-on-enter? true
                         :transform-fn property-transform-fn}
                        select-opts))]])))

(hsx/defc property-icon
  [property property-type]
  (let [type (or (:logseq.property/type property) property-type :default)
        ident (:db/ident property)
        icon (cond
               (= ident :block/tags)
               "hash"
               (string/starts-with? (str ident) ":plugin.")
               "puzzle"
               :else
               (case type
                 :number "number"
                 :date "calendar"
                 :daterange "calendar-range"
                 :datetime "calendar"
                 :checkbox "checkbox"
                 :url "link"
                 :property "letter-p"
                 :page "page"
                 :node "point-filled"
                 :asset "letter-a"
                 nil))]
    (if icon
      (ui/icon icon {:class "opacity-50"
                     :size 15})
      [:span.bullet-container
       [:span.bullet]])))

(defn- property-input-on-chosen
  [block *property *property-key *show-new-property-config? {:keys [class-schema? remove-property?]}]
  (fn [{:keys [value label convert-page-to-property?]}]
    (let [property (cond
                     (uuid? value) (db/entity [:block/uuid value])
                     (keyword? value) (db/entity value))
          _ (reset! *property-key (if property
                                    (if convert-page-to-property? (:block/title property) label)
                                    value))
          batch? (pv/batch-operation?)]
      (if (and property remove-property?)
        (let [block-ids (map :block/uuid (pv/get-operating-blocks block))]
          (property-handler/batch-remove-block-property! block-ids (:db/ident property))
          (shui/popup-hide!))
        (do
          (when (and *show-new-property-config? (not (ldb/property? property)))
            (reset! *show-new-property-config? true))
          (reset! *property property)
          (when-not convert-page-to-property?
            (let [property' (some-> (:db/id property) db/entity)]
              (when (and property' (ldb/property? property'))
                (let [add-class-property? (and (ldb/class? block) class-schema?)
                      type (:logseq.property/type property')
                      default-or-url? (and (contains? #{:default :url} type)
                                           (not (seq (:property/closed-values property'))))]
                  (cond
                    add-class-property?
                    (p/do!
                     (pv/<add-property! block (:db/ident property') "" {:class-schema? class-schema?})
                     (shui/popup-hide!))

                    (and batch? (or (= :checkbox type) (and batch? default-or-url?)))
                    nil

                    (= :checkbox type)
                    (p/do!
                     (ui/hide-popups-until-preview-popup!)
                     (shui/popup-hide!)
                     (let [value (if-some [value (:logseq.property/scalar-default-value property')]
                                   value
                                   false)]
                       (pv/<add-property! block (:db/ident property') value {:exit-edit? true})))

                    default-or-url?
                    (pv/<create-new-block! block property' "" {:batch-op? true})

                    (or (not= :default type)
                        (and (= :default type) (seq (:property/closed-values property'))))
                    (reset! *show-new-property-config? false)))))))))))

(defn- property-description-title
  [property]
  (let [property' (or (some-> (:db/id property) db/entity) property)]
    (:block/title (:logseq.property/description property'))))

(hsx/defc property-key-title
  [block property class-schema?]
  (let [title (db-property/built-in-display-title property t)
        description (property-description-title property)
        key-title (shui/trigger-as
                   :a
                   {:tabIndex 0
                    :class "property-k flex select-none jtrigger w-full"
                    :on-pointer-down (fn [^js e]
                                       (when (util/meta-key? e)
                                         (route-handler/redirect-to-page! (:block/uuid property))
                                         (.preventDefault e)))
                    :on-click (fn [^js/MouseEvent e]
                                (when-not (util/meta-key? e)
                                  (shui/popup-show! (.-target e)
                                                    (fn []
                                                      (property-config/property-dropdown property block {:debug? (.-altKey e)
                                                                                                         :class-schema? class-schema?}))
                                                    {:content-props
                                                     {:class "ls-property-dropdown as-root"
                                                      :onEscapeKeyDown (fn [e]
                                                                         (util/stop e)
                                                                         (shui/popup-hide!)
                                                                         (when-let [input (state/get-input)]
                                                                           (.focus input)))}
                                                     :align "start"
                                                     :dropdown-menu? true
                                                     :as-dropdown? true})))}

                   title)]
    (if (string/blank? description)
      key-title
      (ui/tooltip
       key-title
       [:div.max-w-96.whitespace-pre-wrap description]))))

(hsx/defc property-key-cp
  [block property {:keys [other-position? class-schema?]}]
  (let [icon (:logseq.property/icon property)]
    [:div.property-key-inner.jtrigger-view
     ;; icon picker
     (when-not other-position?
       (let [content-fn (fn [{:keys [id]}]
                          (icon-component/icon-search
                           {:on-chosen
                            (fn [_e icon]
                              (if icon
                                (db-property-handler/set-block-property! (:db/id property)
                                                                         :logseq.property/icon icon)
                                (db-property-handler/remove-block-property! (:db/id property)
                                                                            :logseq.property/icon))
                              (shui/popup-hide! id))
                            :icon-value icon
                            :del-btn? (boolean icon)}))]

         [:div.property-icon
          (shui/trigger-as
           :button.property-m
           (-> (when-not config/publishing?
                 {:on-click (fn [^js e]
                              (shui/popup-show! (.-target e) content-fn
                                                {:as-dropdown? true :auto-focus? true
                                                 :content-props {:onEscapeKeyDown #(.preventDefault %)}}))})
               (assoc :class "flex items-center"))
           (if icon
             (icon-component/icon icon {:size 15 :color? true})
             (property-icon property nil)))]))

     (if config/publishing?
       [:a.property-k.flex.select-none.jtrigger
        {:on-click #(route-handler/redirect-to-page! (:block/uuid property))}
        (db-property/built-in-display-title property t)]
       (property-key-title block property class-schema?))]))

(hsx/defc bidirectional-values-cp
  [entities]
  (let [blocks-container (state/get-component :block/blocks-container)
        container-id (state/use-container-id)
        config {:id (str "bidirectional-" container-id)
                :container-id container-id
                :editor-box (state/get-component :editor/box)
                :default-collapsed? true
                :bidirectional? true
                :page-title? false
                :ref? true
                :hide-block-tags? true
                :hide-block-icon? true}]
    (if (and blocks-container (seq entities))
      [:div.ls-bidirectional-block-container.w-full
       (blocks-container config entities)]
      [:span.opacity-60 (t :view.filter/empty)])))

(defn- icon-id
  [icon]
  (cond
    (string? icon) icon
    (keyword? icon) (name icon)
    (map? icon) (or (:id icon) (get icon "id"))))

(defn- bidirectional-tab-icon
  [class]
  (let [icon (or (:logseq.property/icon class)
                 (some :logseq.property/icon (sort-by :db/id (:block/tags class))))]
    (when (and icon (not= "hash" (icon-id icon)))
      [:span.inline-flex.items-center.shrink-0
       (icon-component/icon icon {:size 16 :color? true})])))

(hsx/defc bidirectional-properties-section
  [bidirectional-properties]
  (when (seq bidirectional-properties)
    (let [normalized-items (map-indexed
                            (fn [idx {:keys [class title entities]}]
                              (let [value (str (or (:db/id class) (str "idx-" idx)))]
                                {:value value
                                 :class class
                                 :title title
                                 :entities entities}))
                            bidirectional-properties)
          default-value (:value (first normalized-items))]
      [:div.w-full.ls-bidirectional-properties.mt-8
        (shui/tabs
        {:defaultValue default-value
         :class "w-full"}
        (shui/tabs-list
         {:variant :line
          :class "h-8 gap-3"}
         (for [{:keys [value class title]} normalized-items]
           (shui/tabs-trigger
            {:key (str "bidirectional-tab-" value)
             :value value
             :class "px-0 py-1 text-base text-foreground"}
            [:span.inline-flex.items-center.gap-1.5
             (bidirectional-tab-icon class)
             [:span title]])))
        (for [{:keys [value entities]} normalized-items]
          (shui/tabs-content
           {:key (str "bidirectional-tab-content-" value)
            :value value}
           (bidirectional-values-cp entities))))])))

(hsx/defc ^:large-vars/cleanup-todo property-input
  [block *property-key {:keys [class-schema?]
                        :as opts}]
  (let [*property (hooks/use-memo #(or (:*property opts) (atom nil)) [(:*property opts)])
        *show-new-property-config? (hooks/use-memo #(atom false) [])
        *show-class-select? (hooks/use-memo #(atom false) [])
        *property-schema (hooks/use-memo #(atom {}) [])
        latest-args-ref (hooks/use-ref nil)
        [property] (hooks/use-atom *property)
        [property-key] (hooks/use-atom *property-key)
        [show-new-property-config?] (hooks/use-atom *show-new-property-config?)
        [show-class-select?] (hooks/use-atom *show-class-select?)
        [property-schema] (hooks/use-atom *property-schema)
        batch? (pv/batch-operation?)
        hide-property-key? (or (pv/direct-value-picker-type? (:logseq.property/type property))
                               (= (:db/ident property) :logseq.property/icon)
                               (pv/select-type? block property)
                               (and
                                batch?
                                (contains? #{:default :url} (:logseq.property/type property))
                                (not (seq (:property/closed-values property))))
                               (and property (ldb/class? property)))]
    (hooks/set-ref! latest-args-ref [block *property-key opts])
    (hooks/use-effect!
     (fn []
       (state/set-editor-action! :property-input)
       (let [on-key-down (fn [e]
                           (when (= 27 (.-keyCode e))
                             (shui/popup-hide!)
                             (shui/popup-hide!)
                             (when-let [^js input (state/get-input)]
                               (.focus input))))]
         (.addEventListener js/window "keydown" on-key-down)
         #(do
            (.removeEventListener js/window "keydown" on-key-down)
            (let [[_block *property-key {:keys [original-block edit-original-block]}] (hooks/deref latest-args-ref)
                  editing-default-property? (and original-block (state/get-edit-block)
                                                 (not= (:db/id original-block) (:db/id (state/get-edit-block))))]
              (when *property-key (reset! *property-key nil))
              (when (and original-block edit-original-block)
                (edit-original-block {:editing-default-property? editing-default-property?})))
            (state/set-editor-action! nil))))
     [])
    [:div.ls-property-input.flex.flex-1.flex-row.items-center.flex-wrap.gap-1
     (if property-key
       [:div.ls-property-add.gap-1.flex.flex-1.flex-row.items-center
        (when-not hide-property-key?
          [:div.flex.flex-row.items-center.property-key.gap-1
           (when-not (:db/id property) (property-icon property (:logseq.property/type property-schema)))
           (if (:db/id property)                              ; property exists already
             (property-key-cp block property opts)
             [:div property-key])])
        [:div.flex.flex-row {:on-pointer-down (fn [e] (util/stop-propagation e))}
         (when (not= show-new-property-config? :adding-property)
           (cond
             (or (nil? property) show-new-property-config?)
             (property-type-select property (merge opts
                                                   {:*property *property
                                                    :*property-name *property-key
                                                    :*property-schema *property-schema
                                                    :default-open? true
                                                    :block block
                                                    :*show-new-property-config? *show-new-property-config?
                                                    :*show-class-select? *show-class-select?}))

             (and property show-class-select?)
             (property-config/class-select property (assoc opts
                                                           :on-hide #(reset! *show-class-select? false)
                                                           :multiple-choices? false
                                                           :default-open? true
                                                           :no-class? true))

             :else
             (when (and property (not class-schema?))
               (pv/property-value block property (assoc opts :editing? true)))))]]

       (let [on-chosen (property-input-on-chosen block *property *property-key *show-new-property-config? opts)
             input-opts {:on-key-down
                         (fn [e]
                           ;; `Backspace` to close property popup and back to editing the current block
                           (when (and (= (util/ekey e) "Backspace")
                                      (= "" (.-value (.-target e))))
                             (util/stop e)
                             (shui/popup-hide!)))}]
         (property-select (merge (:select-opts opts) {:on-chosen on-chosen
                                                      :input-opts input-opts
                                                      :block block
                                                      :class-schema? class-schema?}))))]))

(hsx/defc new-property
  [block opts]
  (when-not config/publishing?
    (let [icon-only? (:icon-only? opts)
          bottom-property-add-button? (= :block-below (:property-position opts))
          tab-index (:tab-index opts)
          bottom-row-nav? (:bottom-row-nav? opts)
          add-new-property! (fn [e]
                              (state/pub-event! [:editor/new-property (merge opts {:block block
                                                                                   :target (.-target e)})]))
          button
          (shui/button
             {:variant :secondary
              :size :sm
             :class (str "jtrigger flex"
                         (when bottom-property-add-button? " bottom-property-add-btn"))
             :tab-index (or tab-index 0)
             :data-bottom-row-nav (when bottom-row-nav? true)
             :aria-label (t :property/add-new)
             :on-click add-new-property!
             :on-key-press (fn [e]
                             (when (contains? #{"Enter" " "} (util/ekey e))
                               (.preventDefault e)
                               (add-new-property! e)))}
            (ui/icon "plus" {:size 16 :class "bottom-property-action-icon"})
            (when-not icon-only?
              (t :property/add-new)))]
      [:div.ls-new-property
       (if icon-only?
         (ui/tooltip button [:span (t :property/add-new)])
         button)])))

(defn- resolve-linked-block-if-exists
  "Properties will be updated for the linked page instead of the refed block.
  For example, the block below has a reference to the page \"How to solve it\",
  we'd like the properties of the class \"book\" (e.g. Authors, Published year)
  to be assigned for the page `How to solve it` instead of the referenced block.

  Block:
  - [[How to solve it]] #book
  "
  [block]
  (if-let [linked-block (:block/link block)]
    (db/sub-block (:db/id linked-block))
    (db/sub-block (:db/id block))))

(defn- show-property-panel-edit-button?
  [property opts]
  (and (contains? #{:date :datetime} (:logseq.property/type property))
       (= :block-below (:property-position opts))))

(defn- empty-panel-property-value?
  [value]
  (or (nil? value)
      (and (map? value)
           (= :logseq.property/empty-placeholder (:db/ident value)))
      (and (coll? value)
           (or (empty? value)
               (every? (fn [item]
                         (and (map? item)
                              (= :logseq.property/empty-placeholder (:db/ident item))))
                       value)))))

(defn- show-property-panel-bullet?
  [property value]
  (let [type (get property :logseq.property/type :default)]
    (or (seq (:property/closed-values property))
        (not (contains? #{:default :url} type))
        (empty-panel-property-value? value))))

(hsx/defc property-cp
  [block k v {:keys [sortable-opts] :as opts}]
  (let [property-id (when (keyword? k) (:db/id (db/entity k)))
        property (db/sub-block property-id)]
    (when (and (keyword? k) property)
      (let [type (get property :logseq.property/type :default)
            empty-value? (empty-panel-property-value? v)
            show-panel-bullet? (show-property-panel-bullet? property v)
            property-key-cp' (property-key-cp block property (select-keys opts [:class-schema?]))]
        [:div {:key (str "property-pair-" (:db/id block) "-" (:db/id property))
               :class (util/classnames ["property-pair property-panel-row"
                                        {:property-panel-row-empty empty-value?}])
               :data-property-title (:block/title property)
               :data-property-type (name type)}
         (if (seq sortable-opts)
           (dnd/sortable-item
            (assoc sortable-opts :class "property-key-panel")
            property-key-cp')
           [:div.property-key-panel
            property-key-cp'])

         (let [block' (assoc block (:db/ident property) v)]
           [:div.ls-block.property-value-container.property-value-panel
            (when show-panel-bullet?
              [:div.property-panel-bullet {:aria-hidden true}
               [:span.bullet-container
                [:span.bullet]]])
            [:div.property-value.property-value-panel-inner.flex.flex-1
             (if (:class-schema? opts)
               (pv/property-value property (db/entity :logseq.property/description) opts)
               (pv/property-value block' property (assoc opts :suppress-inline-edit-icon? true)))]
            (when (show-property-panel-edit-button? property opts)
              [:button.property-panel-edit-btn.select-none
               {:type "button"
                :on-click (fn [e]
                            (util/stop e)
                            (when-let [trigger
                                       (some-> (.-currentTarget e)
                                               (.closest ".property-value-panel")
                                               (.querySelector ".jtrigger"))]
                              (.click trigger)
                              (some-> trigger .focus)))}
               (ui/icon "edit" {:size 15})])])]))))

(defn- entity-ref-value?
  [value]
  (and (map? value)
       (or (contains? value :db/id)
           (contains? value :block/uuid))))

(defn- contains-recycled-entity-value?
  [value]
  (cond
    (entity-ref-value? value)
    (ldb/recycled? value)

    (and (coll? value) (not (map? value)))
    (some (fn [item]
            (and (entity-ref-value? item)
                 (ldb/recycled? item)))
          value)

    :else
    false))

(def ^:private class-page-metadata-properties
  [:logseq.property.class/extends
   :logseq.property.class/enable-bidirectional?])

(defn- properties-for-display
  [block]
  (cond-> (:block/properties block)
    (and (ldb/class? block)
         (not (ldb/built-in? block)))
    (merge (zipmap class-page-metadata-properties
                   (map #(get block %) class-page-metadata-properties))
           (when (nil? (:logseq.property.class/enable-bidirectional? block))
             {:logseq.property.class/enable-bidirectional? false}))))

(defn- filter-recycled-entity-values
  [value]
  (let [active-entity-value? (fn [item]
                               (or (not (entity-ref-value? item))
                                   (not (ldb/recycled? item))))]
    (cond
      (and (entity-ref-value? value) (ldb/recycled? value))
      nil

      (set? value)
      (let [value' (set (filter active-entity-value? value))]
        (when (seq value') value'))

      (vector? value)
      (let [value' (vec (filter active-entity-value? value))]
        (when (seq value') value'))

      (and (coll? value) (not (map? value)))
      (let [value' (vec (filter active-entity-value? value))]
        (when (seq value') value'))

      :else
      value)))

(defn- sanitize-property-values-for-display
  [properties]
  (reduce-kv
   (fn [{:keys [properties recycled-only-property-ids] :as result} property-id property-value]
     (let [property-value' (filter-recycled-entity-values property-value)]
       (if (and (nil? property-value')
                (contains-recycled-entity-value? property-value))
         (assoc result
                :properties (assoc properties property-id nil)
                :recycled-only-property-ids (conj recycled-only-property-ids property-id))
         (assoc result :properties (assoc properties property-id property-value')))))
   {:properties {}
    :recycled-only-property-ids #{}}
   properties))

(hsx/defc ordered-properties
  [block properties* sorted-property-entities opts]
  (let [[properties set-properties!] (hooks/use-state properties*)
        [properties-order set-properties-order!] (hooks/use-state (mapv first properties))
        m (zipmap (map first properties*) (map second properties*))
        properties (mapv (fn [k] [k (get m k)]) properties-order)
        choices (map (fn [[k v]]
                       (let [id (subs (str k) 1)
                             opts (assoc opts :sortable-opts {:id id})]
                         {:id id
                          :value k
                          :content (property-cp block k v opts)})) properties)]
    (hooks/use-effect!
     (fn []
       (when (not= properties properties*)
         (set-properties! properties*))

       (when (not= (set (map first properties*))
                   (set (map first properties)))
         (set-properties-order! (mapv first properties*))))
     [properties*])
    (dnd/items choices
               {:sort-by-inner-element? true
                :on-drag-end (fn [properties-order {:keys [active-id over-id direction]}]
                               (set-properties-order! properties-order)
                               (p/let [;; Before reordering properties,
                                       ;; check if the :block/order of these properties is reasonable.
                                       normalize-tx-data (db-property/normalize-sorted-entities-block-order
                                                          sorted-property-entities)
                                       _ (when (seq normalize-tx-data)
                                           (db/transact! (state/get-current-repo) normalize-tx-data))
                                       move-down? (= direction :down)
                                       over (db/entity (keyword over-id))
                                       active (db/entity (keyword active-id))
                                       over-order (:block/order over)
                                       new-order (if move-down?
                                                   (let [next-order (db-order/get-next-order (db/get-db) nil (:db/id over))]
                                                     (db-order/gen-key over-order next-order))
                                                   (let [prev-order (db-order/get-prev-order (db/get-db) nil (:db/id over))]
                                                     (db-order/gen-key prev-order over-order)))]
                                 (db/transact! (state/get-current-repo)
                                   [{:block/uuid (:block/uuid active)
                                     :block/order new-order}
                                    (outliner-core/block-with-updated-at
                                     {:db/id (:db/id block)})]
                                   {:outliner-op :save-block})))})))

(hsx/defc properties-section
  [block properties opts]
  (when (seq properties)
    (let [sorted-prop-entities (db-property/sort-properties (map (comp db/entity first) properties))
          prop-kv-map (reduce (fn [m [p v]] (assoc m p v)) {} properties)
          properties' (keep (fn [ent] (find prop-kv-map (:db/ident ent))) sorted-prop-entities)]
      (ordered-properties block properties' sorted-prop-entities opts))))

(defonce ^:private *show-hidden-properties-block-ids
  (atom #{}))

(defn toggle-hidden-properties-visibility!
  [block-uuid]
  (when block-uuid
    (swap! *show-hidden-properties-block-ids
           (fn [ids]
             (if (contains? ids block-uuid)
               (disj ids block-uuid)
               (conj ids block-uuid))))))

(defn hidden-properties-visible?
  [block-uuid]
  (contains? @*show-hidden-properties-block-ids block-uuid))

(defn- use-hidden-properties-visible
  [block-uuid]
  (let [[visible? set-visible!] (hooks/use-state (hidden-properties-visible? block-uuid))
        watch-key (hooks/use-memo #(str "hidden-properties-visible-" (random-uuid)) [])]
    (hooks/use-effect!
     (fn []
       (set-visible! (hidden-properties-visible? block-uuid))
       (if block-uuid
         (do
           (add-watch *show-hidden-properties-block-ids watch-key
                      (fn [_key _ref old-ids new-ids]
                        (let [old-visible? (contains? old-ids block-uuid)
                              new-visible? (contains? new-ids block-uuid)]
                          (when (not= old-visible? new-visible?)
                            (set-visible! new-visible?)))))
           (fn []
             (remove-watch *show-hidden-properties-block-ids watch-key)))
         (fn [])))
     [block-uuid])
    visible?))

(defn- hidden-properties-toggle-label
  [show-hidden-properties?]
  (if show-hidden-properties?
    (t :property/collapse-hidden-properties)
    (t :property/show-hidden-properties)))

(defn- display-properties
  [block {:keys [gallery-view? page-title? sidebar-properties? tag-dialog?]} show-empty-and-hidden-properties?]
  (let [current-db (db/get-db)
        page-properties-area? (and (entity-util/page? block)
                                   (or page-title?
                                       sidebar-properties?
                                       tag-dialog?))
        properties* (properties-for-display block)
        {:keys [properties recycled-only-property-ids]}
        (sanitize-property-values-for-display properties*)
        remove-built-in-or-other-position-properties
        (fn [property-pairs show-in-hidden-properties?]
          (remove (fn [property]
                    (let [id (if (vector? property) (first property) property)]
                      (or
                       (= id :block/tags)
                       (when-let [ent (db/entity id)]
                         (or
                          ;; built-in
                          (and (not (ldb/public-built-in-property? ent))
                               (ldb/built-in? ent))
                          ;; other position
                          (when-not (or
                                     page-properties-area?
                                     show-empty-and-hidden-properties?
                                     show-in-hidden-properties?)
                            (outliner-property/property-with-other-position? current-db block ent))
                          (and gallery-view?
                               (contains? #{:logseq.property.class/properties} (:db/ident ent))))))))
                  property-pairs))
        {:keys [all-classes classes-properties]} (outliner-property/get-block-classes-properties current-db (:db/id block))
        classes-properties-set (set (map :db/ident classes-properties))
        block-own-properties (->> properties
                                  (remove (fn [[id _]] (contains? recycled-only-property-ids id)))
                                  (remove (fn [[id _]] (classes-properties-set id))))
        state-hide-empty-properties? (:ui/hide-empty-properties? (state/get-config))
        hide-with-property-id (fn [property-id]
                                (let [property (db/entity property-id)]
                                  (boolean
                                   (cond
                                     show-empty-and-hidden-properties?
                                     false
                                     state-hide-empty-properties?
                                     (nil? (get properties property-id))
                                     (and (:logseq.property/hide-empty-value property)
                                          (nil? (get properties property-id)))
                                     true
                                     :else
                                     (boolean (:logseq.property/hide? property))))))
        property-hide-f (cond
                          config/publishing?
                          ;; Publishing is read only so hide all blank properties as they
                          ;; won't be edited and distract from properties that have values
                          (fn [[property-id property-value]]
                            (or (nil? property-value)
                                (hide-with-property-id property-id)))
                          state-hide-empty-properties?
                          (fn [[property-id property-value]]
                            ;; User's selection takes precedence over config
                            (if (:logseq.property/hide? (db/entity property-id))
                              (hide-with-property-id property-id)
                              (nil? property-value)))
                          :else
                          (comp hide-with-property-id first))
        {block-hidden-properties true
         block-own-properties' false} (group-by property-hide-f block-own-properties)
        class-properties (loop [classes all-classes
                                existing-properties (set (map first block-own-properties'))
                                result []]
                           (if-let [class (first classes)]
                             (let [cur-properties (->> (db-property/get-class-ordered-properties class)
                                                       (map :db/ident)
                                                       (remove existing-properties))]
                               (recur (rest classes)
                                      (set/union existing-properties (set cur-properties))
                                      (if (seq cur-properties)
                                        (into result cur-properties)
                                        result)))
                             result))
        class-property-pairs (->> class-properties
                                  (map (fn [p] [p (get properties p)]))
                                  (remove (fn [[property-id _]]
                                            (contains? recycled-only-property-ids property-id))))
        full-properties (-> (concat block-own-properties'
                                    (remove property-hide-f class-property-pairs))
                            (remove-built-in-or-other-position-properties false))
        hidden-properties (remove (fn [[property-id _]]
                                    (= property-id :logseq.property/query))
                                  (remove-built-in-or-other-position-properties
                                   (concat block-hidden-properties
                                           (filter property-hide-f class-property-pairs))
                                   true))]
    {:full-properties full-properties
     :hidden-properties hidden-properties}))

(defn has-hidden-properties?
  [block opts]
  (let [show-empty-and-hidden-state (some-> @state/state
                                            (get :ui/show-empty-and-hidden-properties?)
                                            deref)
        {:keys [mode show? ids]} show-empty-and-hidden-state
        show-empty-and-hidden-properties? (and show?
                                             (or (= mode :global)
                                                 (and (set? ids) (contains? ids (:block/uuid block)))))
        {:keys [hidden-properties]} (display-properties block opts show-empty-and-hidden-properties?)]
    (boolean (seq hidden-properties))))

(hsx/defc hidden-properties-toggle-button
  [block {:keys [icon-only? tab-index bottom-row-nav? bottom-pill?] :as _opts}]
  (let [block-uuid (:block/uuid block)
        show-hidden-properties? (use-hidden-properties-visible block-uuid)
        label (hidden-properties-toggle-label show-hidden-properties?)]
    (when block-uuid
      (if bottom-pill?
        [:button.bottom-property-pill.bottom-property-pill-focusable.bottom-property-hidden-toggle-btn
         {:type "button"
          :data-bottom-pill-focusable true
          :data-bottom-row-nav (when bottom-row-nav? true)
          :tab-index (or tab-index -1)
          :aria-label label
          :on-click (fn [e]
                      (util/stop e)
                      (toggle-hidden-properties-visibility! block-uuid))}
         (ui/icon (if show-hidden-properties? "chevron-up" "chevron-down")
                  {:size 16 :class "bottom-property-action-icon"})
         label]
        (if icon-only?
          [:div.ls-new-property
           (shui/button
            {:variant :secondary
             :size :sm
             :class "jtrigger flex bottom-property-add-btn"
             :tab-index (or tab-index 0)
             :data-bottom-row-nav (when bottom-row-nav? true)
             :aria-label label
             :on-click (fn [e]
                         (util/stop e)
                         (toggle-hidden-properties-visibility! block-uuid))}
            (ui/icon (if show-hidden-properties? "chevron-up" "chevron-down")
                     {:size 16 :class "bottom-property-action-icon"}))]
          [:div.property-pair.property-panel-row.hidden-properties-toggle-row
           [:div.property-key-panel
            [:button.property-key-inner.jtrigger-view.hidden-properties-toggle-key
             {:type "button"
              :tab-index (or tab-index 0)
              :aria-label label
              :on-click (fn [e]
                          (util/stop e)
                          (toggle-hidden-properties-visibility! block-uuid))}
             [:span.property-icon
              (ui/icon (if show-hidden-properties? "chevron-up" "chevron-down")
                       {:size 16})]
             [:span.property-k label]]]
           [:div.property-value-panel.ls-block.property-value-container]])))))

(hsx/defc hidden-properties-cp
  [block hidden-properties {:keys [show-hidden-properties?] :as opts}]
  (when (and show-hidden-properties? (seq hidden-properties))
    (properties-section block hidden-properties opts)))

(hsx/defc load-bidirectional-properties
  [block root-block-or-page? set-bidirectional-properties!]
  (hooks/use-effect!
   (fn []
     (when (and root-block-or-page? (:db/id block))
       (p/let [result (db-async/<get-bidirectional-properties (:db/id block))]
         (set-bidirectional-properties! result)))
     (fn []))
   [root-block-or-page? (:db/id block)]))

(hsx/defc bidirectional-properties-area
  [target-block opts]
  (let [*bidirectional-properties (hooks/use-memo #(atom nil) [])
        [bidirectional-properties] (hooks/use-atom *bidirectional-properties)
        block (resolve-linked-block-if-exists target-block)
        root-block? (and (= (str (:block/uuid block)) (:id opts))
                         (not (entity-util/page? block)))]
    [:<>
     (load-bidirectional-properties block
                                    (or root-block? (entity-util/page? block))
                                    #(reset! *bidirectional-properties %))
     (bidirectional-properties-section bidirectional-properties)]))

(hsx/defc ^:large-vars/cleanup-todo properties-area
  [target-block {:keys [sidebar-properties? tag-dialog? skip-bidirectional-properties?] :as opts}]
  (let [*bidirectional-properties (hooks/use-memo #(atom nil) [])
        [bidirectional-properties] (hooks/use-atom *bidirectional-properties)
        id (hooks/use-memo #(str (random-uuid)) [])
        block (resolve-linked-block-if-exists target-block)
        show-hidden-properties? (use-hidden-properties-visible (:block/uuid block))
        show-properties? (or sidebar-properties? tag-dialog?)
        class? (entity-util/class? block)
        show-empty-and-hidden-properties? (let [{:keys [mode show? ids]} (state/use-sub :ui/show-empty-and-hidden-properties?)]
                                            (and show?
                                                 (or (= mode :global)
                                                     (and (set? ids) (contains? ids (:block/uuid block))))))
        {:keys [full-properties hidden-properties]} (display-properties block opts show-empty-and-hidden-properties?)
        current-route-page? (= (str (:block/uuid block)) (state/get-current-page))
        root-block? (and (= (str (:block/uuid block)) (:id opts))
                         (not (entity-util/page? block)))
        show-hidden-properties-toggle-button? (and (seq hidden-properties)
                                                   (or current-route-page?
                                                       root-block?))]
    [:<>
     (when-not skip-bidirectional-properties?
       (load-bidirectional-properties block
                                      root-block?
                                      #(reset! *bidirectional-properties %)))
     (let [has-bidirectional-properties? (seq bidirectional-properties)]
       (cond
         (and (empty? full-properties) (seq hidden-properties) (not root-block?) (not sidebar-properties?)
              (not class?)
              (not show-hidden-properties?)
              (not has-bidirectional-properties?))
         nil

         (and (empty? full-properties) (empty? hidden-properties) (not class?) (not has-bidirectional-properties?))
         (when show-properties?
           ^{:key (str id "-add-property")}
           [new-property block opts])

         :else
         (let [remove-properties #{:logseq.property/icon :logseq.property/query}
               properties' (->> (remove (fn [[k _v]] (contains? remove-properties k))
                                        full-properties)
                                (remove (fn [[k _v]] (= k :logseq.property.class/properties))))
               show-properties-panel? (seq properties')
               page? (entity-util/page? block)
               page-properties-area? (and page?
                                          (or (:page-title? opts)
                                              sidebar-properties?
                                              tag-dialog?))
               opts' (assoc opts :page-property? page-properties-area?)
               plugin-properties (->> (concat full-properties hidden-properties)
                                      (remove (fn [[k _v]] (= k :logseq.property.class/properties)))
                                      (into {}))
               props-for-plugin (when (enable-block-properties-renderers? opts' class?)
                                  (clj->js {:blockId (str (:block/uuid block))
                                            :properties (into {} (map (fn [[k v]]
                                                                        [(subs (str k) 1)
                                                                         (plugin-handler/serialize-property-value-for-plugin v)])
                                                                   plugin-properties))}))
               plugin-renderers (when props-for-plugin
                                  (plugin-handler/get-matched-block-properties-renderers
                                   {:block-id (str (:block/uuid block))
                                    :properties-map plugin-properties
                                    :props props-for-plugin}))
               prepend-renderers (filter #(= "prepend" (:mode %)) plugin-renderers)
               replace-renderer (first (filter #(= "replace" (:mode %)) plugin-renderers))
               append-renderers (remove #(contains? #{"prepend" "replace"} (:mode %)) plugin-renderers)
               show-hidden-properties-area? (and (not class?)
                                                 (or show-hidden-properties-toggle-button?
                                                     (and show-hidden-properties?
                                                          (seq hidden-properties))))
               show-class-properties-area? class?
               show-properties-area? (or (seq prepend-renderers)
                                         replace-renderer
                                         show-properties-panel?
                                         show-hidden-properties-area?
                                         (seq append-renderers)
                                         show-class-properties-area?)]

           [:<>
            (when show-properties-area?
              [:div.ls-properties-area
               {:id id
                :class (util/classnames [{:ls-page-properties page?
                                          :ls-block-properties (not page?)}])
                :tab-index 0}
               [:<>
                (mapv (fn [r]
                        (when (fn? (:render r))
                          ^{:key (str "plugin-prepend-" (:key r))}
                          [:> (:render r) props-for-plugin]))
                      prepend-renderers)

                (if (and replace-renderer (fn? (:render replace-renderer)))
                  (when (fn? (:render replace-renderer))
                    ^{:key (str "plugin-replace-" (:key replace-renderer))}
                    [:> (:render replace-renderer) props-for-plugin])
                  (when show-properties-panel?
                    [:div.properties-panel
                     (properties-section block properties' opts')]))

                (when-not class?
                  [:<>
                   (when show-hidden-properties-toggle-button?
                     (hidden-properties-toggle-button block {}))
                   (when (and show-hidden-properties? (seq hidden-properties))
                     [:div.properties-panel
                      (hidden-properties-cp block hidden-properties
                                            (assoc opts' :show-hidden-properties? true))])])

                (when (and page? (not class?))
                  ^{:key (str id "-add-property")}
                  [new-property block opts'])

                (mapv (fn [r]
                        (when (fn? (:render r))
                          ^{:key (str "plugin-append-" (:key r))}
                          [:> (:render r) props-for-plugin]))
                      append-renderers)

                (when class?
                  (let [properties (->> (:logseq.property.class/properties block)
                                        (map (fn [e] [(:db/ident e)])))
                        opts' (assoc opts :class-schema? true)]
                    [:div.flex.flex-col.gap-1.mt-2
                     [:div {:style {:font-size 15}}
                      [:div.property-key.text-sm
                       (property-key-cp block (db/entity :logseq.property.class/properties) {})]
                      [:div.text-muted-foreground.ml-5
                       (t :class/tag-properties-desc)]]
                     [:div.gap-1.flex.flex-col
                      (properties-section block properties opts')
                      (hidden-properties-cp block hidden-properties
                                            (assoc opts :show-hidden-properties? show-hidden-properties?))
                      ^{:key (str id "-class-add-property")}
                      [:div.ml-5 [new-property block opts']]]]))]])
            (when-not skip-bidirectional-properties?
              (bidirectional-properties-section bidirectional-properties))])))]))
