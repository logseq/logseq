(ns frontend.components.page
  (:require ["/frontend/utils" :as utils]
            [clojure.string :as string]
            [dommy.core :as dom]
            [frontend.components.block :as component-block]
            [frontend.components.class :as class-component]
            [frontend.components.content :as content]
            [frontend.components.db-based.page :as db-page]
            [frontend.components.editor :as editor]
            [frontend.components.file-based.hierarchy :as hierarchy]
            [frontend.components.icon :as icon-component]
            [frontend.components.library :as library]
            [frontend.components.objects :as objects]
            [frontend.components.plugins :as plugins]
            [frontend.components.property.config :as property-config]
            [frontend.components.query :as query]
            [frontend.components.reference :as reference]
            [frontend.components.scheduled-deadlines :as scheduled]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.model :as model]
            [frontend.extensions.graph :as graph]
            [frontend.extensions.graph.pixi :as pixi]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.format.mldoc :as mldoc]
            [frontend.handler.common :as common-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mixins :as mixins]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [goog.object :as gobj]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.frontend.db :as db-db]
            [logseq.graph-parser.mldoc :as gp-mldoc]
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
  {:will-mount (fn [state]
                 (when-not (config/db-based-graph?)
                   (let [page-e (first (:rum/args state))
                         page-name (:block/name page-e)]
                     (when (and page-name
                                (db/journal-page? page-name)
                                (>= (date/journal-title->int page-name)
                                    (date/journal-title->int (date/today))))
                       (state/pub-event! [:journal/insert-template page-name]))))
                 state)}
  [state block* {:keys [sidebar? whiteboard? hide-add-button?] :as config}]
  (when-let [id (:db/id block*)]
    (let [block (db/sub-block id)
          block-id (:block/uuid block)
          block? (not (db/page? block))
          children (:block/_parent block)
          quick-add-page-id (:db/id (db-db/get-built-in-page (db/get-db) common-config/quick-add-page-name))
          children (cond
                     (and (= id quick-add-page-id)
                          (user-handler/user-uuid)
                          (ldb/get-graph-rtc-uuid (db/get-db)))
                     (let [user-id (uuid (user-handler/user-uuid))
                           user-db-id (:db/id (db/entity [:block/uuid user-id]))]
                       (if user-db-id
                         (filter (fn [block]
                                   (let [create-by-id (:db/id (:logseq.property/created-by-ref block))]
                                     (or (= user-db-id create-by-id)
                                         (nil? create-by-id)))) children)
                         children))

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
           (page-blocks-inner block blocks config sidebar? whiteboard? block-id)
           (when-not hide-add-button?
             (add-button block config))])))))

