(ns frontend.components.page
  (:require [clojure.string :as string]
            [dommy.core :as dom]
            [frontend.components.block :as block]
            [frontend.components.class :as class-component]
            [frontend.components.db-based.page :as db-page]
            [frontend.components.editor :as editor]
            [frontend.components.graph-actions :as graph-actions]
            [frontend.components.library :as library]
            [frontend.components.objects :as objects]
            [frontend.components.plugins :as plugins]
            [frontend.components.property :as property-component]
            [frontend.components.property.config :as property-config]
            [frontend.components.query :as query]
            [frontend.components.recycle :as recycle]
            [frontend.components.reference :as reference]
            [frontend.components.scheduled-deadlines :as scheduled]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.db.hooks :as db-hooks]
            [frontend.extensions.graph :as graph]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.entity :as entity]
            [frontend.util.text :as text-util]
            [goog.object :as gobj]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]))

(defn- get-page-name
  [route-match]
  (get-in route-match [:parameters :path :name]))

(defn- get-block-route-name
  [route-match]
  (when util/web-platform?
    (get-in route-match [:parameters :path :block-route-name])))

(declare page-cp page-inner)

(hsx/defc add-button-inner
  [block child-uuids {:keys [container-id editing? block?] :as config*}]
  (let [*ref (hooks/use-ref nil)
        has-children? (seq child-uuids)
        page? (entity/page? block)
        opacity-class (cond
                        (and editing? has-children?) "opacity-0"
                        (and (util/mobile?)
                             (not has-children?)
                             (string/blank? (:block/title block)))
                        "opacity-0"
                        (util/mobile?) "opacity-50"
                        has-children? "opacity-0"
                        :else "opacity-50")
        config (dissoc config* :page)]
    (when (or page? block? (util/mobile?))
      [:div.ls-block.block-add-button.flex-1.flex-col.rounded-sm.cursor-text.transition-opacity.ease-in.duration-100.!py-0
       {:class (util/classnames [opacity-class
                                 {"ls-block-content-indent" block?}])
        :parentblockid (:db/id block)
        :ref *ref
        :on-click (fn [e]
                    (when-not (and (util/mobile?) editing?)
                      (util/stop e)
                      (state/set-state! :editor/container-id container-id)
                      (editor-handler/api-insert-new-block! "" (merge config
                                                                      (if page?
                                                                        {:page (:block/uuid block)}
                                                                        {:block-uuid (:block/uuid block)})))))
        :on-mouse-over (fn []
                         (when-not (and (util/mobile?) editing?)
                           (let [ref (hooks/deref *ref)
                                 prev-block (util/get-prev-block-non-collapsed (hooks/deref *ref) {:up-down? true})]
                             (cond
                               (and prev-block (dom/has-class? prev-block "is-blank"))
                               (dom/add-class! ref "opacity-0")
                               (and prev-block has-children?)
                               (dom/add-class! ref "opacity-50")
                               :else
                               (dom/add-class! ref "opacity-100")))))
        :on-mouse-leave #(do
                           (dom/remove-class! (hooks/deref *ref) "opacity-50")
                           (dom/remove-class! (hooks/deref *ref) "opacity-100"))
        :on-key-down (fn [^js e]
                       (util/stop e)
                       (when (= "Enter" (util/ekey e))
                         (-> e (.-target) (.click))))
        :tab-index 0}
       [:div.flex.flex-row
        [:div.flex.items-center {:style {:height 28
                                         :margin-left (cond
                                                        (and block? (not (util/mobile?))) 6
                                                        (util/mobile?) (if page? 0 18)
                                                        :else 22)}}
         [:span.bullet-container
          [:span.bullet]]]]])))

(hsx/defc add-button
  [block child-uuids config]
  (let [editing? (rfx/use-sub [:editor/editing?])]
    (add-button-inner block child-uuids (assoc config :editing? editing?))))

(defn page-membership-resource-key
  [page-uuid membership-kind user-uuid]
  (case membership-kind
    :normal nil
    :class [:page-membership page-uuid :class]
    :property [:page-membership page-uuid :property]
    :quick-add (when (uuid? user-uuid)
                 [:page-membership page-uuid :quick-add user-uuid])
    (throw (ex-info "Unsupported page membership kind"
                    {:membership-kind membership-kind}))))

(defn- page-membership-kind
  [page user-uuid]
  (cond
    (entity/class? page) :class
    (entity/property? page) :property
    (and (= (:block/title page) common-config/quick-add-page-name)
         (uuid? user-uuid)) :quick-add
    :else :normal))

(defn- page-render-config
  [page option document-mode?]
  (merge {:id (str (:block/uuid page))
          :db/id (:db/id page)
          :block? (not (entity/page? page))
          :editor-box editor/box
          :document/mode? document-mode?
          :library? (ldb/library? page)}
         option))

