(ns frontend.components.property
  "Block properties management."
  (:require [clojure.string :as string]
            [frontend.components.dnd :as dnd]
            [frontend.components.icon :as icon-component]
            [frontend.components.property.config :as property-config]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db.async :as db-async]
            [frontend.db.hooks :as db-hooks]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.route :as route-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.entity :as entity]
            [logseq.api.block :as api-block]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
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
          add-class-property? (and (entity/class? entity) class-schema?)
          property (db-async/<get-block repo id-or-name {:children? false})
          property? (entity/property? property)
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
                       (and (not property?) (entity/internal-page? property))
                       (assoc :properties {:db/id (:db/id property)}))
                result (db-property-handler/upsert-property! nil schema opts)
                property (db-async/<get-block repo (:db/id result) {:children? false})
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
                        add-class-property? (and (entity/class? block) class-schema?)]
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
       (p/let [properties (if (:class-schema? select-opts)
                            (property-handler/get-class-property-choices)
                            (db-async/<get-all-properties :remove-ui-non-suitable-properties? true
                                                          :block (:block select-opts)))]
         (set-properties! properties)))
     [])
    (hooks/use-effect!
     (fn []
       (p/let [repo (state/get-current-repo)
               block (when-not (string/blank? q)
                       (db-async/<get-block repo q {:children? false}))
               internal-page-exists? (entity/internal-page? block)]
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
  [block *property *property-key *show-new-property-config? {:keys [class-schema? remove-property? view-parent]}]
  (fn [{:keys [value label convert-page-to-property?]}]
    (p/let [repo (state/get-current-repo)
            property (cond
                       (uuid? value) (db-async/<get-block repo value {:children? false})
                       (keyword? value) (db-async/<get-block repo value {:children? false}))
            _ (reset! *property-key (if property
                                      (if convert-page-to-property? (:block/title property) label)
                                      value))
            batch? (pv/batch-operation?)]
      (if (and property remove-property?)
        (let [block-ids (map :block/uuid (pv/get-operating-blocks block))]
          (property-handler/batch-remove-block-property!
           block-ids
           (:db/ident property)
           {:preserve-task-tag? (= :logseq.class/Task (:db/ident view-parent))})
          (shui/popup-hide!))
        (do
          (when (and *show-new-property-config? (not (entity/property? property)))
            (reset! *show-new-property-config? true))
          (reset! *property property)
          (when-not convert-page-to-property?
            (when (and property (entity/property? property))
              (let [add-class-property? (and (entity/class? block) class-schema?)
                    type (:logseq.property/type property)
                    default-or-url? (and (contains? #{:default :url} type)
                                         (not (seq (:property/closed-values property))))]
                  (cond
                    add-class-property?
                    (p/do!
                     (pv/<add-property! block (:db/ident property) "" {:class-schema? class-schema?})
                     (shui/popup-hide!))

                    (and batch? (or (= :checkbox type) (and batch? default-or-url?)))
                    nil

                    (= :checkbox type)
                    (p/do!
                     (ui/hide-popups-until-preview-popup!)
                     (shui/popup-hide!)
                     (let [value (if-some [value (:logseq.property/scalar-default-value property)]
                                   value
                                   false)]
                       (pv/<add-property! block (:db/ident property) value {:exit-edit? true})))

                    default-or-url?
                    (pv/<create-new-block! block property "" {:batch-op? true})

                  (or (not= :default type)
                      (and (= :default type) (seq (:property/closed-values property))))
                  (reset! *show-new-property-config? false))))))))))

(defn- property-description-title
  [property]
  (:logseq.property/description-title property))

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
  [entity-uuids]
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
    (if (and blocks-container (seq entity-uuids))
      [:div.ls-bidirectional-block-container.w-full
       (blocks-container config entity-uuids)]
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

(hsx/defc bidirectional-property-group
  [value class-uuid entity-uuids]
  (let [class (db-hooks/use-block class-uuid)]
    (when class
      (shui/tabs-trigger
       {:key (str "bidirectional-tab-" value)
        :value value
        :variant :line
        :class "px-0 py-1 text-base text-foreground"
        :data-entity-count (count entity-uuids)}
       [:span.inline-flex.items-center.gap-1.5
        (bidirectional-tab-icon class)
        [:span (:block/title class)]]))))

(hsx/defc bidirectional-properties-section
  [groups]
  (when (seq groups)
    (let [groups (mapv (fn [{:keys [class-uuid] :as group}]
                         (assoc group :value (str class-uuid)))
                       groups)
          default-value (:value (first groups))]
      [:div.w-full.ls-bidirectional-properties.mt-8
       (shui/tabs
        {:defaultValue default-value
         :class "w-full"}
        (shui/tabs-list
         {:variant :line
          :class "h-8 gap-3"}
         (for [{:keys [value class-uuid entity-uuids]} groups]
           (bidirectional-property-group value class-uuid entity-uuids)))
        (for [{:keys [value entity-uuids]} groups]
          (shui/tabs-content
           {:key (str "bidirectional-tab-content-" value)
            :value value}
           (bidirectional-values-cp entity-uuids))))])))

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
                               (and property (entity/class? property)))]
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
  (or (:block/link block) block))

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

(defn- entity-values-by-uuid
  [value]
  (cond
    (map? value)
    (cond-> (reduce merge {} (map entity-values-by-uuid (vals value)))
      (uuid? (:block/uuid value)) (assoc (:block/uuid value) value))

    (coll? value)
    (reduce merge {} (map entity-values-by-uuid value))

    :else
    {}))

(defn- restore-resource-entity-values
  [block property value]
  (let [property-ident (:db/ident property)
        value (if (contains? block property-ident)
                (get block property-ident)
                value)
        entities (entity-values-by-uuid [block property])]
    (letfn [(restore [item]
              (cond
                (uuid? item) (get entities item item)
                (set? item) (into #{} (map restore) item)
                (vector? item) (mapv restore item)
                (sequential? item) (map restore item)
                :else item))]
      (restore value))))

(hsx/defc class-schema-property-value
  [property description-property-uuid opts]
  (let [description-property (db-hooks/use-block description-property-uuid)]
    (when description-property
      (pv/property-value property description-property opts))))

(hsx/defc property-cp
  [block {:keys [property-uuid property-ident value]} {:keys [sortable-opts description-property-uuid] :as opts}]
  (let [property (db-hooks/use-block property-uuid)]
    (when (and (keyword? property-ident) property)
      (let [value (restore-resource-entity-values block property value)
            type (get property :logseq.property/type :default)
          empty-value? (empty-panel-property-value? value)
          show-panel-bullet? (show-property-panel-bullet? property value)
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

         (let [block' (assoc block property-ident value)]
           [:div.ls-block.property-value-container.property-value-panel
            (when show-panel-bullet?
              [:div.property-panel-bullet {:aria-hidden true}
               [:span.bullet-container
                [:span.bullet]]])
            [:div.property-value.property-value-panel-inner.flex.flex-1
             (if (:class-schema? opts)
               (when description-property-uuid
                 (class-schema-property-value property description-property-uuid opts))
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

(hsx/defc ordered-properties
  [block properties* opts]
  (let [[properties set-properties!] (hooks/use-state properties*)
        [properties-order set-properties-order!] (hooks/use-state (mapv :property-ident properties))
        properties-by-id (zipmap (map :property-ident properties*) properties*)
        properties (vec (keep properties-by-id properties-order))
        choices (map (fn [{:keys [property-ident] :as row}]
                       (let [id (subs (str property-ident) 1)
                             opts (assoc opts :sortable-opts {:id id})]
                         {:id id
                          :value property-ident
                          :content (property-cp block row opts)})) properties)]
    (hooks/use-effect!
     (fn []
       (when (not= properties properties*)
         (set-properties! properties*))

       (when (not= (set (map :property-ident properties*))
                   (set (map :property-ident properties)))
         (set-properties-order! (mapv :property-ident properties*))))
     [properties*])
    (dnd/items choices
               {:sort-by-inner-element? true
                :on-drag-end (fn [properties-order {:keys [active-id over-id direction]}]
                               (set-properties-order! properties-order)
                               (db-async/<reorder-display-property!
                                (state/get-current-repo)
                                block
                                active-id
                                over-id
                                direction
                                (mapv :property-ident properties)))})))

(hsx/defc properties-section
  [block properties opts]
  (when (seq properties)
    (ordered-properties block properties opts)))

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

(def ^:private empty-display-properties
  {:full-properties []
   :hidden-properties []
   :description-property-uuid nil
   :class-properties-property-uuid nil})

(defn- show-empty-and-hidden-properties-enabled?
  [block]
  (let [show-empty-and-hidden-state (state/get-state :ui/show-empty-and-hidden-properties?)
        {:keys [mode show? ids]} show-empty-and-hidden-state]
    (and show?
         (or (= mode :global)
             (and (set? ids) (contains? ids (:block/uuid block)))))))

(defn- display-properties-resource-key
  [block-uuid opts show-empty-and-hidden-properties?]
  [:block-display-properties
   block-uuid
   {:gallery-view? (boolean (:gallery-view? opts))
    :page-title? (boolean (:page-title? opts))
    :sidebar-properties? (boolean (:sidebar-properties? opts))
    :tag-dialog? (boolean (:tag-dialog? opts))
    :publishing? (boolean config/publishing?)
    :state-hide-empty-properties? (boolean (:ui/hide-empty-properties? (state/get-config)))
    :show-empty-and-hidden-properties? (boolean show-empty-and-hidden-properties?)}])

(defn- use-display-properties
  [block opts enabled? show-empty-and-hidden?]
  (let [result (db-hooks/use-resource
                (display-properties-resource-key
                 (:block/uuid block)
                 opts
                 show-empty-and-hidden?))]
    (if (and enabled? (not (false? (:block-metadata-ready? opts))))
      (or result empty-display-properties)
      empty-display-properties)))

(defn use-has-hidden-properties
  [block opts enabled?]
  (let [show-empty-and-hidden? (show-empty-and-hidden-properties-enabled? block)
        {:keys [hidden-properties]} (use-display-properties block opts enabled? show-empty-and-hidden?)]
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

(hsx/defc bidirectional-properties-area
  [target-block opts]
  (let [block (resolve-linked-block-if-exists target-block)
        block-uuid (:block/uuid block)
        bidirectional-properties
        (db-hooks/use-resource [:block-bidirectional-properties block-uuid])
        root-block? (and (= (str (:block/uuid block)) (:id opts))
                         (not (entity/page? block)))]
    (when (or root-block? (entity/page? block))
      (bidirectional-properties-section bidirectional-properties))))

(hsx/defc class-properties-key
  [block class-properties-property-uuid]
  (let [property (db-hooks/use-block class-properties-property-uuid)]
    (when property
      (property-key-cp block property {}))))

(hsx/defc ^:large-vars/cleanup-todo properties-area
  [target-block {:keys [sidebar-properties? tag-dialog? skip-bidirectional-properties?] :as opts}]
  (let [id (hooks/use-memo #(str (random-uuid)) [])
        block (resolve-linked-block-if-exists target-block)
        block-uuid (:block/uuid block)
        root-block? (and (= (str block-uuid) (:id opts))
                         (not (entity/page? block)))
        show-hidden-properties? (use-hidden-properties-visible (:block/uuid block))
        show-properties? (or sidebar-properties? tag-dialog?)
        class? (entity/class? block)
        show-empty-and-hidden? (let [{:keys [mode show? ids]} (rfx/use-sub [:ui/show-empty-and-hidden-properties?])]
                                 (and show?
                                      (or (= mode :global)
                                          (and (set? ids) (contains? ids (:block/uuid block))))))
        {:keys [full-properties hidden-properties description-property-uuid
                class-properties-property-uuid]}
        (use-display-properties block opts true show-empty-and-hidden?)
        current-route-page? (= (str (:block/uuid block)) (state/get-current-page))
        show-hidden-properties-toggle-button? (and (seq hidden-properties)
                                                   (or current-route-page?
                                                       root-block?))]
    [:<>
     (cond
       (and (empty? full-properties) (seq hidden-properties) (not root-block?) (not sidebar-properties?)
            (not class?)
            (not show-hidden-properties?))
         nil

       (and (empty? full-properties) (empty? hidden-properties) (not class?))
       (when show-properties?
         ^{:key (str id "-add-property")}
         [new-property block opts])

       :else
       (let [remove-properties #{:logseq.property/icon :logseq.property/query}
               properties' (->> (remove (fn [{:keys [property-ident]}]
                                          (contains? remove-properties property-ident))
                                        full-properties)
                                (remove (fn [{:keys [property-ident]}]
                                          (= property-ident :logseq.property.class/properties))))
               show-properties-panel? (seq properties')
               page? (entity/page? block)
               page-properties-area? (and page?
                                          (or (:page-title? opts)
                                              sidebar-properties?
                                              tag-dialog?))
               opts' (assoc opts :page-property? page-properties-area?)
               plugin-properties (->> (concat full-properties hidden-properties)
                                      (remove (fn [{:keys [property-ident]}]
                                                (= property-ident :logseq.property.class/properties)))
                                      (map (fn [{:keys [property-ident value]}]
                                             [property-ident value]))
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
                     (properties-section block properties'
                                         (assoc opts'
                                                :description-property-uuid
                                                description-property-uuid))]))

                (when-not class?
                  [:<>
                   (when show-hidden-properties-toggle-button?
                     (hidden-properties-toggle-button block {}))
                   (when (and show-hidden-properties? (seq hidden-properties))
                     [:div.properties-panel
                      (hidden-properties-cp block hidden-properties
                                            (assoc opts'
                                                   :show-hidden-properties? true
                                                   :description-property-uuid
                                                   description-property-uuid))])])

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
                                        (map (fn [property]
                                               {:property-uuid (:block/uuid property)
                                                :property-ident (:db/ident property)
                                                :value nil})))
                        opts' (assoc opts
                                     :class-schema? true
                                     :description-property-uuid description-property-uuid)]
                    [:div.flex.flex-col.gap-1.mt-2
                     [:div {:style {:font-size 15}}
                      [:div.property-key.text-sm
                       (when class-properties-property-uuid
                         (class-properties-key block class-properties-property-uuid))]
                      [:div.text-muted-foreground.ml-5
                       (t :class/tag-properties-desc)]]
                     [:div.gap-1.flex.flex-col
                      (properties-section block properties opts')
                      (hidden-properties-cp block hidden-properties
                                            (assoc opts
                                                   :show-hidden-properties? show-hidden-properties?
                                                   :description-property-uuid
                                                   description-property-uuid))
                      ^{:key (str id "-class-add-property")}
                      [:div.ml-5 [new-property block opts']]]]))]])))
     (when (and (or root-block? (entity/page? block))
                (not skip-bidirectional-properties?))
       (bidirectional-properties-area block opts))]))
