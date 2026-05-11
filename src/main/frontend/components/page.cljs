(ns frontend.components.page
  (:require [clojure.string :as string]
            [dommy.core :as dom]
            [frontend.components.block :as component-block]
            [frontend.components.class :as class-component]
            [frontend.components.content :as content]
            [frontend.components.db-based.page :as db-page]
            [frontend.components.editor :as editor]
            [frontend.components.graph-actions :as graph-actions]
            [frontend.components.library :as library]
            [frontend.components.objects :as objects]
            [frontend.components.plugins :as plugins]
            [frontend.components.property.config :as property-config]
            [frontend.components.query :as query]
            [frontend.components.recycle :as recycle]
            [frontend.components.reference :as reference]
            [frontend.components.scheduled-deadlines :as scheduled]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.model :as model]
            [frontend.extensions.graph :as graph]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [goog.object :as gobj]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.db :as db-db]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(defn- get-page-name
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

;; Named block links only works on web (and publishing)
(if util/web-platform?
  (defn- get-block-uuid-by-block-route-name
    "Return string block uuid for matching :name and :block-route-name params or
    nil if not found"
    [state]
    ;; Only query if block name is in the route
    (when-let [route-name (get-in (first (:rum/args state))
                                  [:parameters :path :block-route-name])]
      (->> (model/get-block-by-page-name-and-block-route-name
            (state/get-current-repo)
            (get-page-name state)
            route-name)
           :block/uuid
           str)))
  (def get-block-uuid-by-block-route-name (constantly nil)))

(defn- open-root-block!
  [state]
  (let [[_ block _ sidebar? preview?] (:rum/args state)]
    (when (and
           (or preview?
               (not (contains? #{:home :all-journals} (state/get-current-route))))
           (not sidebar?))
      (when (and (string/blank? (:block/title block))
                 (not preview?))
        (editor-handler/edit-block! block :max)))))

(rum/defc page-blocks-inner <
  {:did-mount (fn [state]
                (open-root-block! state)
                state)}
  [page-e blocks config sidebar? _preview? _block-uuid]
  (when page-e
    (let [hiccup (component-block/->hiccup blocks config {})]
      [:div.page-blocks-inner {:style {:min-height 29}}
       (rum/with-key
         (content/content (str (:block/uuid page-e))
                          {:hiccup   hiccup
                           :sidebar? sidebar?})
         (str (:block/uuid page-e) "-hiccup"))])))

(declare page-cp)

(rum/defc add-button-inner
  [block {:keys [container-id editing?] :as config*}]
  (let [*ref (rum/use-ref nil)
        has-children? (:block/_parent block)
        page? (ldb/page? block)
        opacity-class (cond
                        (and editing? has-children?) "opacity-0"
                        (and (util/mobile?)
                             (or (some-> (:block/title (last (ldb/sort-by-order (:block/_parent block)))) string/blank?)
                                 (and (not has-children?) (string/blank? (:block/title block)))))
                        "opacity-0"
                        (util/mobile?) "opacity-50"
                        has-children? "opacity-0"
                        :else "opacity-50")
        config (dissoc config* :page)]
    (when (or page? (util/mobile?))
      [:div.ls-block.block-add-button.flex-1.flex-col.rounded-sm.cursor-text.transition-opacity.ease-in.duration-100.!py-0
       {:class opacity-class
        :parentblockid (:db/id block)
        :ref *ref
        :on-click (fn [e]
                    (when-not (and (util/mobile?) editing?)
                      (util/stop e)
                      (state/set-state! :editor/container-id container-id)
                      (editor-handler/api-insert-new-block! "" (merge config
                                                                      {:block-uuid (:block/uuid block)}))))
        :on-mouse-over (fn []
                         (when-not (and (util/mobile?) editing?)
                           (let [ref (rum/deref *ref)
                                 prev-block (util/get-prev-block-non-collapsed (rum/deref *ref) {:up-down? true})]
                             (cond
                               (and prev-block (dom/has-class? prev-block "is-blank"))
                               (dom/add-class! ref "opacity-0")
                               (and prev-block has-children?)
                               (dom/add-class! ref "opacity-50")
                               :else
                               (dom/add-class! ref "opacity-100")))))
        :on-mouse-leave #(do
                           (dom/remove-class! (rum/deref *ref) "opacity-50")
                           (dom/remove-class! (rum/deref *ref) "opacity-100"))
        :on-key-down (fn [^js e]
                       (util/stop e)
                       (when (= "Enter" (util/ekey e))
                         (-> e (.-target) (.click))))
        :tab-index 0}
       [:div.flex.flex-row
        [:div.flex.items-center {:style {:height 28
                                         :margin-left (if (util/mobile?)
                                                        (if page? 0 18)
                                                        22)}}
         [:span.bullet-container
          [:span.bullet]]]]])))

(rum/defc add-button < rum/reactive
  [block config]
  (let [editing? (state/sub :editor/editing?)]
    (add-button-inner block (assoc config :editing? editing?))))

(rum/defcs page-blocks-cp < rum/reactive db-mixins/query
  {:did-mount (fn [state]
                (when-let [on-page-blocks-rendered (some-> (last (:rum/args state))
                                                           :on-page-blocks-rendered)]
                  (on-page-blocks-rendered))
                state)
   :did-update (fn [state]
                 (when-let [on-page-blocks-rendered (some-> (last (:rum/args state))
                                                            :on-page-blocks-rendered)]
                  (on-page-blocks-rendered))
                state)}
  [state block* {:keys [sidebar? hide-add-button? journals?] :as config}]
  (when-let [id (:db/id block*)]
    (let [block (db/sub-block id)
          block-id (:block/uuid block)
          block? (not (db/page? block))
          full-children (->> (:block/_parent block)
                             ldb/sort-by-order)
          mobile-length-limit 50
          [children more?] (if (and (> (count full-children) mobile-length-limit) (util/mobile?) journals?)
                             [(take mobile-length-limit full-children) true]
                             [full-children false])
          quick-add-page-id (:db/id (db-db/get-built-in-page (db/get-db) common-config/quick-add-page-name))
          children (cond
                     (and (= id quick-add-page-id)
                          (user-handler/user-uuid)
                          (ldb/get-graph-rtc-uuid (db/get-db)))
                     (editor-handler/get-user-quick-add-blocks)

                     (ldb/class? block)
                     (remove (fn [b] (contains? (set (map :db/id (:block/tags b))) (:db/id block))) children)

                     (ldb/property? block)
                     (remove (fn [b] (some? (get b (:db/ident block)))) children)

                     :else
                     children)
          config (assoc config :library? (ldb/library? block))]
      (cond
        (and
         (not block?)
         (not config/publishing?)
         (empty? children) block)
        (add-button block config)

        :else
        (let [document-mode? (state/sub :document/mode?)
              hiccup-config (merge
                             {:id (str (:block/uuid block))
                              :db/id (:db/id block)
                              :block? block?
                              :editor-box editor/box
                              :document/mode? document-mode?}
                             config)
              config (common-handler/config-with-document-mode hiccup-config)
              blocks (if block? [block] (db/sort-by-order children block))]
          [:div.relative
           (page-blocks-inner block blocks config sidebar? false block-id)
           (when more?
             (shui/button {:variant :ghost
                           :class "text-muted-foreground w-full"
                           :on-click (fn [] (route-handler/redirect-to-page! (:block/uuid block)))}
                          (t :ui/load-more)))
           (when-not more?
             (when-not hide-add-button?
               (add-button block config)))])))))

(rum/defc today-queries < rum/reactive
  [repo today? sidebar?]
  (when (and today? (not sidebar?))
    (let [queries (get-in (state/sub-config repo) [:default-queries :journals])]
      (when (seq queries)
        [:div#today-queries
         (for [query queries]
           (let [query' (assoc query :collapsed? true)]
             (rum/with-key
               (ui/catch-error
                (ui/component-error (t :page/default-query-error) {:content (pr-str query')})
                (query/custom-query (component-block/wrap-query-components
                                     {:editor-box editor/box
                                      :page page-cp
                                      :built-in-query? true
                                      :today-query? true})
                                    query'))
               (str repo "-custom-query-" (:query query')))))]))))

(rum/defc db-page-title-actions
  [page]
  [:div.ls-page-title-actions
   [:div.flex.flex-row.items-center.gap-2
    (when-not (:logseq.property/icon (db/entity (:db/id page)))
      (shui/button
       {:variant :ghost
        :size :sm
        :class "px-2 py-0 h-6 text-xs text-muted-foreground"
        :on-click (fn [e]
                    (state/pub-event! [:editor/new-property {:property-key "Icon"
                                                             :block page
                                                             :target (.-target e)}]))}
       (t :command.editor/add-property-icon)))

    (shui/button
     {:variant :ghost
      :size :sm
      :class "px-2 py-0 h-6 text-xs text-muted-foreground"
      :on-click (fn [e]
                  (if (ldb/property? page)
                    (shui/popup-show!
                     (.-target e)
                     (fn []
                       [:div.ls-property-dropdown
                        (property-config/property-dropdown page nil {})])
                     {:align :center
                      :as-dropdown? true
                      :dropdown-menu? true})
                    (let [opts (cond-> {:block page :target (.-target e)}
                                 (ldb/class? page)
                                 (assoc :class-schema? true))]
                      (state/pub-event! [:editor/new-property opts]))))}
     (cond
       (ldb/class? page)
       (t :class/add-property)
       (ldb/property? page)
       (t :ui/configure)
       :else
       (t :property/set-property)))]])

(rum/defc db-page-title
  [page {:keys [sidebar? journals? container-id tag-dialog? display-title]}]
  (let [with-actions? (not config/publishing?)]
    [:div.ls-page-title.flex.flex-1.w-full.content.items-start.title
     {:class "title"
      "data-testid" "page title"
      :on-pointer-down (fn [e]
                         (when (util/right-click? e)
                           (state/set-state! :page-title/context {:page (:block/title page)
                                                                  :page-entity page})))}

     [:div.w-full.relative
      (component-block/block-container
       {:id (str (:block/uuid page))
        :page-title? true
        :page-title-actions-cp (when (and with-actions?
                                          (not (util/mobile?))
                                          (not= (:db/id (state/get-edit-block)) (:db/id page)))
                                 db-page-title-actions)
        :hide-title? sidebar?
        :sidebar? sidebar?
        :tag-dialog? tag-dialog?
        :display-title display-title
        :hide-children? true
        :container-id container-id
        :show-tag-and-property-classes? true
        :journal-page? (ldb/journal? page)
        :on-title-click (fn [e]
                          (cond
                            (gobj/get e "shiftKey")
                            (state/sidebar-add-block!
                             (state/get-current-repo)
                             (:db/id page)
                             :page)
                            (and (util/mobile?) journals?)
                            (route-handler/redirect-to-page! (:block/uuid page))
                            :else
                            nil))}
       page)]]))

(defn- get-path-page-name
  [state page-name]
  (or page-name
      (get-block-uuid-by-block-route-name state)
      ;; is page name or uuid
      (get-page-name state)
      (state/get-current-page)))

(defn get-page-entity
  [page-name]
  (cond
    (uuid? page-name)
    (db/entity [:block/uuid page-name])

    (common-util/uuid-string? page-name)
    (db/entity [:block/uuid (uuid page-name)])

    :else
    (db/get-page page-name)))

(defn- get-sanity-page-name
  [state page-name]
  (when-let [path-page-name (get-path-page-name state page-name)]
    (util/page-name-sanity-lc path-page-name)))

(rum/defcs on-mounted <
  {:did-mount (fn [state]
                (when-let [f (last (:rum/args state))]
                  (f))
                state)
   :did-update (fn [state]
                 (when-let [f (last (:rum/args state))]
                  (f))
                state)}
  [state child _on-mounted]
  child)

(rum/defc lsp-pagebar-slot <
  rum/static
  []
  (when (not config/publishing?)
    (when config/lsp-enabled?
      [:div.flex.flex-row
       (plugins/hook-ui-slot :page-head-actions-slotted nil)
       (plugins/hook-ui-items :pagebar)])))

(rum/defc tabs < rum/static
  [page opts]
  (let [class? (ldb/class? page)
        property? (ldb/property? page)
        both? (and class? property?)
        default-tab (cond
                      both?
                      "tag"
                      class?
                      "tag"
                      :else
                      "property")]
    [:div.page-tabs
     (shui/tabs
      {:defaultValue default-tab
       :class "w-full"}
      (when both?
        [:div.flex.flex-row.gap-1.items-center
         (shui/tabs-list
          {:class "h-8"}
          (when class?
            (shui/tabs-trigger
             {:value "tag"
              :class "py-1 text-xs"}
             (t :class/tagged-nodes)))
          (when property?
            (shui/tabs-trigger
             {:value "property"
              :class "py-1 text-xs"}
             (t :property/nodes-with-property)))
          (when property?
            (db-page/configure-property page)))])

      (when class?
        (shui/tabs-content
         {:value "tag"}
         (on-mounted (objects/class-objects page opts)
                     (:on-tagged-nodes-rendered opts))))
      (when property?
        (shui/tabs-content
         {:value "property"}
         (on-mounted (objects/property-related-objects page opts)
                     (:on-tagged-nodes-rendered opts)))))]))

(rum/defc sidebar-page-properties
  [config page]
  (let [[collapsed? set-collapsed!] (rum/use-state (not (ldb/class? page)))]
    [:div.ls-sidebar-page-properties.flex.flex-col.gap-2.mt-2
     [:div
      (shui/button
       {:variant :ghost
        :size :sm
        :class "px-1 text-muted-foreground"
        :on-click #(set-collapsed! (not collapsed?))}
       [:span.text-xs (t (if collapsed? :page/open-properties :page/hide-properties))])]

     (when-not collapsed?
       [:<>
        (component-block/db-properties-cp config page {:sidebar-properties? true})
        [:hr.my-4]])]))

;; A page is just a logical block
(rum/defcs ^:large-vars/cleanup-todo page-inner < rum/reactive db-mixins/query mixins/container-id
  (rum/local nil   ::current-page)
  (rum/local nil   ::linked-refs-blocks-ready-page-id)
  (rum/local nil   ::linked-refs-tagged-ready-page-id)
  [state {:keys [repo page preview? sidebar? tag-dialog? linked-refs? unlinked-refs? config journals?] :as option}]
  (let [current-repo (state/sub :git/current-repo)
        linked-refs-blocks-ready-page-id (get state ::linked-refs-blocks-ready-page-id)
        linked-refs-tagged-ready-page-id (get state ::linked-refs-tagged-ready-page-id)
        page (or page (some-> (:db/id option) db/entity))
        page-id (:db/id page)
        config (assoc config
                      :id (str (:block/uuid page)))
        repo (or repo current-repo)
        block? (some? (:block/page page))
        class-page? (ldb/class? page)
        property-page? (ldb/property? page)
        title (:block/title page)
        journal? (db/journal-page? title)
        recycle-page? (and (ldb/page? page)
                           (= title common-config/recycle-page-name))
        fmt-journal? (boolean (date/journal-title->int title))
        today? (model/today-journal-page? page)
        home? (= :home (state/get-current-route))
        recycled? (ldb/recycled? page)
        page-display-title (when (ldb/page? page)
                             (route-handler/built-in-page-title (:block/title page)))
        show-tabs? (and (or class-page? (ldb/property? page)) (not tag-dialog?))
        blocks-ready? (or journals?
                          (= page-id @linked-refs-blocks-ready-page-id))
        tagged-ready? (or (not show-tabs?)
                          (= page-id @linked-refs-tagged-ready-page-id)
                          ;; Fallback to avoid blocking refs forever when tab content is reused.
                          (= page-id @linked-refs-blocks-ready-page-id))
        linked-refs-ready? (and blocks-ready? tagged-ready?)]
    (if page
      (when (or title block?)
        (if recycled?
          [:div.flex-1.page.relative.cp__page-inner-wrap
           [:div.relative.grid.gap-4.sm:gap-8.page-inner.mb-16
            [:div.opacity-75 (t :page/moved-to-recycle)]]]
          [:div.flex-1.page.relative.cp__page-inner-wrap
           (merge (if (seq (:block/tags page))
                    (let [page-names (map :block/title (:block/tags page))]
                      (when (seq page-names)
                        {:data-page-tags (text-util/build-data-value page-names)}))
                    {})

                {:key title
                 :class (util/classnames [{:is-journals (or journal? fmt-journal?)
                                           :is-today-page (and (not home?) (boolean today?))
                                           :is-node-page (or class-page? property-page?)}])})

           [:div.relative.grid.gap-4.sm:gap-8.page-inner.mb-16
            (when-not (or block? sidebar?)
              [:div.flex.flex-row.space-between
               (when (ldb/page? page)
                 (db-page-title page
                                {:sidebar? sidebar?
                                 :journals? journals?
                                 :container-id (:container-id state)
                                 :display-title page-display-title
                                 :tag-dialog? tag-dialog?}))
               (lsp-pagebar-slot)])

            (when (and block? (not sidebar?))
              (component-block/breadcrumb {} repo (:block/uuid page) {}))

            (when (ldb/library? page)
              (library/add-pages page))

            (when (and sidebar? (ldb/page? page))
              [:div.-mb-8
               (sidebar-page-properties config page)])

            (when show-tabs?
              (tabs page {:current-page? option
                          :sidebar? sidebar?
                          :on-tagged-nodes-rendered #(when-not (= @linked-refs-tagged-ready-page-id page-id)
                                                       (reset! linked-refs-tagged-ready-page-id page-id))}))

            (when (not tag-dialog?)
              (if recycle-page?
                (recycle/recycle-page page {:class "ls-recycle-page-title-compact"})
                [:div.ls-page-blocks
                 {:style {:margin-left (if (util/mobile?) 0 -20)}
                  :class (when-not (or sidebar? (util/capacitor?))
                           "mt-4")}
                 (page-blocks-cp page (merge option {:sidebar? sidebar?
                                                     :on-page-blocks-rendered #(when-not (= @linked-refs-blocks-ready-page-id page-id)
                                                                                 (reset! linked-refs-blocks-ready-page-id page-id))
                                                     :container-id (:container-id state)}))]))]

           (when-not (or preview? recycle-page?)
             [:div.flex.flex-col.gap-8
              {:class (when-not (util/mobile?) "ml-1")}
              (when today?
                (today-queries repo today? sidebar?))

              (when today?
                (scheduled/scheduled-and-deadlines title))

              (when (and (ldb/page? page) (:logseq.property.class/_extends page))
                (class-component/class-children page))

            ;; referenced blocks
              (when (and linked-refs-ready?
                         (not tag-dialog?)
                         (not linked-refs?))
                [:div.fade-in.delay {:key "page-references"}
                 (rum/with-key
                   (reference/references page {:sidebar? sidebar?
                                               :journals? journals?
                                               :refs-count (:refs-count option)
                                               :linked-refs-section? true})
                   (str title "-refs"))])

              (when-not (or unlinked-refs?
                            sidebar?
                            tag-dialog?
                            home?
                            class-page? property-page?)
                [:div.fade-in.delay {:key "page-unlinked-references"}
                 (reference/unlinked-references page {:sidebar? sidebar?})])])]))
      [:div.opacity-75 (t :page/not-found)])))

(rum/defcs page-aux < rum/reactive
  {:init (fn [state]
           (let [page* (first (:rum/args state))
                 page-name (:page-name page*)
                 page-id-uuid-or-name (or (:db/id page*) (:block/uuid page*)
                                          (get-sanity-page-name state page-name))
                 option (last (:rum/args state))
                 preview-or-sidebar? (or (:preview? option) (:sidebar? option))
                 page-uuid? (when page-name (util/uuid-string? page-name))
                 *loading? (atom true)
                 page (db/get-page page-id-uuid-or-name)
                 *page (atom page)
                 *refs-count (atom nil)
                 repo (state/get-current-repo)]
             (when (:block.temp/load-status page) (reset! *loading? false))
             (p/let [page-block (db-async/<get-block repo page-id-uuid-or-name)
                     page-id (:db/id page-block)
                     refs-count (when-not (or (ldb/class? page-block) (ldb/property? page-block))
                                  (db-async/<get-block-refs-count repo page-id))]
               (reset! *loading? false)
               (reset! *page (db/entity (:db/id page-block)))
               (reset! *refs-count refs-count)
               (when page-block
                 (when-not (or preview-or-sidebar? (:tag-dialog? option))
                   (if-let [page-uuid (and (not (:db/id page*))
                                           page-name
                                           (not page-uuid?)
                                           (:block/uuid page-block))]
                     (route-handler/redirect-to-page! (str page-uuid) {:push false})
                     (route-handler/update-page-title-and-label! (state/get-route-match))))))
             (assoc state
                    ::loading? *loading?
                    ::*page *page
                    ::*refs-count *refs-count)))
   :will-unmount (fn [state]
                   (state/set-state! :editor/virtualized-scroll-fn nil)
                   state)}
  [state option]
  (let [loading? (rum/react (::loading? state))
        page (rum/react (::*page state))
        refs-count (rum/react (::*refs-count state))]
    (when (and page (not loading?))
      (page-inner (assoc option
                         :page page
                         :refs-count refs-count)))))

(rum/defcs page-cp
  [state option]
  (let [page-name (or (:page-name option) (get-page-name state))]
    (rum/with-key
      (page-aux (assoc option :page-name page-name))
      (str
       (state/get-current-repo)
       "-"
       (or (:db/id option) page-name)))))

(rum/defc page-container
  [page-m option]
  (page-cp (merge option page-m)))

(rum/defc page-graph-inner < rum/reactive
  [_page graph dark?]
  [:div.page-graph-panel.flex.flex-col.w-full
   {:style {:height "min(72vh, 860px)"
            :min-height 560}}
   (graph/graph-2d {:nodes (:nodes graph)
                    :links (:links graph)
                    :dark? dark?
                    :view-mode :page
                    :show-arrows? true
                    :show-edge-labels? true
                    :aria-label (t :graph/canvas-label)
                    :on-node-activate graph-actions/activate-node!
                    :on-node-preview graph-actions/preview-node!})])

(rum/defc page-graph-aux
  [page opts]
  (let [[graph set-graph!] (hooks/use-state nil)
        dark? (contains? #{"dark" :dark} (:theme opts))]
    (hooks/use-effect!
     (fn []
       (p/let [result (state/<invoke-db-worker :thread-api/build-graph (state/get-current-repo) opts)]
         (set-graph! result)))
     [opts])
    (when (seq (:nodes graph))
      (page-graph-inner page graph dark?))))

(rum/defc page-graph < db-mixins/query rum/reactive
  []
  (let [current-page (or
                      (and (= :page (state/sub [:route-match :data :name]))
                           (state/sub [:route-match :path-params :name]))
                      (model/get-today-journal-title))
        theme (:ui/theme @state/state)
        page-entity (db/get-page current-page)]
    (page-graph-aux current-page
                    {:type (if (ldb/page? page-entity) :page :block)
                     :block/uuid (:block/uuid page-entity)
                     :theme theme
                     :show-journal? false})))

(defn batch-delete-dialog
  [pages refresh-fn]
  (fn [{:keys [close]}]
    [:div
     [:div.sm:flex.items-center
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-error.sm:mx-0.sm:h-10.sm:w-10
       [:span.text-error.text-xl
        (ui/icon "alert-triangle")]]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium
        (t :page.delete/batch-confirm-title)]]]

     [:ol.p-2.pt-4
      (for [page-item pages]
        [:li
         [:a {:href (rfe/href :page {:name (:block/uuid page-item)})}
          (component-block/page-cp {} page-item)]])]

     [:p.px-2.opacity-50 [:small (t :page.delete/total (count pages))]]

     [:div.pt-6.flex.justify-end.gap-4
      (ui/button
       (t :ui/cancel)
       :variant :outline
       :on-click close)

      (ui/button
       (t :ui/yes)
       :on-click (fn []
                   (close)
                   (let [failed-pages (atom [])]
                     (p/let [_ (p/all (map (fn [page]
                                             (page-handler/<delete! (:block/uuid page) nil
                                                                    {:error-handler
                                                                     (fn []
                                                                       (swap! failed-pages conj (:block/name page)))}))
                                           pages))]
                       (if (seq @failed-pages)
                         (notification/show! (t :page.delete/warning (string/join ", " (map pr-str @failed-pages)))
                                             :warning false)
                         (notification/show! (t :ui/all-done) :success))))
                   (js/setTimeout #(refresh-fn) 200)))]]))
