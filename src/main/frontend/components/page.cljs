(ns frontend.components.page
  (:require [clojure.string :as string]
            [frontend.components.block :as component-block]
            [frontend.components.content :as content]
            [frontend.components.editor :as editor]
            [frontend.components.hierarchy :as hierarchy]
            [frontend.components.plugins :as plugins]
            [frontend.components.reference :as reference]
            [frontend.components.svg :as svg]
            [frontend.components.scheduled-deadlines :as scheduled]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as model]
            [frontend.extensions.graph :as graph]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.handler.common :as common-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.route :as route-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.search :as search]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [goog.object :as gobj]
            [reitit.frontend.easy :as rfe]
            [medley.core :as medley]
            [rum.core :as rum]
            [logseq.graph-parser.util :as gp-util]
            [frontend.format.block :as block]
            [frontend.mobile.util :as mobile-util]))

(defn- get-page-name
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

(defn- get-blocks
  [repo page-name block-id]
  (when page-name
    (let [root (if block-id
                 (db/pull [:block/uuid block-id])
                 (model/get-page page-name))
          opts (if block-id
                 {:scoped-block-id (:db/id root)}
                 {})]
      (db/get-paginated-blocks repo (:db/id root) opts))))

(defn- open-first-block!
  [state]
  (let [[_ blocks _ sidebar? preview?] (:rum/args state)]
    (when (and
           (or preview?
               (not (contains? #{:home :all-journals} (state/get-current-route))))
           (not sidebar?))
      (let [block (first blocks)]
        (when (and (= (count blocks) 1)
                   (string/blank? (:block/content block))
                   (not preview?))
          (editor-handler/edit-block! block :max (:block/uuid block))))))
  state)

(rum/defc page-blocks-inner <
  {:did-mount  open-first-block!
   :did-update open-first-block!}
  [page-name _blocks hiccup sidebar? _block-uuid]
  [:div.page-blocks-inner {:style {:margin-left (if sidebar? 0 -20)}}
   (rum/with-key
     (content/content page-name
                      {:hiccup   hiccup
                       :sidebar? sidebar?})
     (str page-name "-hiccup"))])

(declare page)

(rum/defc dummy-block
  [page-name]
  (let [handler-fn (fn []
                     (let [block (editor-handler/insert-first-page-block-if-not-exists! page-name {:redirect? false})]
                       (js/setTimeout #(editor-handler/edit-block! block :max (:block/uuid block)) 0)))]
    [:div.ls-block.flex-1.flex-col.rounded-sm {:style {:width "100%"}}
     [:div.flex.flex-row
      [:div.flex.flex-row.items-center.mr-2.ml-1 {:style {:height 24}}
       [:span.bullet-container.cursor
        [:span.bullet]]]
      [:div.flex.flex-1 {:tabIndex 0
                         :on-key-press (fn [e]
                                         (when (= "Enter" (util/ekey e))
                                           (handler-fn)))
                         :on-click handler-fn}
       [:span.opacity-50
        "Click here to edit..."]]]]))

(rum/defc add-button
  [args]
  [:div.flex-1.flex-col.rounded-sm.add-button-link-wrap
   {:on-click (fn [] (editor-handler/api-insert-new-block! "" args))}
   [:div.flex.flex-row
    [:div.block {:style {:height      20
                         :width       20
                         :margin-left 2}}
     [:a.add-button-link.block
      (ui/icon "circle-plus")]]]])

(rum/defc page-blocks-cp < rum/reactive db-mixins/query
  {:will-mount (fn [state]
                 (let [page-e (second (:rum/args state))
                       page-name (:block/name page-e)]
                   (when (and (db/journal-page? page-name)
                              (>= (date/journal-title->int page-name)
                                  (date/journal-title->int (date/today))))
                     (state/pub-event! [:journal/insert-template page-name])))
                 state)}
  [repo page-e {:keys [sidebar?] :as config}]
  (when page-e
    (let [page-name (or (:block/name page-e)
                        (str (:block/uuid page-e)))
          block-id (parse-uuid page-name)
          block? (boolean block-id)
          page-blocks (get-blocks repo page-name block-id)]
      (if (empty? page-blocks)
        (dummy-block page-name)
        (let [document-mode? (state/sub :document/mode?)
              block-entity (db/entity (if block-id
                                       [:block/uuid block-id]
                                       [:block/name page-name]))
              hiccup-config (merge
                             {:id (if block? (str block-id) page-name)
                              :db/id (:db/id block-entity)
                              :block? block?
                              :editor-box editor/box
                              :document/mode? document-mode?}
                             config)
              hiccup-config (common-handler/config-with-document-mode hiccup-config)
              hiccup (component-block/->hiccup page-blocks hiccup-config {})]
          [:div
           (page-blocks-inner page-name page-blocks hiccup sidebar? block-id)
           (when-not config/publishing?
             (let [args (if block-id
                          {:block-uuid block-id}
                          {:page page-name})]
               (add-button args)))])))))

(defn contents-page
  [page]
  (when-let [repo (state/get-current-repo)]
    (page-blocks-cp repo page {:sidebar? true})))

(rum/defc today-queries < rum/reactive
  [repo today? sidebar?]
  (when (and today? (not sidebar?))
    (let [queries (get-in (state/sub-config repo) [:default-queries :journals])]
      (when (seq queries)
        [:div#today-queries.mt-10
         (for [query queries]
           (rum/with-key
             (ui/catch-error
              (ui/component-error "Failed default query:" {:content (pr-str query)})
              (component-block/custom-query {:attr {:class "mt-10"}
                                             :editor-box editor/box
                                             :page page} query))
             (str repo "-custom-query-" (:query query))))]))))

(defn tagged-pages
  [repo tag]
  (let [pages (db/get-tag-pages repo tag)]
    (when (seq pages)
      [:div.references.mt-6.flex-1.flex-row
       [:div.content
        (ui/foldable
         [:h2.font-bold.opacity-50 (util/format "Pages tagged with \"%s\"" tag)]
         [:ul.mt-2
          (for [[original-name name] (sort-by last pages)]
            [:li {:key (str "tagged-page-" name)}
             [:a {:href (rfe/href :page {:name name})}
              original-name]])]
         {:default-collapsed? false})]])))

(rum/defcs page-title <
  (rum/local false ::edit?)
  {:init (fn [state]
           (assoc state ::title-value (atom (nth (:rum/args state) 2))))}
  [state page-name icon title _format fmt-journal?]
  (when title
    (let [*title-value (get state ::title-value)
          *edit? (get state ::edit?)
          input-ref (rum/create-ref)
          repo (state/get-current-repo)
          hls-file? (pdf-assets/hls-file? title)
          title (if hls-file?
                  (pdf-assets/human-hls-filename-display title)
                  (if fmt-journal? (date/journal-title->custom-format title) title))
          old-name (or title page-name)
          confirm-fn (fn []
                       (let [new-page-name (string/trim @*title-value)
                             merge? (and (not= (util/page-name-sanity-lc page-name)
                                               (util/page-name-sanity-lc @*title-value))
                                         (db/page-exists? page-name)
                                         (db/page-exists? @*title-value))]
                         (ui/make-confirm-modal
                          {:title         (if merge?
                                            (str "Page “" @*title-value "” already exists, merge to it?")
                                            (str "Do you really want to change the page name to “" new-page-name "”?"))
                           :on-confirm    (fn [_e {:keys [close-fn]}]
                                            (close-fn)
                                            (page-handler/rename! (or title page-name) @*title-value)
                                            (reset! *edit? false))
                           :on-cancel     (fn []
                                            (reset! *title-value old-name)
                                            (gobj/set (rum/deref input-ref) "value" old-name)
                                            (reset! *edit? true))})))
          rollback-fn #(do
                         (reset! *title-value old-name)
                         (gobj/set (rum/deref input-ref) "value" old-name)
                         (reset! *edit? false)
                         (notification/show! "Illegal page name, can not rename!" :warning))
          blur-fn (fn [e]
                    (when (gp-util/wrapped-by-quotes? @*title-value)
                      (swap! *title-value gp-util/unquote-string)
                      (gobj/set (rum/deref input-ref) "value" @*title-value))
                    (cond
                      (= old-name @*title-value)
                      (reset! *edit? false)

                      (string/blank? @*title-value)
                      (rollback-fn)

                      :else
                      (state/set-modal! (confirm-fn)))
                    (util/stop e))]
      (if @*edit?
        [:h1.title.ls-page-title
         {:class (util/classnames [{:editing @*edit?}])}
         [:input.edit-input
          {:type          "text"
           :ref           input-ref
           :auto-focus    true
           :style         {:outline "none"
                           :font-weight 600}
           :auto-complete (if (util/chrome?) "chrome-off" "off") ; off not working here
           :default-value old-name
           :on-change     (fn [^js e]
                            (let [value (util/evalue e)]
                              (reset! *title-value (string/trim value))))
           :on-blur       blur-fn
           :on-key-down   (fn [^js e]
                            (when (= (gobj/get e "key") "Enter")
                              (blur-fn e)))
           :on-key-up     (fn [^js e]
                            ;; Esc
                            (when (= 27 (.-keyCode e))
                              (reset! *title-value old-name)
                              (reset! *edit? false)))}]]
        [:a.page-title {:on-mouse-down (fn [e]
                                         (when (util/right-click? e)
                                           (state/set-state! :page-title/context {:page page-name})))
                        :on-click (fn [e]
                                    (.preventDefault e)
                                    (if (gobj/get e "shiftKey")
                                      (when-let [page (db/pull repo '[*] [:block/name page-name])]
                                        (state/sidebar-add-block!
                                         repo
                                         (:db/id page)
                                         :page))
                                      (when (and (not hls-file?) (not fmt-journal?))
                                        (reset! *edit? true))))}
         [:h1.title.ls-page-title {:data-ref page-name}
          (when (not= icon "") [:span.page-icon icon])
          title]]))))

(defn- page-mouse-over
  [e *control-show? *all-collapsed?]
  (util/stop e)
  (reset! *control-show? true)
  (let [all-collapsed?
        (->> (editor-handler/all-blocks-with-level {:collapse? true})
             (filter (fn [b] (editor-handler/collapsable? (:block/uuid b))))
             (empty?))]
    (reset! *all-collapsed? all-collapsed?)))

(defn- page-mouse-leave
  [e *control-show?]
  (util/stop e)
  (reset! *control-show? false))

(rum/defcs page-blocks-collapse-control <
  [state title *control-show? *all-collapsed?]
  [:a.page-blocks-collapse-control
   {:id (str "control-" title)
    :on-click (fn [event]
                (util/stop event)
                (if @*all-collapsed?
                  (editor-handler/expand-all!)
                  (editor-handler/collapse-all!))
                (swap! *all-collapsed? not))}
   [:span.mt-6 {:class (if @*control-show?
                         "control-show cursor-pointer" "control-hide")}
    (ui/rotating-arrow @*all-collapsed?)]])

;; A page is just a logical block
(rum/defcs ^:large-vars/cleanup-todo page < rum/reactive
  (rum/local false ::all-collapsed?)
  (rum/local false ::control-show?)
  (rum/local nil   ::current-page)
  [state {:keys [repo page-name] :as option}]
  (when-let [path-page-name (or page-name
                                (get-page-name state)
                                (state/get-current-page))]
    (let [current-repo (state/sub :git/current-repo)
          repo (or repo current-repo)
          page-name (util/page-name-sanity-lc path-page-name)
          block-id (parse-uuid page-name)
          block? (boolean block-id)
          format (let [page (if block-id
                              (:block/name (:block/page (db/entity [:block/uuid block-id])))
                              page-name)]
                   (db/get-page-format page))
          journal? (db/journal-page? page-name)
          fmt-journal? (boolean (date/journal-title->int page-name))
          sidebar? (:sidebar? option)
          route-page-name path-page-name
          page (if block?
                 (->> (:db/id (:block/page (db/entity repo [:block/uuid block-id])))
                      (db/entity repo))
                 (do
                   (when-not (db/entity repo [:block/name page-name])
                     (let [m (block/page-name->map path-page-name true)]
                       (db/transact! repo [m])))
                   (db/pull [:block/name page-name])))
          {:keys [icon]} (:block/properties page)
          page-name (:block/name page)
          page-original-name (:block/original-name page)
          title (or page-original-name page-name)
          icon (or icon "")
          today? (and
                  journal?
                  (= page-name (util/page-name-sanity-lc (date/journal-name))))
          *control-show? (::control-show? state)
          *all-collapsed? (::all-collapsed? state)
          *current-block-page (::current-page state)]
      [:div.flex-1.page.relative
       (merge (if (seq (:block/tags page))
                (let [page-names (model/get-page-names-by-ids (map :db/id (:block/tags page)))]
                  {:data-page-tags (text-util/build-data-value page-names)})
                {})

              {:key path-page-name
               :class (util/classnames [{:is-journals (or journal? fmt-journal?)}])})

       [:div.relative
        (when (and (not sidebar?) (not block?))
          [:div.flex.flex-row.space-between
           (when (or (mobile-util/native-platform?) (util/mobile?))
             [:div.flex.flex-row.pr-2
              {:style {:margin-left -15}
               :on-mouse-over (fn [e]
                                (page-mouse-over e *control-show? *all-collapsed?))
               :on-mouse-leave (fn [e]
                                 (page-mouse-leave e *control-show?))}
              (page-blocks-collapse-control title *control-show? *all-collapsed?)])
           [:div.flex-1.flex-row
            (page-title page-name icon title format fmt-journal?)]
           (when (not config/publishing?)
             [:div.flex.flex-row
              (when plugin-handler/lsp-enabled?
                (plugins/hook-ui-slot :page-head-actions-slotted nil)
                (plugins/hook-ui-items :pagebar))])])
        [:div
         (when (and block? (not sidebar?))
           (let [config {:id "block-parent"
                         :block? true}]
             [:div.mb-4
              (component-block/breadcrumb config repo block-id {:level-limit 3})]))

         ;; blocks
         (let [page (if block?
                      (db/entity repo [:block/uuid block-id])
                      page)
               _ (and block? page (reset! *current-block-page (:block/name (:block/page page))))
               _ (when (and block? (not page))
                   (route-handler/redirect-to-page! @*current-block-page))]
           (page-blocks-cp repo page {:sidebar? sidebar?}))]]

       (when today?
         (today-queries repo today? sidebar?))

       (when today?
         (scheduled/scheduled-and-deadlines page-name))

       (when-not block?
         (tagged-pages repo page-name))

       ;; referenced blocks
       (when-not block?
         [:div {:key "page-references"}
          (rum/with-key
            (reference/references route-page-name)
            (str route-page-name "-refs"))])

       (when-not block?
         [:div
          (when (not journal?)
            (hierarchy/structures route-page-name))

          ;; TODO: or we can lazy load them
          (when-not sidebar?
            [:div {:key "page-unlinked-references"}
             (reference/unlinked-references route-page-name)])])])))

(defonce layout (atom [js/window.innerWidth js/window.innerHeight]))

;; scrollHeight
(rum/defcs graph-filter-section < (rum/local false ::open?)
  [state title content {:keys [search-filters]}]
  (let [open? (get state ::open?)]
    (when (and (seq search-filters) (not @open?))
      (reset! open? true))
    [:li.relative
     [:div
      [:button.w-full.px-4.py-2.text-left.focus:outline-none {:on-click #(swap! open? not)}
       [:div.flex.items-center.justify-between
        title
        (if @open? (svg/caret-down) (svg/caret-right))]]
      (content open?)]]))

(rum/defc filter-expand-area
  [open? content]
  [:div.relative.overflow-hidden.transition-all.max-h-0.duration-700
   {:style {:max-height (if @open? 400 0)}}
   content])

(defonce *n-hops (atom nil))
(defonce *focus-nodes (atom []))
(defonce *graph-reset? (atom false))
(defonce *journal? (atom nil))
(defonce *orphan-pages? (atom true))
(defonce *builtin-pages? (atom nil))
(defonce *excluded-pages? (atom true))
(defonce *show-journals-in-page-graph? (atom nil))

(rum/defc ^:large-vars/cleanup-todo graph-filters < rum/reactive
  [graph settings n-hops]
  (let [{:keys [journal? orphan-pages? builtin-pages? excluded-pages?]
         :or {orphan-pages? true}} settings
        journal?' (rum/react *journal?)
        orphan-pages?' (rum/react *orphan-pages?)
        builtin-pages?' (rum/react *builtin-pages?)
        excluded-pages?' (rum/react *excluded-pages?)
        journal? (if (nil? journal?') journal? journal?')
        orphan-pages? (if (nil? orphan-pages?') orphan-pages? orphan-pages?')
        builtin-pages? (if (nil? builtin-pages?') builtin-pages? builtin-pages?')
        excluded-pages? (if (nil? excluded-pages?') excluded-pages? excluded-pages?')
        set-setting! (fn [key value]
                       (let [new-settings (assoc settings key value)]
                         (config-handler/set-config! :graph/settings new-settings)))
        search-graph-filters (state/sub :search/graph-filters)
        focus-nodes (rum/react *focus-nodes)]
    [:div.absolute.top-4.right-4.graph-filters
     [:div.flex.flex-col
      [:div.shadow-xl.rounded-sm
       [:ul
        (graph-filter-section
         [:span.font-medium "Nodes"]
         (fn [open?]
           (filter-expand-area
            open?
            [:div
             [:p.text-sm.opacity-70.px-4
              (let [c1 (count (:nodes graph))
                    s1 (if (> c1 1) "s" "")
                    ;; c2 (count (:links graph))
                    ;; s2 (if (> c2 1) "s" "")
                    ]
                ;; (util/format "%d page%s, %d link%s" c1 s1 c2 s2)
                (util/format "%d page%s" c1 s1))]
             [:div.p-6
              ;; [:div.flex.items-center.justify-between.mb-2
              ;;  [:span "Layout"]
              ;;  (ui/select
              ;;    (mapv
              ;;     (fn [item]
              ;;       (if (= (:label item) layout)
              ;;         (assoc item :selected "selected")
              ;;         item))
              ;;     [{:label "gForce"}
              ;;      {:label "dagre"}])
              ;;    (fn [value]
              ;;      (set-setting! :layout value))
              ;;    "graph-layout")]
              [:div.flex.items-center.justify-between.mb-2
               [:span (t :settings-page/enable-journals)]
               ;; FIXME: why it's not aligned well?
               [:div.mt-1
                (ui/toggle journal?
                           (fn []
                             (let [value (not journal?)]
                               (reset! *journal? value)
                               (set-setting! :journal? value)))
                           true)]]
              [:div.flex.items-center.justify-between.mb-2
               [:span "Orphan pages"]
               [:div.mt-1
                (ui/toggle orphan-pages?
                           (fn []
                             (let [value (not orphan-pages?)]
                               (reset! *orphan-pages? value)
                               (set-setting! :orphan-pages? value)))
                           true)]]
              [:div.flex.items-center.justify-between.mb-2
               [:span "Built-in pages"]
               [:div.mt-1
                (ui/toggle builtin-pages?
                           (fn []
                             (let [value (not builtin-pages?)]
                               (reset! *builtin-pages? value)
                               (set-setting! :builtin-pages? value)))
                           true)]]
              [:div.flex.items-center.justify-between.mb-2
               [:span "Excluded pages"]
               [:div.mt-1
                (ui/toggle excluded-pages?
                           (fn []
                             (let [value (not excluded-pages?)]
                               (reset! *excluded-pages? value)
                               (set-setting! :excluded-pages? value)))
                           true)]]
              (when (seq focus-nodes)
                [:div.flex.flex-col.mb-2
                 [:p {:title "N hops from selected nodes"}
                  "N hops from selected nodes"]
                 (ui/tippy {:html [:div.pr-3 n-hops]}
                           (ui/slider (or n-hops 10)
                                      {:min 1
                                       :max 10
                                       :on-change #(reset! *n-hops (int %))}))])

              [:a.opacity-70.opacity-100 {:on-click (fn []
                                                      (swap! *graph-reset? not)
                                                      (reset! *focus-nodes [])
                                                      (reset! *n-hops nil)
                                                      (state/clear-search-filters!))}
               "Reset Graph"]]]))
         {})
        (graph-filter-section
         [:span.font-medium "Search"]
         (fn [open?]
           (filter-expand-area
            open?
            [:div.p-6
             (if (seq search-graph-filters)
               [:div
                (for [q search-graph-filters]
                  [:div.flex.flex-row.justify-between.items-center.mb-2
                   [:span.font-medium q]
                   [:a.search-filter-close.opacity-70.opacity-100 {:on-click #(state/remove-search-filter! q)}
                    svg/close]])

                [:a.opacity-70.opacity-100 {:on-click state/clear-search-filters!}
                 "Clear All"]]
               [:a.opacity-70.opacity-100 {:on-click #(route-handler/go-to-search! :graph)}
                "Click to search"])]))
         {:search-filters search-graph-filters})]]]]))

(defonce last-node-position (atom nil))
(defn- graph-register-handlers
  [graph focus-nodes n-hops dark?]
  (.on graph "nodeClick"
       (fn [event node]
         (let [x (.-x event)
               y (.-y event)
               drag? (not= [node x y] @last-node-position)]
           (graph/on-click-handler graph node event focus-nodes n-hops drag? dark?))))
  (.on graph "nodeMousedown"
       (fn [event node]
         (reset! last-node-position [node (.-x event) (.-y event)]))))

(rum/defc global-graph-inner < rum/reactive
  [graph settings theme]
  (let [[width height] (rum/react layout)
        dark? (= theme "dark")
        n-hops (rum/react *n-hops)
        reset? (rum/react *graph-reset?)
        focus-nodes (when n-hops (rum/react *focus-nodes))
        graph (if (and (integer? n-hops)
                       (seq focus-nodes)
                       (not (:orphan-pages? settings)))
                (graph-handler/n-hops graph focus-nodes n-hops)
                graph)
        graph (update graph :links (fn [links]
                                     (let [nodes (set (map :id (:nodes graph)))]
                                       (remove (fn [link]
                                                 (and (not (nodes (:source link)))
                                                      (not (nodes (:target link)))))
                                               links))))]
    [:div.relative#global-graph
     (graph/graph-2d {:nodes (:nodes graph)
                      :links (:links graph)
                      :width (- width 24)
                      :height (- height 48)
                      :dark? dark?
                      :register-handlers-fn
                      (fn [graph]
                        (graph-register-handlers graph *focus-nodes *n-hops dark?))
                      :reset? reset?})
     (graph-filters graph settings n-hops)]))

(defn- filter-graph-nodes
  [nodes filters]
  (if (seq filters)
    (let [filter-patterns (map #(re-pattern (str "(?i)" (util/regex-escape %))) filters)]
      (filter (fn [node] (some #(re-find % (:id node)) filter-patterns)) nodes))
    nodes))

(rum/defcs global-graph < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "resize"
                    (fn [_e]
                      (reset! layout [js/window.innerWidth js/window.innerHeight])))))
  {:will-mount (fn [state]
                 (state/set-search-mode! :graph)
                 state)
   :will-unmount (fn [state]
                   (reset! *n-hops nil)
                   (reset! *focus-nodes [])
                   (state/set-search-mode! :global)
                   state)}
  [state]
  (let [settings (state/graph-settings)
        theme (state/sub :ui/theme)
        graph (graph-handler/build-global-graph theme settings)
        search-graph-filters (state/sub :search/graph-filters)
        graph (update graph :nodes #(filter-graph-nodes % search-graph-filters))]
    (global-graph-inner graph settings theme)))

(rum/defc page-graph-inner < rum/reactive
  [_page graph dark?]
   (let [ show-journals-in-page-graph? (rum/react *show-journals-in-page-graph?) ]
  [:div.sidebar-item.flex-col
             [:div.flex.items-center.justify-between.mb-0
              [:span (t :right-side-bar/show-journals)]
              [:div.mt-1
               (ui/toggle show-journals-in-page-graph? ;my-val;
                           (fn []
                             (let [value (not show-journals-in-page-graph?)]
                               (reset! *show-journals-in-page-graph? value)
                               ))
                          true)]
              ]

   (graph/graph-2d {:nodes (:nodes graph)
                    :links (:links graph)
                    :width 600
                    :height 600
                    :dark? dark?
                    :register-handlers-fn
                    (fn [graph]
                      (graph-register-handlers graph (atom nil) (atom nil) dark?))})]))

(rum/defc page-graph < db-mixins/query rum/reactive
  []
  (let [page (or
              (and (= :page (state/sub [:route-match :data :name]))
                   (state/sub [:route-match :path-params :name]))
              (date/today))
        theme (:ui/theme @state/state)
        dark? (= theme "dark")
        show-journals-in-page-graph (rum/react *show-journals-in-page-graph?)
        graph (if (util/uuid-string? page)
                (graph-handler/build-block-graph (uuid page) theme)
                (graph-handler/build-page-graph page theme show-journals-in-page-graph))]
    (when (seq (:nodes graph))
      (page-graph-inner page graph dark?))))

(defn- sort-pages-by
  [by-item desc? pages]
  (let [comp (if desc? > <)
        by-item (if (= by-item :block/name)
                  (fn [x] (string/lower-case (:block/name x)))
                  by-item)]
    (sort-by by-item comp pages)))

(rum/defc checkbox-opt
  [key checked opts]

  (let [*input (rum/create-ref)
        indeterminate? (boolean (:indeterminate opts))]

    (rum/use-effect!
     #(set! (.-indeterminate (rum/deref *input)) indeterminate?)
     [indeterminate?])

    [:label {:for key}
     [:input.form-checkbox
      (merge {:type    "checkbox"
              :checked (boolean checked)
              :ref *input
              :id      key} opts)]]))

(rum/defc sortable-title
  [title key by-item desc?]
  [:th
   {:class [(name key)]}
   [:a.fade-link {:on-click (fn []
                    (reset! by-item key)
                    (swap! desc? not))}
    [:span.flex.items-center
     [:span.mr-1 title]
     (when (= @by-item key)
       [:span
        (if @desc? (svg/caret-down) (svg/caret-up))])]]])

(defn batch-delete-dialog
  [pages orphaned-pages? refresh-fn]
  (fn [close-fn]
    [:div
     [:div.sm:flex.items-center
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-red-100.sm:mx-0.sm:h-10.sm:w-10
       [:span.text-red-600.text-xl
        (ui/icon "alert-triangle")]]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium
        (if orphaned-pages?
          (str (t :remove-orphaned-pages) "?")
          (t :page/delete-confirmation))]]]

     [:table.table-auto.cp__all_pages_table.mt-4
      [:thead
       [:tr.opacity-70
        [:th [:span "#"]]
        [:th [:span (t :block/name)]]
        [:th [:span (t :page/backlinks)]]
        (when-not orphaned-pages? [:th [:span (t :page/created-at)]])
        (when-not orphaned-pages? [:th [:span (t :page/updated-at)]])]]

      [:tbody
       (for [[n {:block/keys [name created-at updated-at backlinks] :as page}] (medley/indexed pages)]
         [:tr {:key name}
          [:td.n.w-12 [:span.opacity-70 (str (inc n) ".")]]
          [:td.name [:a {:href     (rfe/href :page {:name (:block/name page)})}
                     (component-block/page-cp {} page)]]
          [:td.backlinks [:span (or backlinks "0")]]
          (when-not orphaned-pages? [:td.created-at [:span (if created-at (date/int->local-time-2 created-at) "Unknown")]])
          (when-not orphaned-pages? [:td.updated-at [:span (if updated-at (date/int->local-time-2 updated-at) "Unknown")]])])]]

     [:div.pt-6.flex.justify-end

      [:span.pr-2
       (ui/button
         (t :cancel)
         :intent "logseq"
         :on-click close-fn)]

      (ui/button
        (t :yes)
        :on-click (fn []
                    (close-fn)
                    (doseq [page-name (map :block/name pages)]
                      (page-handler/delete! page-name #()))
                    (notification/show! (str (t :tips/all-done) "!") :success)
                    (js/setTimeout #(refresh-fn) 200)))]]))

(rum/defcs ^:large-vars/cleanup-todo all-pages < rum/reactive
  (rum/local nil ::pages)
  (rum/local nil ::search-key)
  (rum/local nil ::results-all)
  (rum/local nil ::results)
  (rum/local {} ::checks)
  (rum/local :block/updated-at ::sort-by-item)
  (rum/local true ::desc?)
  (rum/local false ::journals)
  (rum/local nil ::filter-fn)
  (rum/local 1 ::current-page)
  [state]
  (let [current-repo (state/sub :git/current-repo)
        per-page-num 40
        *sort-by-item (get state ::sort-by-item)
        *desc? (::desc? state)
        *journal? (::journals state)
        *results (::results state)
        *results-all (::results-all state)
        *checks (::checks state)
        *pages (::pages state)
        *current-page (::current-page state)
        *filter-fn (::filter-fn state)
        *search-key (::search-key state)
        *search-input (rum/create-ref)

        *indeterminate (rum/derived-atom
                           [*checks] ::indeterminate
                         (fn [checks]
                           (when-let [checks (vals checks)]
                             (if (every? true? checks)
                               1 (if (some true? checks) -1 0)))))

        mobile? (util/mobile?)
        total-pages (if-not @*results-all 0
                            (js/Math.ceil (/ (count @*results-all) per-page-num)))
        to-page (fn [page]
                  (when (> total-pages 1)
                    (if (and (> page 0)
                             (<= page total-pages))
                      (reset! *current-page page)
                      (reset! *current-page 1))
                    (js/setTimeout #(util/scroll-to-top))))

        search-key (fn [key]
                     (when-let [key (and key (string/trim key))]
                       (if (and (not (string/blank? key))
                                (seq @*results))
                         (reset! *search-key key)
                         (reset! *search-key nil))))

        refresh-pages #(do
                         (reset! *pages nil)
                         (reset! *current-page 1))]

    [:div.flex-1.cp__all_pages
     [:h1.title (t :all-pages)]

     [:div.text-sm.ml-1.opacity-70.mb-4 (t :paginates/pages (count @*results-all))]

     (when current-repo

       ;; all pages
       (when (nil? @*pages)
         (let [pages (->> (page-handler/get-all-pages current-repo)
                          (map-indexed (fn [idx page] (assoc page
                                                             :block/backlinks (count (:block/_refs (db/entity (:db/id page))))
                                                             :block/idx idx))))]
           (reset! *filter-fn
                   (memoize (fn [sort-by-item desc? journal?]
                              (->> pages
                                   (filter #(or (boolean journal?)
                                                (= false (boolean (:block/journal? %)))))
                                   (sort-pages-by sort-by-item desc?)))))
           (reset! *pages pages)))

       ;; filter results
       (when @*filter-fn
         (let [pages (@*filter-fn @*sort-by-item @*desc? @*journal?)

               ;; search key
               pages (if-not (string/blank? @*search-key)
                       (search/fuzzy-search pages (util/page-name-sanity-lc @*search-key)
                                            :limit 20
                                            :extract-fn :block/name)
                       pages)

               _ (reset! *results-all pages)

               pages (take per-page-num (drop (* per-page-num (dec @*current-page)) pages))]

           (reset! *checks (into {} (for [{:block/keys [idx]} pages]
                                      [idx (boolean (get @*checks idx))])))
           (reset! *results pages)))

       (let [has-prev? (> @*current-page 1)
             has-next? (not= @*current-page total-pages)]
         [:div
         [:div.actions
          {:class (util/classnames [{:has-selected (or (nil? @*indeterminate)
                                                       (not= 0 @*indeterminate))}])}
          [:div.l.flex.items-center
           [:div.actions-wrap
            (ui/button
              [(ui/icon "trash" {:style {:font-size 15}}) (t :delete)]
              :on-click (fn []
                          (let [selected (filter (fn [[_ v]] v) @*checks)
                                selected (and (seq selected)
                                              (into #{} (for [[k _] selected] k)))]
                            (when-let [pages (and selected (filter #(contains? selected (:block/idx %)) @*results))]
                              (state/set-modal! (batch-delete-dialog pages false #(do
                                                                                    (reset! *checks nil)
                                                                                    (refresh-pages)))))))
              :class "fade-link"
              :small? true)]

           [:div.search-wrap.flex.items-center.pl-2
            (let [search-fn (fn []
                              (let [^js input (rum/deref *search-input)]
                                (search-key (.-value input))
                                (reset! *current-page 1)))
                  reset-fn (fn []
                             (let [^js input (rum/deref *search-input)]
                               (set! (.-value input) "")
                               (reset! *search-key nil)))]

              [(ui/button (ui/icon "search")
                 :on-click search-fn
                 :small? true)
               [:input.form-input {:placeholder   (t :search/page-names)
                                   :on-key-up     (fn [^js e]
                                                    (let [^js target (.-target e)]
                                                      (if (string/blank? (.-value target))
                                                        (reset! *search-key nil)
                                                        (cond
                                                          (= 13 (.-keyCode e)) (search-fn)
                                                          (= 27 (.-keyCode e)) (reset-fn)))))
                                   :ref           *search-input
                                   :default-value ""}]

               (when (not (string/blank? @*search-key))
                 [:a.cancel {:on-click reset-fn}
                  (ui/icon "x")])])]]

          [:div.r.flex.items-center.justify-between
           [:div
            (ui/tippy
             {:html  [:small (str (t :page/show-journals) " ?")]
              :arrow true}
             [:a.button.journal
              {:class    (util/classnames [{:active (boolean @*journal?)}])
               :on-click #(reset! *journal? (not @*journal?))}
              (ui/icon "calendar" {:style {:fontSize ui/icon-size}})])]

           [:div.paginates
            [:span.flex.items-center
             {:class (util/classnames [{:is-first (= 1 @*current-page)
                                        :is-last  (= @*current-page total-pages)}])}
             (when has-prev?
               [:a.py-4.pr-2.fade-link {:on-click #(to-page (dec @*current-page))} (ui/icon "caret-left") (str " " (t :paginates/prev))])
             [:span.opacity-60 (str @*current-page "/" total-pages)]
             (when has-next?
               [:a.py-4.pl-2.fade-link {:on-click #(to-page (inc @*current-page))} (str (t :paginates/next) " ") (ui/icon "caret-right")])]]

           (ui/dropdown-with-links
            (fn [{:keys [toggle-fn]}]
              [:a.button.fade-link
               {:on-click toggle-fn}
               (ui/icon "dots" {:style {:fontSize ui/icon-size}})])
            [{:title (t :remove-orphaned-pages)
              :options {:on-click (fn []
                                    (let [orphaned-pages (model/get-orphaned-pages {})
                                          orphaned-pages? (seq orphaned-pages)]
                                      (if orphaned-pages?
                                        (state/set-modal!
                                         (batch-delete-dialog
                                          orphaned-pages  true
                                          #(do
                                             (reset! *checks nil)
                                             (refresh-pages))))
                                        (notification/show! "Congratulations, no orphaned pages in your graph!" :success))))}
              :icon (ui/icon "file-x")}
             {:title (t :all-files)
              :options {:href (rfe/href :all-files)}
              :icon (ui/icon "files")}]
            {})]]

         [:table.table-auto.cp__all_pages_table
          [:thead
           [:tr
            [:th.selector
             (checkbox-opt "all-pages-select-all"
                           (= 1 @*indeterminate)
                           {:on-change     (fn []
                                             (let [indeterminate? (= -1 @*indeterminate)
                                                   all? (= 1 @*indeterminate)]
                                               (doseq [{:block/keys [idx]} @*results]
                                                 (swap! *checks assoc idx (or indeterminate? (not all?))))))
                            :indeterminate (= -1 @*indeterminate)})]

            (sortable-title (t :block/name) :block/name *sort-by-item *desc?)
            (when-not mobile?
              [(sortable-title (t :page/backlinks) :block/backlinks *sort-by-item *desc?)
               (sortable-title (t :page/created-at) :block/created-at *sort-by-item *desc?)
               (sortable-title (t :page/updated-at) :block/updated-at *sort-by-item *desc?)])]]

          [:tbody
           (for [{:block/keys [idx name created-at updated-at backlinks] :as page} @*results]
             (when-not (string/blank? name)
               [:tr {:key name}
                [:td.selector
                 (checkbox-opt (str "label-" idx)
                               (get @*checks idx)
                               {:on-change (fn []
                                             (swap! *checks update idx not))})]

                [:td.name [:a {:on-click (fn [e]
                                           (let [repo (state/get-current-repo)]
                                             (when (gobj/get e "shiftKey")
                                               (state/sidebar-add-block!
                                                repo
                                                (:db/id page)
                                                :page))))
                               :href     (rfe/href :page {:name (:block/name page)})}
                           (component-block/page-cp {} page)]]

                (when-not mobile?
                  [:td.backlinks [:span backlinks]])

                (when-not mobile?
                  [:td.created-at [:span (if created-at
                                           (date/int->local-time-2 created-at)
                                           "Unknown")]])
                (when-not mobile?
                  [:td.updated-at [:span (if updated-at
                                           (date/int->local-time-2 updated-at)
                                           "Unknown")]])]))]]

         [:div.paginates
          [:span]
          [:span.flex.items-center
           (when has-prev?
             [:a.py-4.text-sm.fade-link {:on-click #(to-page (dec @*current-page))} (ui/icon "caret-left") (str " " (t :paginates/prev))])
           (when has-next?
             [:a.py-4.pl-2.text-sm.fade-link {:on-click #(to-page (inc @*current-page))} (str (t :paginates/next) " ") (ui/icon "caret-right")])]]]))]))