(defn- render-stable-page
  [page]
  (dissoc page :block/tx-id :block/updated-at))

(hsx/defc normal-page-root
  [page-uuid config hide-add-button?]
  (let [page (db-hooks/use-block-projection page-uuid render-stable-page)
        child-uuids (db-hooks/use-children page-uuid)]
    (when page
      [:div.page-blocks-inner.relative
       (when (seq child-uuids)
         (block/page-root-virtual-list config child-uuids))
       (when (and (not config/publishing?)
                  (or (empty? child-uuids)
                      (not hide-add-button?)))
         (add-button page child-uuids config))])))

(hsx/defc special-page-root
  [page-uuid membership-kind user-uuid config hide-add-button?]
  (let [page (db-hooks/use-block-projection page-uuid render-stable-page)
        membership-key (page-membership-resource-key page-uuid membership-kind user-uuid)
        child-uuids (db-hooks/use-resource membership-key)]
    (when page
      [:div.page-blocks-inner.relative
       (when (seq child-uuids)
         (block/page-root-virtual-list config child-uuids))
       (when (and (not config/publishing?)
                  (or (empty? child-uuids)
                      (not hide-add-button?)))
         (add-button page child-uuids config))])))

(hsx/defc block-route-root
  [block-uuid block config hide-add-button?]
  (let [child-uuids (db-hooks/use-children block-uuid)]
    [:div.page-blocks-inner.relative
     (block/plain-block-list config [block-uuid])
     (when-not hide-add-button?
       (add-button block child-uuids config))]))

(hsx/defc page-blocks-cp
  [page {:keys [hide-add-button? on-page-blocks-rendered] :as option}]
  (hooks/use-effect!
   (fn []
     (when on-page-blocks-rendered
       (on-page-blocks-rendered))))
  (let [document-mode? (rfx/use-sub [:document/mode?])
        config (page-render-config page option document-mode?)
        page-uuid (:block/uuid page)
        user-uuid-string (user-handler/user-uuid)
        user-uuid (when (and (string? user-uuid-string)
                             (util/uuid-string? user-uuid-string))
                    (uuid user-uuid-string))
        membership-kind (page-membership-kind page user-uuid)]
    (if (entity/page? page)
      (if (= :normal membership-kind)
        (normal-page-root page-uuid config hide-add-button?)
        (special-page-root page-uuid membership-kind user-uuid config
                           hide-add-button?))
      (block-route-root page-uuid page config hide-add-button?))))

(hsx/defc journal-page
  [journal-uuid option]
  (let [page (db-hooks/use-block-projection journal-uuid render-stable-page)
        child-uuids (db-hooks/use-children journal-uuid)
        document-mode? (rfx/use-sub [:document/mode?])]
    (when page
      (let [container-id (or (:container-id option)
                             (state/get-container-id [:journal-page journal-uuid]))
            config (assoc (page-render-config page option document-mode?)
                          :container-id container-id)
            page-blocks-content
            [:div.page-blocks-inner.relative
             (block/plain-block-list config child-uuids)
             (when-not (:hide-add-button? option)
               (add-button page child-uuids config))]]
        (page-inner (assoc option
                           :page page
                           :journals? true
                           :container-id container-id
                           :page-blocks-content page-blocks-content))))))

