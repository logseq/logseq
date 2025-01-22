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
            [frontend.components.objects :as objects]
            [frontend.components.plugins :as plugins]
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
            [frontend.handler.dnd :as dnd]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.hooks :as hooks]
            [frontend.mixins :as mixins]
            [frontend.mobile.util :as mobile-util]
            [frontend.rum :as frontend-rum]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [goog.object :as gobj]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.graph-parser.mldoc :as gp-mldoc]
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

(defn- get-block
  [page-name-or-uuid]
  (when page-name-or-uuid
    (when-let [block (model/get-page page-name-or-uuid)]
      (model/sub-block (:db/id block)))))

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
  [page-e blocks config sidebar? whiteboard? _block-uuid]
  (when page-e
    (let [hiccup (component-block/->hiccup blocks config {})]
      [:div.page-blocks-inner {:style {:margin-left (if whiteboard? 0 -20)
                                       :min-height 29}}
       (rum/with-key
         (content/content (str (:block/uuid page-e))
                          {:hiccup   hiccup
                           :sidebar? sidebar?})
         (str (:block/uuid page-e) "-hiccup"))])))

(declare page-cp)

(if config/publishing?
  (rum/defc dummy-block
    [_page]
    [:div])

  (rum/defc dummy-block
    [page]
    (let [[hover set-hover!] (rum/use-state false)
          click-handler-fn (fn []
                             (p/let [result (editor-handler/insert-first-page-block-if-not-exists! (:block/uuid page))
                                     result (when (string? result) (:tx-data (ldb/read-transit-str result)))
                                     first-child-id (first (map :block/uuid result))
                                     first-child (when first-child-id (db/entity [:block/uuid first-child-id]))]
                               (when first-child
                                 (editor-handler/edit-block! first-child :max {:container-id :unknown-container}))))
          drop-handler-fn (fn [^js event]
                            (util/stop event)
                            (p/let [block-uuids (state/get-selection-block-ids)
                                    lookup-refs (map (fn [id] [:block/uuid id]) block-uuids)
                                    selected (db/pull-many (state/get-current-repo) '[*] lookup-refs)
                                    blocks (if (seq selected) selected [@component-block/*dragging-block])
                                    _ (editor-handler/insert-first-page-block-if-not-exists! (:block/uuid page))]
                              (js/setTimeout #(let [target-block page]
                                                (dnd/move-blocks event blocks target-block nil :sibling))
                                             0)))
          *dummy-block-uuid (rum/use-ref (random-uuid))
          *el-ref (rum/use-ref nil)
          _ (frontend-rum/use-atom (@state/state :selection/blocks))
          selection-ids (state/get-selection-block-ids)
          selected? (contains? (set selection-ids) (rum/deref *dummy-block-uuid))
          idstr (str (rum/deref *dummy-block-uuid))
          focus! (fn [] (js/setTimeout #(some-> (rum/deref *el-ref) (.focus)) 16))]

      ;; mounted
      ;(hooks/use-effect! #(focus!) [])
      (hooks/use-effect! #(if selected? (focus!)
                              (some-> (rum/deref *el-ref) (.blur))) [selected?])

      (shui/trigger-as
       :div.ls-dummy-block.ls-block

       {:style {:width "100%"
                 ;; The same as .dnd-separator
                :border-top (if hover
                              "3px solid #ccc"
                              nil)}
        :ref *el-ref
        :tabIndex 0
        :on-click click-handler-fn
        :id idstr
        :blockid idstr
        :class (when selected? "selected")}

       [:div.flex.items-center
        [:div.flex.items-center.mx-1 {:style {:height 24}}
         [:span.bullet-container.cursor
          [:span.bullet]]]

        [:div.flex.flex-1
         {:on-drag-enter #(set-hover! true)
          :on-drag-over #(util/stop %)
          :on-drop drop-handler-fn
          :on-drag-leave #(set-hover! false)}
         [:span.opacity-70.text
          "Click here to edit..."]]]))))

(rum/defc add-button
  [args container-id]
  (let [*bullet-ref (rum/use-ref nil)]
    [:div.flex-1.flex-col.rounded-sm.add-button-link-wrap
     {:on-click (fn [e]
                  (util/stop e)
                  (state/set-state! :editor/container-id container-id)
                  (editor-handler/api-insert-new-block! "" args))
      :on-mouse-over #(dom/add-class! (rum/deref *bullet-ref) "opacity-50")
      :on-mouse-leave #(dom/remove-class! (rum/deref *bullet-ref) "opacity-50")
      :on-key-down (fn [e]
                     (util/stop e)
                     (when (= "Enter" (util/ekey e))
                       (state/set-state! :editor/container-id container-id)
                       (editor-handler/api-insert-new-block! "" args)))
      :tab-index 0}
     [:div.flex.flex-row
      [:div.flex.items-center {:style {:height 28
                                       :margin-left 2}}
       [:span.bullet-container.cursor.opacity-0.transition-opacity.ease-in.duration-100 {:ref *bullet-ref}
        [:span.bullet]]]]]))

(rum/defcs page-blocks-cp < rum/reactive db-mixins/query
  {:will-mount (fn [state]
                 (let [page-e (first (:rum/args state))
                       page-name (:block/name page-e)]
                   (when (and page-name
                              (db/journal-page? page-name)
                              (>= (date/journal-title->int page-name)
                                  (date/journal-title->int (date/today))))
                     (state/pub-event! [:journal/insert-template page-name])))
                 state)}
  [state page-e {:keys [sidebar? whiteboard?] :as config}]
  (when page-e
    (let [page-name (or (:block/name page-e)
                        (str (:block/uuid page-e)))
          block-id (parse-uuid page-name)
          block (get-block (or (:block/uuid page-e) (:block/name page-e)))
          block? (not (db/page? block))
          children (:block/_parent block)
          children (cond
                     (ldb/class? block)
                     (remove (fn [b] (contains? (set (map :db/id (:block/tags b))) (:db/id block))) children)

                     (ldb/property? block)
                     (remove (fn [b] (some? (get b (:db/ident block)))) children)

                     :else
                     children)]
      (cond
        (and
         (not block?)
         (empty? children) page-e)
        (dummy-block page-e)

        :else
        (let [document-mode? (state/sub :document/mode?)
              hiccup-config (merge
                             {:id (if block? (str block-id) page-name)
                              :db/id (:db/id block)
                              :block? block?
                              :editor-box editor/box
                              :document/mode? document-mode?}
                             config)
              config (common-handler/config-with-document-mode hiccup-config)
              blocks (if block? [block] (db/sort-by-order children block))]
          (let [add-button? (not (or config/publishing?
                                     (let [last-child-id (model/get-block-deep-last-open-child-id (db/get-db) (:db/id (last blocks)))
                                           block' (if last-child-id (db/entity last-child-id) (last blocks))]
                                       (string/blank? (:block/title block')))))]
            [:div
             {:class (when add-button? "show-add-button")}
             (page-blocks-inner page-e blocks config sidebar? whiteboard? block-id)
             (let [args (if block-id
                          {:block-uuid block-id}
                          {:page page-name})]
               (add-button args (:container-id config)))]))))))

(rum/defc today-queries < rum/reactive
  [repo today? sidebar?]
  (when (and today? (not sidebar?))
    (let [queries (get-in (state/sub-config repo) [:default-queries :journals])]
      (when (seq queries)
        [:div#today-queries.mt-10
         (for [query queries]
           (let [query' (if (config/db-based-graph?)
                          (assoc query :collapsed? true)
                          query)]
             (rum/with-key
               (ui/catch-error
                (ui/component-error "Failed default query:" {:content (pr-str query')})
                (query/custom-query (component-block/wrap-query-components
                                     {:attr {:class "mt-10"}
                                      :editor-box editor/box
                                      :page page-cp})
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
      [:div.references.page-tags.mt-6.flex-1.flex-row
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
                            (when (and (state/home?) (not preview?))
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
  [:div.absolute.-top-3.left-0.opacity-0.db-page-title-actions
   [:div.flex.flex-row.items-center.gap-2
    (when-not (:logseq.property/icon (db/entity (:db/id page)))
      (shui/button
       {:variant :outline
        :size :sm
        :class "px-2 py-0 h-4 text-xs text-muted-foreground"
        :on-click (fn [e]
                    (state/pub-event! [:editor/new-property {:property-key "Icon"
                                                             :block page
                                                             :target (.-target e)}]))}
       "Add icon"))

    (shui/button
     {:variant :outline
      :size :sm
      :class "px-2 py-0 h-4 text-xs text-muted-foreground"
      :on-click (fn [e]
                  (state/pub-event! [:editor/new-property {:block page
                                                           :target (.-target e)}]))}
     "Set page property")]])

(rum/defc db-page-title
  [page whiteboard-page? sidebar? container-id]
  (let [[with-actions? set-with-actions!] (rum/use-state false)
        *el (rum/use-ref nil)]

    (hooks/use-effect!
     (fn []
       (when (and (not config/publishing?)
                  (some-> (rum/deref *el) (.closest "#main-content-container")))
         (set-with-actions! true)))
     [])

    [:div.ls-page-title.flex.flex-1.w-full.content.items-start.title
     {:class (when-not whiteboard-page? "title")
      :ref *el
      :on-pointer-down (fn [e]
                         (when (util/right-click? e)
                           (state/set-state! :page-title/context {:page (:block/title page)
                                                                  :page-entity page})))
      :on-click (fn [e]
                  (when-not (some-> e (.-target) (.closest ".ls-properties-area"))
                    (when-not (= (.-nodeName (.-target e)) "INPUT")
                      (.preventDefault e)
                      (when (gobj/get e "shiftKey")
                        (state/sidebar-add-block!
                         (state/get-current-repo)
                         (:db/id page)
                         :page)))))}

     [:div.w-full.relative
      (component-block/block-container
       {:page-title? true
        :page-title-actions-cp (when (and with-actions? (not= (:db/id (state/get-edit-block)) (:db/id page))) db-page-title-actions)
        :hide-title? sidebar?
        :sidebar? sidebar?
        :hide-children? true
        :container-id container-id
        :show-tag-and-property-classes? true
        :from-journals? (contains? #{:home :all-journals} (get-in (state/get-route-match) [:data :name]))}
       page)]]))

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

(rum/defc tabs
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
       :class (str "w-full")}
      (when (or both? property?)
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
         (objects/property-related-objects page (:current-page? opts)))))]))

(rum/defc sidebar-page-properties
  [config page]
  (let [[collapsed? set-collapsed!] (rum/use-state true)]
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
  [state {:keys [repo page-name preview? sidebar? linked-refs? unlinked-refs? config] :as option}]
  (when-let [path-page-name (get-path-page-name state page-name)]
    (let [current-repo (state/sub :git/current-repo)
          repo (or repo current-repo)
          page-name (util/page-name-sanity-lc path-page-name)
          page (get-page-entity page-name)
          block-id (:block/uuid page)
          block? (some? (:block/page page))
          class-page? (ldb/class? page)
          property-page? (ldb/property? page)
          journal? (db/journal-page? page-name)
          db-based? (config/db-based-graph? repo)
          fmt-journal? (boolean (date/journal-title->int page-name))
          whiteboard? (:whiteboard? option) ;; in a whiteboard portal shape?
          whiteboard-page? (model/whiteboard-page? page) ;; is this page a whiteboard?
          route-page-name path-page-name
          page-name (:block/name page)
          page-title (:block/title page)
          title (or page-title page-name)
          today? (and
                  journal?
                  (= page-name (util/page-name-sanity-lc (date/journal-name))))
          *control-show? (::control-show? state)
          *all-collapsed? (::all-collapsed? state)
          block-or-whiteboard? (or block? whiteboard?)
          home? (= :home (state/get-current-route))]
      (if page
        (when (or page-name block-or-whiteboard?)
          [:div.flex-1.page.relative.cp__page-inner-wrap
           (merge (if (seq (:block/tags page))
                    (let [page-names (map :block/title (:block/tags page))]
                      (when (seq page-names)
                        {:data-page-tags (text-util/build-data-value page-names)}))
                    {})

                  {:key path-page-name
                   :class (util/classnames [{:is-journals (or journal? fmt-journal?)
                                             :is-node-page (or class-page? property-page?)}])})

           (if (and whiteboard-page? (not sidebar?))
             [:div ((state/get-component :whiteboard/tldraw-preview) (:block/uuid page))] ;; FIXME: this is not reactive
             [:div.relative.grid.gap-8.page-inner
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
                     (db-page-title page whiteboard-page? sidebar? (:container-id state))
                     (page-title-cp page {:journal? journal?
                                          :fmt-journal? fmt-journal?
                                          :preview? preview?})))
                 (lsp-pagebar-slot)])

              (when (and db-based? sidebar?)
                [:div.-mb-8
                 (sidebar-page-properties config page)])

              (when (and block? (not sidebar?) (not whiteboard?))
                (let [config (merge config {:id "block-parent"
                                            :block? true})]
                  [:div.mb-4
                   (component-block/breadcrumb config repo block-id {:level-limit 3})]))

              (when (and db-based? (or class-page? (ldb/property? page)))
                (tabs page {:current-page? option :sidebar? sidebar?}))

              [:div.ls-page-blocks
               (page-blocks-cp page (merge option {:sidebar? sidebar?
                                                   :container-id (:container-id state)
                                                   :whiteboard? whiteboard?}))]])

           (when (not preview?)
             [:div {:style {:padding-left 9}}
              (when today?
                (today-queries repo today? sidebar?))

              (when today?
                (scheduled/scheduled-and-deadlines page-name))

              (when (and (not block?) (not db-based?))
                (tagged-pages repo page page-title))

              (when (and (ldb/page? page) (:logseq.property/_parent page))
                (class-component/class-children page))

            ;; referenced blocks
              (when-not (or whiteboard? linked-refs? (and block? (not db-based?)))
                [:div {:key "page-references"}
                 (rum/with-key
                   (reference/references page)
                   (str route-page-name "-refs"))])

              (when-not block-or-whiteboard?
                (when (and (not journal?) (not db-based?))
                  (hierarchy/structures (:block/title page))))

              (when-not (or whiteboard? unlinked-refs?
                            sidebar?
                            home?
                            (or class-page? property-page?)
                            (and block? (not db-based?)))
                [:div {:key "page-unlinked-references"}
                 (reference/unlinked-references page)])])])
        [:div.opacity-75 "Page not found"]))))

(rum/defcs page-aux < rum/reactive db-mixins/query
  {:init (fn [state]
           (let [page-name (:page-name (first (:rum/args state)))
                 option (last (:rum/args state))
                 preview-or-sidebar? (or (:preview? option) (:sidebar? option))
                 page-name' (get-sanity-page-name state page-name)
                 page-uuid? (util/uuid-string? page-name')
                 *loading? (atom true)
                 page (db/get-page page-name')]
             (when page (reset! *loading? false))
             (p/let [page-block (db-async/<get-block (state/get-current-repo) page-name')]
               (reset! *loading? false)
               (when page-block
                 (when-not preview-or-sidebar?
                   (if-let [page-uuid (and (not page-uuid?) (:block/uuid page-block))]
                     (route-handler/redirect-to-page! (str page-uuid) {:push false})
                     (route-handler/update-page-title-and-label! (state/get-route-match))))))
             (assoc state
                    ::page-name page-name'
                    ::loading? *loading?)))
   :will-unmount (fn [state]
                   (state/set-state! :editor/virtualized-scroll-fn nil)
                   state)}
  [state option]
  (when-not (rum/react (::loading? state))
    (page-inner option)))

(rum/defcs page-cp
  [state option]
  (rum/with-key
    (page-aux option)
    (str
     (state/get-current-repo)
     "-"
     (or (:page-name option)
         (get-page-name state)))))

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
                 (ui/tippy {:html [:div.pr-3 (str (js/Date. (+ created-at-filter (get-in graph [:all-pages :created-at-min]))))]}
                     ;; Slider keeps track off the range from min created-at to max created-at
                     ;; because there were bugs with setting min and max directly
                           (ui/slider created-at-filter
                                      {:min 0
                                       :max (- (get-in graph [:all-pages :created-at-max])
                                               (get-in graph [:all-pages :created-at-min]))
                                       :on-change #(do
                                                     (reset! *created-at-filter (int %))
                                                     (set-setting! :created-at-filter (int %)))}))])
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
               (ui/tippy {:html [:div.pr-3 link-dist]}
                         (ui/slider (/ link-dist 10)
                                    {:min 1   ;; 10
                                     :max 18  ;; 180
                                     :on-change #(let [value (int %)]
                                                   (reset! *link-dist (* value 10))
                                                   (set-forcesetting! :link-dist (* value 10)))}))]
              [:div.flex.flex-col.mb-2
               [:p {:title "Charge Strength"}
                "Charge Strength"]
               (ui/tippy {:html [:div.pr-3 charge-strength]}
                         (ui/slider (/ charge-strength 100)
                                    {:min -10  ;;-1000
                                     :max 10   ;;1000
                                     :on-change #(let [value (int %)]
                                                   (reset! *charge-strength (* value 100))
                                                   (set-forcesetting! :charge-strength (* value 100)))}))]
              [:div.flex.flex-col.mb-2
               [:p {:title "Charge Range"}
                "Charge Range"]
               (ui/tippy {:html [:div.pr-3 charge-range]}
                         (ui/slider (/ charge-range 100)
                                    {:min 5    ;;500
                                     :max 40   ;;4000
                                     :on-change #(let [value (int %)]
                                                   (reset! *charge-range (* value 100))
                                                   (set-forcesetting! :charge-range (* value 100)))}))]

              [:a.opacity-70.opacity-100 {:on-click (fn []
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
        graph (graph-handler/build-global-graph theme settings)
        search-graph-filters (state/sub :search/graph-filters)
        graph (update graph :nodes #(filter-graph-nodes % search-graph-filters))]
    (global-graph-inner graph settings forcesettings theme)))

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

(rum/defc page-graph < db-mixins/query rum/reactive
  []
  (let [page (or
              (and (= :page (state/sub [:route-match :data :name]))
                   (state/sub [:route-match :path-params :name]))
              (date/today))
        theme (:ui/theme @state/state)
        dark? (= theme "dark")
        show-journals-in-page-graph (rum/react *show-journals-in-page-graph?)
        page-entity (db/get-page page)
        graph (if (ldb/page? page-entity)
                (graph-handler/build-page-graph page theme show-journals-in-page-graph)
                (graph-handler/build-block-graph (uuid page) theme))]
    (when (seq (:nodes graph))
      (page-graph-inner page graph dark?))))

(defn batch-delete-dialog
  [pages orphaned-pages? refresh-fn]
  (fn [{:keys [close]}]
    [:div
     [:div.sm:flex.items-center
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-error.sm:mx-0.sm:h-10.sm:w-10
       [:span.text-error.text-xl
        (ui/icon "alert-triangle")]]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium
        (if orphaned-pages?
          (t :remove-orphaned-pages)
          (t :page/delete-confirmation))]]]

     [:ol.p-2.pt-4
      (for [page pages]
        [:li
         [:a {:href (rfe/href :page {:name (:block/uuid page)})}
          (component-block/page-cp {} page)]])]

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
