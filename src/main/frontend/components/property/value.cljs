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
            [lambdaisland.glogi :as log]
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

(defn- create-page-if-not-exists!
  [property classes page]
  (let [page* (string/trim page)
        [_ page inline-class] (or (seq (map string/trim (re-find #"(.*)#(.*)$" page*)))
                                  [nil page* nil])
        id (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc page)]))
        class? (= (:block/name property) "tags")]
    (when (nil? id)
      (let [inline-class-uuid
            (when inline-class
              (or (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc inline-class)]))
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

(defn- select-page
  [block property {:keys [classes multiple-choices? dropdown?] :as opts}]
  (let [repo (state/get-current-repo)
        tags? (= "tags" (:block/name property))
        alias? (= "alias" (:block/name property))
        tags-or-alias? (or tags? alias?)
        selected-choices (if tags-or-alias?
                           (->> (if (= "tags" (:block/name property))
                                  (:block/tags block)
                                  (:block/alias block))
                                (map (fn [e] (:block/original-name e))))
                           (->> (get-in block [:block/properties (:block/uuid property)])
                                (map (fn [id]
                                       (:block/original-name (db/entity [:block/uuid id]))))))
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
        opts (cond->
              {:multiple-choices? multiple-choices?
               :items options
               :selected-choices selected-choices
               :dropdown? dropdown?
               :input-default-placeholder (cond
                                            tags?
                                            "Update tags"
                                            alias?
                                            "Update alias"
                                            multiple-choices?
                                            "Choose pages"
                                            :else
                                            "Choose page")
               :show-new-when-not-exact-match? true
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
               :input-opts (fn [_]
                             {:on-blur (fn []
                                         (exit-edit-property))
                              :on-key-down
                              (fn [e]
                                (case (util/ekey e)
                                  "Escape"
                                  (do
                                    (exit-edit-property)
                                    (when-let [f (:on-chosen opts)] (f)))
                                  nil))})}
               multiple-choices?
               (assoc :on-apply (fn [choices]
                                  (let [pages (->> choices
                                                   (map #(create-page-if-not-exists! property classes %))
                                                   (map first))
                                        values (set (map (fn [page]
                                                           (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc page)]))) pages))]
                                    (add-property! block (:block/original-name property) values)
                                    (when-let [f (:on-chosen opts)] (f)))))
               (not multiple-choices?)
               (assoc :on-chosen (fn [chosen]
                                   (let [page* (string/trim (if (string? chosen) chosen (:value chosen)))]
                                     (when-not (string/blank? page*)
                                       (let [[page id] (create-page-if-not-exists! property classes page*)
                                             id' (or id (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc page)])))]
                                         (add-property! block (:block/original-name property) id')
                                         (when-let [f (:on-chosen opts)] (f))))))))]
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
        blocks (if (string/blank? value)
                 [parent child-1]
                 [parent child-1 child-2])
        last-block-id (:block/uuid (last blocks))]
    (db/transact! repo blocks {:outliner-op :insert-blocks})
    (add-property! block (:block/original-name property) parent-id)
    (editor-handler/edit-block! (db/entity [:block/uuid last-block-id]) 0 last-block-id)))

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
  [block property {:keys [multiple-choices? dropdown?] :as opts}]
  (let [items (->> (model/get-block-property-values (:block/uuid property))
                   (mapcat (fn [[_id value]]
                             (if (coll? value)
                               (map (fn [v] {:value v}) value)
                               [{:value value}])))
                   (distinct))
        add-property-f #(add-property! block (:block/original-name property) %)
        on-chosen (fn [chosen]
                    (add-property-f (if (map? chosen) (:value chosen) chosen))
                    (when-let [f (:on-chosen opts)] (f)))
        selected-choices' (get-in block [:block/properties (:block/uuid property)])
        selected-choices (if (coll? selected-choices') selected-choices' [selected-choices'])]
    (select/select (cond->
                    {:multiple-choices? multiple-choices?
                     :items items
                     :selected-choices selected-choices
                     :dropdown? dropdown?
                     :show-new-when-not-exact-match? true
                     :extract-chosen-fn :value
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
                                        nil))})}
                     multiple-choices?
                     (assoc :on-apply on-chosen)
                     (not multiple-choices?)
                     (assoc :on-chosen on-chosen)))))

(rum/defc property-block-value < rum/reactive
  [repo block property value block-cp editor-box opts]
  (let [parent (db/entity [:block/uuid value])
        parent (db/sub-block (:db/id parent))
        children (model/sort-by-left (:block/_parent parent) parent)
        children-count (count (:block/_parent parent))
        empty-block? (or (nil? parent) (zero? children-count))]
    (when empty-block?
      (when parent
        (db/transact! repo [[:db/retractEntity (:db/id parent)]]
          {:outliner-op :delete-blocks}))
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
      [:div.property-block-container.w-full.property-template
       (properties-cp config entity (:editor-id config) (merge opts {:in-block-container? true}))])))

(rum/defc property-scalar-value < rum/reactive db-mixins/query
  [block property value {:keys [inline-text page-cp block-cp
                                editor-id dom-id row?
                                editor-box editor-args
                                editing? *add-new-item?
                                blocks-container-id
                                on-chosen dropdown?]
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
                                  (when *add-new-item? (reset! *add-new-item? false))
                                  (when on-chosen (on-chosen)))}]
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
           [:div.h-6 (select block property (assoc select-opts
                                                   :multiple-choices? multiple-values?
                                                   :dropdown? true))]

           :page
           [:div.h-6 (select-page block property (assoc select-opts
                                                        :classes (:classes schema)
                                                        :multiple-choices? multiple-values?
                                                        :dropdown? true))]

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
                   (page-cp {:disable-preview? true
                             :hide-close-button? true} page))

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

(rum/defcs multiple-values < rum/reactive
  {:init (fn [state]
           (assoc state
                  ::add-new-item?
                  (atom (boolean (:add-new-item? (nth (:rum/args state) 3))))
                  ::show-add?
                  (atom (boolean (:show-add? (nth (:rum/args state) 3))))))}
  [state block property v {:keys [on-chosen] :as opts} dom-id schema editor-id editor-args]
  (let [*show-add? (::show-add? state)
        *add-new-item? (::add-new-item? state)
        type (get schema :type :default)
        row? (contains? #{:page :date :number :url} type)
        select-type? (contains? #{:page :number :url} type)
        items (if (coll? v) v (when v [v]))
        values-cp (for [[idx item] (medley/indexed items)]
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
                                           :*add-new-item? *add-new-item?
                                           :show-close-button? (not select-type?)}))
                        dom-id')))]
    [:div.relative
     {:class (cond
               row?
               "flex flex-1 flex-row items-center flex-wrap gap-2"
               :else
               "grid gap-1")
      :on-mouse-over #(reset! *show-add? true)
      :on-mouse-out  #(reset! *show-add? false)}

     (when (seq items)
       (if select-type?
         (ui/dropdown
          (fn [{:keys [toggle-fn]}]
            [:div.cursor-pointer
             {:on-mouse-down (fn [e]
                               (util/stop e)
                               (toggle-fn))
              :class "flex flex-1 flex-row items-center flex-wrap gap-2"}
             values-cp])
          (fn [{:keys [_toggle-fn]}]
            (let [select-opts {:on-chosen (fn []
                                            (when *add-new-item? (reset! *add-new-item? false))
                                            (when on-chosen (on-chosen)))}]
              [:div.property-select
               (if (= type :page)
                 (select-page block property (assoc select-opts
                                                    :classes (:classes schema)
                                                    :multiple-choices? true
                                                    :dropdown? false))
                 (select block property (assoc select-opts
                                               :multiple-choices? true
                                               :dropdown? false)))]))
          {:modal-class (util/hiccup->class
                         "origin-top-right.absolute.left-0.rounded-md.shadow-lg.mt-2")})
         values-cp))

     (cond
       (rum/react *add-new-item?)
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

       (and (rum/react *show-add?) row? (not select-type?) (not config/publishing?))
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