(hsx/defc today-queries
  [repo page today? sidebar?]
  (when (and today? (not sidebar?))
    (let [queries (get-in (state/config-for-repo (rfx/use-sub [:config]) repo)
                          [:default-queries :journals])]
      (when (seq queries)
        [:div#today-queries
         (for [query queries]
           (let [query' (assoc query :collapsed? true)]
             (with-meta
               [:<>
                (ui/catch-error
                 (ui/component-error (t :page/default-query-error) {:content (pr-str query')})
                 (query/custom-query (block/wrap-query-components
                                      {:editor-box editor/box
                                       :page page-cp
                                       :built-in-query? true
                                       :today-query? true
                                       :current-page-title (:block/title page)
                                       :today-day (date/today-journal-day)})
                                     query'))]
               {:key (str repo "-custom-query-" (:query query'))})))]))))

(hsx/defc db-page-title-actions
  [page]
  [:div.ls-page-title-actions
   [:div.flex.flex-row.items-center.gap-2
    (when-not (:logseq.property/icon page)
      (shui/button
       {:variant :ghost
        :size :sm
        :class "px-2 py-0 h-6 text-xs text-muted-foreground"
        :on-click (fn [e]
                    (state/pub-event! [:editor/new-property {:property-key "Icon"
                                                             :block page
                                                             :target (.-currentTarget e)}]))}
       (t :command.editor/add-property-icon)))

    (shui/button
     {:variant :ghost
      :size :sm
      :class "px-2 py-0 h-6 text-xs text-muted-foreground"
      :on-click (fn [e]
                  (if (entity/property? page)
                    (shui/popup-show!
                     (.-currentTarget e)
                     (fn []
                       [:div.ls-property-dropdown
                        (property-config/property-dropdown page nil {})])
                     {:align :center
                      :as-dropdown? true
                      :dropdown-menu? true})
                    (let [opts (cond-> {:block page :target (.-currentTarget e)}
                                 (entity/class? page)
                                 (assoc :class-schema? true))]
                      (state/pub-event! [:editor/new-property opts]))))}
     (cond
       (entity/class? page)
       (t :class/add-property)
       (entity/property? page)
       (t :ui/configure)
       :else
       (t :property/set-property)))]])

(hsx/defc db-page-title
  [page {:keys [sidebar? journals? container-id tag-dialog? display-title block-metadata-ready?]}]
  (let [with-actions? (not config/publishing?)]
    [:div.ls-page-title.flex.flex-1.w-full.content.items-start.title
     {:class "title"
      "data-testid" "page title"
      :on-pointer-down (fn [e]
                         (when (util/right-click? e)
                           (state/set-state! :page-title/context {:page (:block/title page)
                                                                  :page-entity page})))}

     [:div.w-full.relative
      (block/block-container
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
        :block-metadata-ready? block-metadata-ready?
        :journal-page? (entity/journal? page)
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
  [route-match page-name route-block-uuid]
  (or page-name
      route-block-uuid
      ;; is page name or uuid
      (get-page-name route-match)
      (state/get-current-page)))

(defn- get-sanity-page-name
  [route-match page-name route-block-uuid]
  (when-let [path-page-name (get-path-page-name route-match page-name route-block-uuid)]
    (util/page-name-sanity-lc path-page-name)))

(hsx/defc lsp-pagebar-slot
  []
  (when (not config/publishing?)
    (when config/lsp-enabled?
      [:div.flex.flex-row
       (plugins/hook-ui-slot :page-head-actions-slotted nil)
       (plugins/hook-ui-items :pagebar)])))

(hsx/defc tabs
  [page opts]
  (let [class? (entity/class? page)
        property? (entity/property? page)
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
         (objects/class-objects page opts)))
      (when property?
        (shui/tabs-content
         {:value "property"}
         (objects/property-related-objects page opts))))]))

(hsx/defc sidebar-page-properties
  [config page]
  (let [[collapsed? set-collapsed!] (hooks/use-state (not (entity/class? page)))]
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
        (block/db-properties-cp config page {:sidebar-properties? true})
        [:hr.my-4]])]))

;; A page is just a logical block
(hsx/defc ^:large-vars/cleanup-todo page-inner
  [{:keys [repo page preview? sidebar? tag-dialog? linked-refs? unlinked-refs? config journals?] :as option}]
  (let [current-repo (rfx/use-sub [:git/current-repo])
        container-key (select-keys option [:id :sidebar? :embed? :custom-query? :query :current-block :table? :block? :db/id :page-name])
        container-id (or (:container-id option) (state/get-container-id container-key))
        repo (or repo current-repo)
        config (assoc config
                      :id (str (:block/uuid page)))
        block? (some? (:block/page page))
        class-page? (entity/class? page)
        property-page? (entity/property? page)
        title (:block/title page)
        journal? (entity/journal? page)
        recycle-page? (and (entity/page? page)
                           (= title common-config/recycle-page-name))
        fmt-journal? (boolean (date/journal-title->int title))
        today? (and (entity/journal? page)
                    (= (:block/journal-day page)
                       (date/today-journal-day)))
        home? (= :home (state/get-current-route))
        recycled? (ldb/recycled? page)
        page-display-title (when (entity/page? page)
                             (or (route-handler/built-in-page-title (:block/title page))
                                 (:block/title page)))
        show-tabs? (and (or class-page? (entity/property? page)) (not tag-dialog?))]
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
              [:<>
               [:div.flex.flex-row.space-between
                (when (entity/page? page)
                  (db-page-title page
                                 {:sidebar? sidebar?
                                  :journals? journals?
                                  :container-id container-id
                                  :display-title page-display-title
                                  :tag-dialog? tag-dialog?
                                  :block-metadata-ready?
                                  (if journals?
                                    (:journal/render-data-ready? option)
                                    (:block-metadata-ready? option))}))
                (lsp-pagebar-slot)]
               (when (and (entity/page? page)
                          (not (ldb/library? page)))
                 (property-component/bidirectional-properties-area page config))])

            (when (and block? (not sidebar?))
              (block/breadcrumb {} repo (:block/uuid page) {}))

            (when (ldb/library? page)
              (library/add-pages page))

            (when (and sidebar? (entity/page? page))
              [:div.-mb-8
               (sidebar-page-properties config page)])

            (when show-tabs?
              (tabs page {:current-page? option
                          :sidebar? sidebar?}))

            (when (not tag-dialog?)
              (if recycle-page?
                (recycle/recycle-page page {:class "ls-recycle-page-title-compact"})
                [:div.ls-page-blocks
                 {:style {:margin-left (if (util/mobile?) 0 -20)}
                  :class (when-not (or sidebar? (util/capacitor?)) "mt-4")}
                 (or (:page-blocks-content option)
                     (page-blocks-cp
                      page
                      (merge option
                             {:sidebar? sidebar?
                              :on-page-blocks-rendered (:on-page-blocks-rendered option)
                              :container-id container-id})))]))]

           (when-not (or preview? recycle-page?)
             [:div.flex.flex-col.gap-8
              {:class (when-not (util/mobile?) "ml-1")}
              (when today?
                (today-queries repo page today? sidebar?))

              (when today?
                (scheduled/scheduled-and-deadlines title))

              (when (entity/class? page)
                (class-component/class-children page))

              ;; referenced blocks
              (when (and (not tag-dialog?)
                         (not linked-refs?))
                [:div.fade-in.delay {:key "page-references"}
                 ^{:key (str title "-refs")}
                 [reference/references (:block/uuid page) {:sidebar? sidebar?
                                             :journals? journals?
                                             :refs-count (:refs-count option)
                                             :linked-refs-section? true}]])

              (when-not (or unlinked-refs?
                            sidebar?
                            tag-dialog?
                            home?
                            class-page? property-page?)
                [:div.fade-in.delay {:key "page-unlinked-references"}
                 (reference/unlinked-references (:block/uuid page) {:sidebar? sidebar?})])])]))
      [:div.opacity-75 (t :page/not-found)])))

(defn- page-resource-key
  [option]
  (let [route-page-name (get-page-name option)
        block-route-name (get-block-route-name option)
        page-lookup (or (:block/uuid option)
                        (some-> (:page option) :block/uuid)
                        (get-sanity-page-name option (:page-name option) nil))]
    (cond
      (and route-page-name block-route-name)
      [:route-block route-page-name block-route-name]

      (or (uuid? page-lookup)
          (and (string? page-lookup) (not (string/blank? page-lookup))))
      [:page-identity page-lookup]

      :else nil)))

(hsx/defc loaded-page
  [option page-uuid]
  (let [page (db-hooks/use-block-projection page-uuid render-stable-page)
        refs-count (db-hooks/use-resource [:block-ref-count page-uuid])]
    (when page
      (page-inner (assoc option
                         :page page
                         :refs-count refs-count)))))

(hsx/defc page-resource
  [option resource-key]
  (let [page-uuid (db-hooks/use-resource resource-key)]
    (when page-uuid
      (loaded-page option page-uuid))))

(hsx/defc page-aux
  [option]
  (when-let [resource-key (page-resource-key option)]
    (page-resource option resource-key)))

(hsx/defc page-cp
  [option]
  (let [page-name (or (:page-name option)
                      (get-page-name option))]
    ^{:key (str
            (state/get-current-repo)
            "-"
            (or (:block/uuid option) (:db/id option) page-name))}
    [page-aux (assoc option :page-name page-name)]))

(hsx/defc page-container
  [page-m option]
  (page-cp (merge option page-m)))

(hsx/defc page-graph-inner
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

(hsx/defc page-graph-aux
  [page opts]
  (let [[graph set-graph!] (hooks/use-state {:nodes [] :links []})
        dark? (contains? #{"dark" :dark} (:theme opts))]
    (hooks/use-effect!
     (fn []
       (p/let [result (state/<invoke-db-worker :thread-api/build-graph (state/get-current-repo) opts)]
         (set-graph! result)))
     [opts])
    (page-graph-inner page graph dark?)))

(hsx/defc page-graph
  []
  (let [route-name (rfx/use-sub [:route-match :data :name])
        route-path-name (rfx/use-sub [:route-match :path-params :name])
        theme (rfx/use-sub [:ui/theme])
        route-page (and (= :page route-name)
                        route-path-name)
        [current-page set-current-page!] (hooks/use-state route-page)
        [page-entity set-page-entity!] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (if route-page
         (set-current-page! route-page)
         (p/let [today-title (db-async/<get-today-journal-title (state/get-current-repo))]
           (set-current-page! today-title)))
       nil)
     [route-page])
    (hooks/use-effect!
     (fn []
       (when current-page
         (p/let [page (db-async/<get-block (state/get-current-repo) current-page {:children? false})]
           (set-page-entity! page)))
       nil)
     [current-page])
    (page-graph-aux current-page
                    {:type (if (entity/page? page-entity) :page :block)
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
          (block/page-cp {} page-item)]])]

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