(rum/defc today-queries < rum/reactive
  [repo today? sidebar?]
  (when (and today? (not sidebar?))
    (let [queries (get-in (state/sub-config repo) [:default-queries :journals])]
      (when (seq queries)
        [:div#today-queries
         (for [query queries]
           (let [query' (if (config/db-based-graph?)
                          (assoc query :collapsed? true)
                          query)]
             (rum/with-key
               (ui/catch-error
                (ui/component-error "Failed default query:" {:content (pr-str query')})
                (query/custom-query (component-block/wrap-query-components
                                     {:editor-box editor/box
                                      :page page-cp
                                      :built-in-query? true
                                      :today-query? true})
                                    query'))
               (str repo "-custom-query-" (:query query')))))]))))

(rum/defc tagged-pages
  [repo tag tag-title]
  (let [[pages set-pages!] (rum/use-state nil)]
    (hooks/use-effect!
     (fn []
       (p/let [result (db-async/<get-tag-pages repo (:db/id tag))]
         (set-pages! result)))
     [tag])
    (when (seq pages)
      [:div.references.page-tags.flex-1.flex-row
       [:div.content
        (ui/foldable
         [:h2.font-bold.opacity-50 (util/format "Pages tagged with \"%s\"" tag-title)]
         [:ul.mt-2
          (for [page (sort-by :block/title pages)]
            [:li {:key (str "tagged-page-" (:db/id page))}
             (component-block/page-cp {} page)])]
         {:default-collapsed? false})]])))

(rum/defc page-title-editor < rum/reactive
  [page {:keys [*input-value *title-value *edit? untitled? page-name old-name whiteboard-page?]}]
  (let [input-ref (rum/create-ref)
        tag-idents (map :db/ident (:block/tags page))
        collide? #(and (not= (util/page-name-sanity-lc page-name)
                             (util/page-name-sanity-lc @*title-value))
                       (db/page-exists? page-name tag-idents)
                       (db/page-exists? @*title-value tag-idents))
        rollback-fn #(let [old-name (if untitled? "" old-name)]
                       (reset! *title-value old-name)
                       (gobj/set (rum/deref input-ref) "value" old-name)
                       (reset! *edit? true)
                       (.focus (rum/deref input-ref)))
        blur-fn (fn [e]
                  (when (common-util/wrapped-by-quotes? @*title-value)
                    (swap! *title-value common-util/unquote-string)
                    (gobj/set (rum/deref input-ref) "value" @*title-value))
                  (cond
                    (or (= old-name @*title-value) (and whiteboard-page? (string/blank? @*title-value)))
                    (reset! *edit? false)

                    (string/blank? @*title-value)
                    (do (when-not untitled? (notification/show! (t :page/illegal-page-name) :warning))
                        (rollback-fn))

                    (collide?)
                    (do (notification/show! (t :page/page-already-exists @*title-value) :error)
                        (rollback-fn))

                    (and (date/valid-journal-title? @*title-value) whiteboard-page?)
                    (do (notification/show! (t :page/whiteboard-to-journal-error) :error)
                        (rollback-fn))

                    :else
                    (p/do!
                     (page-handler/rename! (:block/uuid page) @*title-value)
                     (js/setTimeout #(reset! *edit? false) 100)))
                  (util/stop e))]
    [:input.edit-input.p-0.outline-none.focus:outline-none.no-ring
     {:type          "text"
      :ref           input-ref
      :auto-focus    true
      :style         {:width "100%"
                      :font-weight "inherit"}
      :auto-complete (if (util/chrome?) "chrome-off" "off") ; off not working here
      :value         (rum/react *input-value)
      :on-change     (fn [^js e]
                       (let [value (util/evalue e)]
                         (reset! *title-value (string/trim value))
                         (reset! *input-value value)))
      :on-blur       blur-fn
      :on-key-down   (fn [^js e]
                       (when (= (gobj/get e "key") "Enter")
                         (blur-fn e)))
      :placeholder   (when untitled? (t :untitled))
      :on-key-up     (fn [^js e]
                       ;; Esc
                       (when (= 27 (.-keyCode e))
                         (reset! *title-value old-name)
                         (reset! *edit? false)))
      :on-focus (fn []
                  (when untitled? (reset! *title-value "")))}]))

(rum/defcs ^:large-vars/cleanup-todo page-title-cp < rum/reactive db-mixins/query
  (rum/local false ::edit?)
  (rum/local "" ::input-value)
  {:init (fn [state]
           (let [page (first (:rum/args state))
                 title (:block/title page)
                 *title-value (atom title)]
             (assoc state ::title-value *title-value)))}
  [state page {:keys [fmt-journal? preview?]}]
  (when page
    (let [page (db/sub-block (:db/id page))
          title (:block/title page)]
      (when title
        (let [repo (state/get-current-repo)
              journal? (ldb/journal? page)
              *title-value (get state ::title-value)
              *edit? (get state ::edit?)
              *input-value (get state ::input-value)
              hls-page? (pdf-utils/hls-file? title)
              whiteboard-page? (model/whiteboard-page? page)
              untitled? (and whiteboard-page? (parse-uuid title)) ;; normal page cannot be untitled right?
              title (if hls-page?
                      [:a.asset-ref (pdf-utils/fix-local-asset-pagename title)]
                      (if fmt-journal?
                        (date/journal-title->custom-format title)
                        title))
              old-name title]
          [:div.ls-page-title.flex.flex-1.flex-row.flex-wrap.w-full.relative.items-center.gap-2
           [:h1.page-title.flex-1.cursor-pointer.gap-1
            {:class (when-not whiteboard-page? "title")
             :on-pointer-down (fn [e]
                                (when (util/right-click? e)
                                  (state/set-state! :page-title/context {:page (:block/title page)
                                                                         :page-entity page})))
             :on-click (fn [e]
                         (when-not (= (.-nodeName (.-target e)) "INPUT")
                           (.preventDefault e)
                           (if (gobj/get e "shiftKey")
                             (state/sidebar-add-block!
                              repo
                              (:db/id page)
                              :page)
                             (when (and (not hls-page?)
                                        (not journal?)
                                        (not config/publishing?)
                                        (not (ldb/built-in? page)))
                               (reset! *input-value (if untitled? "" old-name))
                               (reset! *edit? true)))))}
            (when-not (config/db-based-graph?)
              (when (get-in page [:block/properties :icon])
                (icon-component/get-node-icon-cp page {})))

            (if @*edit?
              (page-title-editor page {:*title-value *title-value
                                       :*edit? *edit?
                                       :*input-value *input-value
                                       :page-name (:block/title page)
                                       :old-name old-name
                                       :untitled? untitled?
                                       :whiteboard-page? whiteboard-page?
                                       :preview? preview?})
              [:span.title.block
               {:on-click (fn []
                            (when (and (not preview?)
                                       (contains? #{:home :all-journals} (get-in (state/get-route-match) [:data :name])))
                              (route-handler/redirect-to-page! (:block/uuid page))))
                :data-value @*input-value
                :data-ref   (:block/title page)
                :style      {:opacity (when @*edit? 0)}}
               (let [nested? (and (string/includes? title page-ref/left-brackets)
                                  (string/includes? title page-ref/right-brackets))]
                 (cond untitled? [:span.opacity-50 (t :untitled)]
                       nested? (component-block/map-inline {} (gp-mldoc/inline->edn title (mldoc/get-default-config
                                                                                           (get page :block/format :markdown))))
                       :else title))])]])))))

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
       "Add icon"))

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
       "Add tag property"
       (ldb/property? page)
       "Configure"
       :else
       "Set property"))]])

(rum/defc db-page-title
  [page {:keys [whiteboard-page? sidebar? container-id tag-dialog?]}]
  (let [with-actions? (not config/publishing?)]
    [:div.ls-page-title.flex.flex-1.w-full.content.items-start.title
     {:class (when-not whiteboard-page? "title")
      "data-testid" "page title"
      :on-pointer-down (fn [e]
                         (when (util/right-click? e)
                           (state/set-state! :page-title/context {:page (:block/title page)
                                                                  :page-entity page})))
      :on-click (fn [e]
                  (when-not (some-> e (.-target) (.closest ".ls-properties-area"))
                    (when-not (= (.-nodeName (.-target e)) "INPUT")
                      (.preventDefault e)
                      (cond
                        (gobj/get e "shiftKey")
                        (state/sidebar-add-block!
                         (state/get-current-repo)
                         (:db/id page)
                         :page)
                        (util/mobile?)
                        (route-handler/redirect-to-page! (:block/uuid page))
                        :else
                        nil))))}

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
        :hide-children? true
        :container-id container-id
        :show-tag-and-property-classes? true
        :journal-page? (ldb/journal? page)}
       page)]]))

(defn- page-mouse-over
  [e *control-show? *all-collapsed?]
  (util/stop e)
  (reset! *control-show? true)
  (p/let [blocks (editor-handler/<all-blocks-with-level {:collapse? true})
          all-collapsed?
          (->> blocks
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
             "Tagged nodes"))
          (when property?
            (shui/tabs-trigger
             {:value "property"
              :class "py-1 text-xs"}
             "Nodes with property"))
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
       [:span.text-xs (str (if collapsed? "Open" "Hide")) " properties"])]

     (when-not collapsed?
       [:<>
        (component-block/db-properties-cp config page {:sidebar-properties? true})
        [:hr.my-4]])]))

;; A page is just a logical block
(rum/defcs ^:large-vars/cleanup-todo page-inner < rum/reactive db-mixins/query mixins/container-id
  (rum/local false ::all-collapsed?)
  (rum/local false ::control-show?)
  (rum/local nil   ::current-page)
  [state {:keys [repo page preview? sidebar? tag-dialog? linked-refs? unlinked-refs? config journals?] :as option}]
  (let [current-repo (state/sub :git/current-repo)
        page (or page (some-> (:db/id option) db/entity))
        config (assoc config
                      :id (str (:block/uuid page)))
        repo (or repo current-repo)
        block? (some? (:block/page page))
        class-page? (ldb/class? page)
        property-page? (ldb/property? page)
        title (:block/title page)
        journal? (db/journal-page? title)
        db-based? (config/db-based-graph? repo)
        fmt-journal? (boolean (date/journal-title->int title))
        whiteboard? (:whiteboard? option) ;; in a whiteboard portal shape?
        whiteboard-page? (model/whiteboard-page? page) ;; is this page a whiteboard?
        today? (and
                journal?
                (= title (date/journal-name)))
        *control-show? (::control-show? state)
        *all-collapsed? (::all-collapsed? state)
        block-or-whiteboard? (or block? whiteboard?)
        home? (= :home (state/get-current-route))
        show-tabs? (and db-based? (or class-page? (ldb/property? page)) (not tag-dialog?))]
    (if page
      (when (or title block-or-whiteboard?)
        [:div.flex-1.page.relative.cp__page-inner-wrap
         (merge (if (seq (:block/tags page))
                  (let [page-names (map :block/title (:block/tags page))]
                    (when (seq page-names)
                      {:data-page-tags (text-util/build-data-value page-names)}))
                  {})

                {:key title
                 :class (util/classnames [{:is-journals (or journal? fmt-journal?)
                                           :is-node-page (or class-page? property-page?)}])})

         (if (and whiteboard-page? (not sidebar?))
           [:div ((state/get-component :whiteboard/tldraw-preview) (:block/uuid page))] ;; FIXME: this is not reactive
           [:div.relative.grid.gap-4.sm:gap-8.page-inner.mb-16
            (when-not (or block? sidebar?)
              [:div.flex.flex-row.space-between
               (when (and (or (mobile-util/native-platform?) (util/mobile?)) (not db-based?))
                 [:div.flex.flex-row.pr-2
                  {:style {:margin-left -15}
                   :on-mouse-over (fn [e]
                                    (page-mouse-over e *control-show? *all-collapsed?))
                   :on-mouse-leave (fn [e]
                                     (page-mouse-leave e *control-show?))}
                  (page-blocks-collapse-control title *control-show? *all-collapsed?)])
               (when (and (not whiteboard?) (ldb/page? page))
                 (if db-based?
                   (db-page-title page
                                  {:whiteboard-page? whiteboard-page?
                                   :sidebar? sidebar?
                                   :container-id (:container-id state)
                                   :tag-dialog? tag-dialog?})
                   (page-title-cp page {:journal? journal?
                                        :fmt-journal? fmt-journal?
                                        :preview? preview?})))
               (lsp-pagebar-slot)])

            (when (and block? (not sidebar?))
              (component-block/breadcrumb {} repo (:block/uuid page) {}))

            (when (and db-based? (ldb/library? page))
              (library/add-pages page))

            (when (and db-based? sidebar? (ldb/page? page))
              [:div.-mb-8
               (sidebar-page-properties config page)])

            (when show-tabs?
              (tabs page {:current-page? option :sidebar? sidebar?}))

            (when (not tag-dialog?)
              [:div.ls-page-blocks
               {:style {:margin-left (if (or whiteboard? (util/mobile?)) 0 -20)}
                :class (when-not (or sidebar? (util/capacitor?))
                         "mt-4")}
               (page-blocks-cp page (merge option {:sidebar? sidebar?
                                                   :container-id (:container-id state)
                                                   :whiteboard? whiteboard?}))])])

         (when-not preview?
           [:div.ml-1.flex.flex-col.gap-8
            (when today?
              (today-queries repo today? sidebar?))

            (when today?
              (scheduled/scheduled-and-deadlines title))

            (when (and (not block?) (not db-based?))
              (tagged-pages repo page title))

            (when (and (ldb/page? page) (:logseq.property.class/_extends page))
              (class-component/class-children page))

            ;; referenced blocks
            (when-not (or whiteboard? tag-dialog? linked-refs? (and block? (not db-based?)))
              [:div.fade-in.delay {:key "page-references"}
               (rum/with-key
                 (reference/references page {:sidebar? sidebar?
                                             :journals? journals?
                                             :refs-count (:refs-count option)})
                 (str title "-refs"))])

            (when-not block-or-whiteboard?
              (when (and (not journal?) (not db-based?))
                (hierarchy/structures (:block/title page))))

            (when-not (or whiteboard? unlinked-refs?
                          sidebar?
                          tag-dialog?
                          home?
                          (or class-page? property-page?)
                          (and block? (not db-based?)))
              [:div.fade-in.delay {:key "page-unlinked-references"}
               (reference/unlinked-references page {:sidebar? sidebar?})])])])
      [:div.opacity-75 "Page not found"])))

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
                                           (and page-name (not page-uuid?))
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
(defonce *graph-forcereset? (atom false))
(defonce *journal? (atom nil))
(defonce *orphan-pages? (atom true))
(defonce *builtin-pages? (atom nil))
(defonce *excluded-pages? (atom true))
(defonce *show-journals-in-page-graph? (atom nil))
(defonce *created-at-filter (atom nil))
(defonce *link-dist (atom 70))
(defonce *charge-strength (atom -600))
(defonce *charge-range (atom 600))

(rum/defcs simulation-switch < rum/reactive
  [state]
  (let [*simulation-paused? pixi/*simulation-paused?]
    [:div.flex.flex-col.mb-2
     [:p {:title "Pause simulation"}
      "Pause simulation"]
     (ui/toggle
      (rum/react *simulation-paused?)
      (fn []
        (let [paused? @*simulation-paused?]
          (if paused?
            (pixi/resume-simulation!)
            (pixi/stop-simulation!))))
      true)]))

(rum/defc ^:large-vars/cleanup-todo graph-filters < rum/reactive
  [graph settings forcesettings n-hops]
  (let [{:keys [journal? orphan-pages? builtin-pages? excluded-pages?]
         :or {orphan-pages? true}} settings
        {:keys [link-dist charge-strength charge-range]} forcesettings
        journal?' (rum/react *journal?)
        orphan-pages?' (rum/react *orphan-pages?)
        builtin-pages?' (rum/react *builtin-pages?)
        excluded-pages?' (rum/react *excluded-pages?)
        link-dist'  (rum/react *link-dist)
        charge-strength'  (rum/react *charge-strength)
        charge-range'  (rum/react *charge-range)
        journal? (if (nil? journal?') journal? journal?')
        orphan-pages? (if (nil? orphan-pages?') orphan-pages? orphan-pages?')
        builtin-pages? (if (nil? builtin-pages?') builtin-pages? builtin-pages?')
        excluded-pages? (if (nil? excluded-pages?') excluded-pages? excluded-pages?')
        created-at-filter (or (rum/react *created-at-filter) (:created-at-filter settings))
        link-dist (if (nil? link-dist') link-dist link-dist')
        charge-strength (if (nil? charge-strength') charge-strength charge-strength')
        charge-range (if (nil? charge-range') charge-range charge-range')
        set-setting! (fn [key value]
                       (let [new-settings (assoc settings key value)]
                         (config-handler/set-config! :graph/settings new-settings)))
        set-forcesetting! (fn [key value]
                            (let [new-forcesettings (assoc forcesettings key value)]
                              (config-handler/set-config! :graph/forcesettings new-forcesettings)))
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
                ;;    (fn [_e value]
                ;;      (set-setting! :layout value))
                ;;    {:class "graph-layout"})]
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

              (when (config/db-based-graph? (state/get-current-repo))
                [:div.flex.flex-col.mb-2
                 [:p "Created before"]
                 (when created-at-filter
                   [:div (.toDateString (js/Date. (+ created-at-filter (get-in graph [:all-pages :created-at-min]))))])

                 (ui/tooltip
                   ;; Slider keeps track off the range from min created-at to max created-at
                   ;; because there were bugs with setting min and max directly
                  (ui/slider created-at-filter
                             {:min 0
                              :max (- (get-in graph [:all-pages :created-at-max])
                                      (get-in graph [:all-pages :created-at-min]))
                              :on-change #(do
                                            (reset! *created-at-filter (int %))
                                            (set-setting! :created-at-filter (int %)))})
                  [:div.px-1 (str (js/Date. (+ created-at-filter (get-in graph [:all-pages :created-at-min]))))])])

              (when (seq focus-nodes)
                [:div.flex.flex-col.mb-2
                 [:p {:title "N hops from selected nodes"}
                  "N hops from selected nodes"]
                 (ui/tooltip
                  (ui/slider (or n-hops 10)
                             {:min 1
                              :max 10
                              :on-change #(reset! *n-hops (int %))})
                  [:div n-hops])])

              [:a.opacity-70.opacity-100 {:on-click (fn []
                                                      (swap! *graph-reset? not)
                                                      (reset! *focus-nodes [])
                                                      (reset! *n-hops nil)
                                                      (reset! *created-at-filter nil)
                                                      (set-setting! :created-at-filter nil)
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
         {:search-filters search-graph-filters})
        (graph-filter-section
         [:span.font-medium "Forces"]
         (fn [open?]
           (filter-expand-area
            open?
            [:div
             [:p.text-sm.opacity-70.px-4
              (let [c2 (count (:links graph))
                    s2 (if (> c2 1) "s" "")]
                (util/format "%d link%s" c2 s2))]
             [:div.p-6
              (simulation-switch)

              [:div.flex.flex-col.mb-2
               [:p {:title "Link Distance"}
                "Link Distance"]
               (ui/tooltip
                (ui/slider (/ link-dist 10)
                           {:min 1                                  ;; 10
                            :max 18                                 ;; 180
                            :on-change #(let [value (int %)]
                                          (reset! *link-dist (* value 10))
                                          (set-forcesetting! :link-dist (* value 10)))})
                [:div link-dist])]

              [:div.flex.flex-col.mb-2
               [:p {:title "Charge Strength"}
                "Charge Strength"]
               (ui/tooltip
                (ui/slider (/ charge-strength 100)
                           {:min -10                                ;;-1000
                            :max 10                                 ;;1000
                            :on-change #(let [value (int %)]
                                          (reset! *charge-strength (* value 100))
                                          (set-forcesetting! :charge-strength (* value 100)))})
                [:div charge-strength])]

              [:div.flex.flex-col.mb-2
               [:p {:title "Charge Range"}
                "Charge Range"]
               (ui/tooltip
                (ui/slider (/ charge-range 100)
                           {:min 5                                  ;;500
                            :max 40                                 ;;4000
                            :on-change #(let [value (int %)]
                                          (reset! *charge-range (* value 100))
                                          (set-forcesetting! :charge-range (* value 100)))})
                [:div charge-range])]

              [:a
               {:on-click (fn []
                            (swap! *graph-forcereset? not)
                            (reset! *link-dist 70)
                            (reset! *charge-strength -600)
                            (reset! *charge-range 600))}
               "Reset Forces"]]]))
         {})
        (graph-filter-section
         [:span.font-medium "Export"]
         (fn [open?]
           (filter-expand-area
            open?
            (when-let [canvas (js/document.querySelector "#global-graph canvas")]
              [:div.p-6
                 ;; We'll get an empty image if we don't wrap this in a requestAnimationFrame
               [:div [:a {:on-click #(.requestAnimationFrame js/window (fn [] (utils/canvasToImage canvas "graph" "png")))} "as PNG"]]])))
         {:search-filters search-graph-filters})]]]]))

(defonce last-node-position (atom nil))
(defn- graph-register-handlers
  [graph focus-nodes n-hops dark?]
  (.on graph "nodeClick"
       (fn [event node]
         (let [x (.-x event)
               y (.-y event)
               drag? (not (let [[last-node last-x last-y] @last-node-position
                                threshold 5]
                            (and (= node last-node)
                                 (<= (abs (- x last-x)) threshold)
                                 (<= (abs (- y last-y)) threshold))))]
           (graph/on-click-handler graph node event focus-nodes n-hops drag? dark?))))
  (.on graph "nodeMousedown"
       (fn [event node]
         (reset! last-node-position [node (.-x event) (.-y event)]))))

(rum/defc global-graph-inner < rum/reactive
  [graph settings forcesettings theme]
  (let [[width height] (rum/react layout)
        dark? (= theme "dark")
        n-hops (rum/react *n-hops)
        link-dist (rum/react *link-dist)
        charge-strength (rum/react *charge-strength)
        charge-range (rum/react *charge-range)
        reset? (rum/react *graph-reset?)
        forcereset? (rum/react *graph-forcereset?)
        focus-nodes (when n-hops (rum/react *focus-nodes))
        graph (if (and (integer? n-hops)
                       (seq focus-nodes)
                       (not (:orphan-pages? settings)))
                (graph-handler/n-hops graph focus-nodes n-hops)
                graph)]
    [:div.relative#global-graph
     (graph/graph-2d {:nodes (:nodes graph)
                      :links (:links graph)
                      :width (- width 24)
                      :height (- height 48)
                      :dark? dark?
                      :link-dist link-dist
                      :charge-strength charge-strength
                      :charge-range charge-range
                      :register-handlers-fn
                      (fn [graph]
                        (graph-register-handlers graph *focus-nodes *n-hops dark?))
                      :reset? reset?
                      :forcereset? forcereset?})
     (graph-filters graph settings forcesettings n-hops)]))

(defn- filter-graph-nodes
  [nodes filters]
  (if (seq filters)
    (let [filter-patterns (map #(re-pattern (str "(?i)" (util/regex-escape %))) filters)]
      (filter (fn [node] (some #(re-find % (:label node)) filter-patterns)) nodes))
    nodes))

(rum/defc graph-aux
  [settings forcesettings theme search-graph-filters]
  (let [[graph set-graph!] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (p/let [result (state/<invoke-db-worker :thread-api/build-graph (state/get-current-repo)
                                               (assoc settings
                                                      :type :global
                                                      :theme theme))]
         (set-graph! result)))
     [theme settings])
    (when graph
      (let [graph' (update graph :nodes #(filter-graph-nodes % search-graph-filters))]
        (global-graph-inner graph' settings forcesettings theme)))))

(rum/defcs global-graph < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "resize"
                    (fn [_e]
                      (reset! layout [js/window.innerWidth js/window.innerHeight])))))
  {:will-unmount (fn [state]
                   (reset! *n-hops nil)
                   (reset! *focus-nodes [])
                   (state/set-search-mode! :global)
                   state)}
  [state]
  (let [settings (state/graph-settings)
        forcesettings (state/graph-forcesettings)
        theme (state/sub :ui/theme)
        ;; Needed for query to retrigger after reset
        _reset? (rum/react *graph-reset?)
        search-graph-filters (state/sub :search/graph-filters)]
    (graph-aux settings forcesettings theme search-graph-filters)))

(rum/defc page-graph-inner < rum/reactive
  [_page graph dark?]
  (let [show-journals-in-page-graph? (rum/react *show-journals-in-page-graph?)]
    [:div.sidebar-item.flex-col
     [:div.flex.items-center.justify-between.mb-0
      [:span (t :right-side-bar/show-journals)]
      [:div.mt-1
       (ui/toggle show-journals-in-page-graph? ;my-val;
                  (fn []
                    (let [value (not show-journals-in-page-graph?)]
                      (reset! *show-journals-in-page-graph? value)))
                  true)]]

     (graph/graph-2d {:nodes (:nodes graph)
                      :links (:links graph)
                      :width 600
                      :height 600
                      :dark? dark?
                      :register-handlers-fn
                      (fn [graph]
                        (graph-register-handlers graph (atom nil) (atom nil) dark?))})]))

(rum/defc page-graph-aux
  [page opts]
  (let [[graph set-graph!] (hooks/use-state nil)
        dark? (= (:theme opts) "dark")]
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
                      (date/today))
        theme (:ui/theme @state/state)
        show-journals-in-page-graph (rum/react *show-journals-in-page-graph?)
        page-entity (db/get-page current-page)]
    (page-graph-aux current-page
                    {:type (if (ldb/page? page-entity) :page :block)
                     :block/uuid (:block/uuid page-entity)
                     :theme theme
                     :show-journals? show-journals-in-page-graph})))

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
        (t :page/delete-confirmation)]]]

     [:ol.p-2.pt-4
      (for [page-item pages]
        [:li
         [:a {:href (rfe/href :page {:name (:block/uuid page-item)})}
          (component-block/page-cp {} page-item)]])]

     [:p.px-2.opacity-50 [:small (str "Total: " (count pages))]]

     [:div.pt-6.flex.justify-end.gap-4
      (ui/button
       (t :cancel)
       :variant :outline
       :on-click close)

      (ui/button
       (t :yes)
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
                         (notification/show! (t :all-pages/failed-to-delete-pages (string/join ", " (map pr-str @failed-pages)))
                                             :warning false)
                         (notification/show! (t :tips/all-done) :success))))
                   (js/setTimeout #(refresh-fn) 200)))]]))
