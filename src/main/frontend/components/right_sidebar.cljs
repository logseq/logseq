(ns frontend.components.right-sidebar
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.onboarding :as onboarding]
            [frontend.components.page :as page]
            [frontend.components.shortcut :as shortcut]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as db-model]
            [frontend.extensions.slide :as slide]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.config :as config]
            [frontend.modules.editor.undo-redo :as undo-redo]
            [medley.core :as medley]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [frontend.handler.common :as common-handler]))

(rum/defc toggle
  []
  (when-not (util/sm-breakpoint?)
    (ui/with-shortcut :ui/toggle-right-sidebar "left"
      [:button.button.icon.toggle-right-sidebar
       {:title (t :right-side-bar/toggle-right-sidebar)
        :on-click ui-handler/toggle-right-sidebar!}
       (ui/icon "layout-sidebar-right" {:size 20})])))

(rum/defc block-cp < rum/reactive
  [repo idx block]
  (let [id (:block/uuid block)]
    (page/page {:parameters  {:path {:name (str id)}}
                :sidebar?    true
                :sidebar/idx idx
                :repo        repo})))

(rum/defc page-cp < rum/reactive
  [repo page-name]
  (page/page {:parameters {:path {:name page-name}}
              :sidebar?   true
              :repo       repo}))

(rum/defc contents < rum/reactive db-mixins/query
  []
  [:div.contents.flex-col.flex.ml-3
   (when-let [contents (db/entity [:block/name "contents"])]
     (page/contents-page contents))])

(rum/defc shortcut-settings
  []
  [:div.contents.flex-col.flex.ml-3
   (shortcut/shortcut-page {:show-title? false})])

(defn- block-with-breadcrumb
  [repo block idx sidebar-key ref?]
  (when-let [block-id (:block/uuid block)]
    [[:.flex.items-center {:class (when ref? "ml-8")}
      (ui/icon "block" {:class "text-md mr-2"})
      (block/breadcrumb {:id     "block-parent"
                         :block? true
                         :sidebar-key sidebar-key} repo block-id {:indent? false})]
     (block-cp repo idx block)]))

(rum/defc history-action-info
  [[k v]]
  (when v [:.ml-4 (ui/foldable
                   [:div (str k)]
                   [:.ml-4 (case k
                             :tx-id
                             [:.my-1 [:pre.code.pre-wrap-white-space.bg-base-4 (str v)]]

                             :blocks
                             (map (fn [block]
                                    [:.my-1 [:pre.code.pre-wrap-white-space.bg-base-4 (str block)]]) v)

                             :txs
                             (map (fn [[_ key val]]
                                    (when val
                                      [:pre.code.pre-wrap-white-space.bg-base-4
                                       [:span.font-bold (str key) " "] (str val)])) v)

                             (map (fn [[key val]]
                                    (when val
                                      [:pre.code.pre-wrap-white-space.bg-base-4
                                       [:span.font-bold (str key) " "] (str val)])) v))]
                   {:default-collapsed? true})]))

(rum/defc history-stack
  [label stack]
  [:.ml-4 (ui/foldable
           [:div label " (" (count stack) ")"]
           (map-indexed (fn [index item]
                          [:.ml-4 (ui/foldable [:div (str index " " (-> item :tx-meta :outliner-op))]
                                               (map history-action-info item)
                                               {:default-collapsed? true})]) stack)
           {:default-collapsed? true})])

(rum/defc history < rum/reactive
  []
  (let [state (undo-redo/get-state)
        page-only-mode? (state/sub :history/page-only-mode?)]
    [:div.ml-4
     [:div.ml-3.font-bold (if page-only-mode? (t :right-side-bar/history-pageonly) (t :right-side-bar/history-global))]
     [:div.p-4 [:.ml-4.mb-2
                (history-stack (t :right-side-bar/history-undos) (rum/react (:undo-stack state)))
                (history-stack (t :right-side-bar/history-redos) (rum/react (:redo-stack state)))]]]))

(defn build-sidebar-item
  [repo idx db-id block-type]
  (case (keyword block-type)
    :contents
    [[:.flex.items-center (ui/icon "list-details" {:class "text-md mr-2"}) (t :right-side-bar/contents)]
     (contents)]

    :help
    [[:.flex.items-center (ui/icon "help" {:class "text-md mr-2"}) (t :right-side-bar/help)] (onboarding/help)]

    :page-graph
    [[:.flex.items-center (ui/icon "hierarchy" {:class "text-md mr-2"}) (t :right-side-bar/page-graph)]
     (page/page-graph)]

    :history
    [[:.flex.items-center (ui/icon "history" {:class "text-md mr-2"}) (t :right-side-bar/history)]
     (history)]

    :block-ref
    #_:clj-kondo/ignore
    (let [lookup (if (integer? db-id) db-id [:block/uuid db-id])]
      (when-let [block (db/entity repo lookup)]
       [(t :right-side-bar/block-ref)
        (block-with-breadcrumb repo block idx [repo db-id block-type] true)]))

    :block
    #_:clj-kondo/ignore
    (let [lookup (if (integer? db-id) db-id [:block/uuid db-id])]
      (when-let [block (db/entity repo lookup)]
        (block-with-breadcrumb repo block idx [repo db-id block-type] false)))

    :page
    (let [lookup (if (integer? db-id) db-id [:block/uuid db-id])
          page (db/entity repo lookup)
          page-name (:block/name page)]
      [[:.flex.items-center.page-title
        (if-let [icon (get-in page [:block/properties :icon])]
          [:.text-md.mr-2 icon]
          (ui/icon (if (= "whiteboard" (:block/type page)) "whiteboard" "page") {:class "text-md mr-2"}))
        [:span.overflow-hidden.text-ellipsis (db-model/get-page-original-name page-name)]]
       (page-cp repo page-name)])

    :page-slide-view
    (let [page-name (:block/name (db/entity db-id))]
      [[:a.page-title {:href (rfe/href :page {:name page-name})}
        (db-model/get-page-original-name page-name)]
       [:div.ml-2.slide.mt-2
        (slide/slide page-name)]])

    :shortcut-settings
    [[:.flex.items-center (ui/icon "command" {:class "text-md mr-2"}) (t :help/shortcuts)]
     (shortcut-settings)]

    ["" [:span]]))

(defonce *drag-to
  (atom nil))

(defonce *drag-from
  (atom nil))

(rum/defc context-menu-content
  [db-id idx type collapsed? block-count toggle-fn]
  [:.menu-links-wrapper.text-left
   {:on-click toggle-fn}
   (ui/menu-link {:on-click #(state/sidebar-remove-block! idx)} (t :right-side-bar/pane-close) nil)
   (when (> block-count 1) (ui/menu-link {:on-click #(state/sidebar-remove-rest! db-id)} (t :right-side-bar/pane-clese-others) nil))
   (when (> block-count 1) (ui/menu-link {:on-click (fn []
                                                      (state/clear-sidebar-blocks!)
                                                      (state/hide-right-sidebar!))} (t :right-side-bar/pane-clese-all) nil))
   (when (or (not collapsed?) (> block-count 1)) [:hr.menu-separator])
   (when-not collapsed? (ui/menu-link {:on-click #(state/sidebar-block-toggle-collapse! db-id)} (t :right-side-bar/pane-collapse) nil))
   (when (> block-count 1) (ui/menu-link {:on-click #(state/sidebar-block-collapse-rest! db-id)} (t :right-side-bar/pane-collapse-others) nil))
   (when (> block-count 1) (ui/menu-link {:on-click #(state/sidebar-block-set-collapsed-all! true)} (t :right-side-bar/pane-collapse-all) nil))
   (when (or collapsed? (> block-count 1)) [:hr.menu-separator])
   (when collapsed? (ui/menu-link {:on-click #(state/sidebar-block-toggle-collapse! db-id)} (t :right-side-bar/pane-expand) nil))
   (when (> block-count 1) (ui/menu-link {:on-click #(state/sidebar-block-set-collapsed-all! false)}  (t :right-side-bar/pane-expand-all) nil))
   (when (= type :page) [:hr.menu-separator])
   (when (= type :page)
     (let [name (:block/name (db/entity db-id))]
       (ui/menu-link {:href (if (db-model/whiteboard-page? name)
                              (rfe/href :whiteboard {:name name})
                              (rfe/href :page {:name name}))} (t :right-side-bar/pane-open-as-page) nil)))])

(rum/defc drop-indicator
  [idx drag-to]
  [:.sidebar-drop-indicator {:on-drag-enter #(when drag-to (reset! *drag-to idx))
                             :on-drag-over util/stop
                             :class (when (= idx drag-to) "drag-over")}])

(rum/defc drop-area
  [idx]
  [:.sidebar-item-drop-area
   {:on-drag-over util/stop}
   [:.sidebar-item-drop-area-overlay.top
    {:on-drag-enter #(reset! *drag-to (dec idx))}]
   [:.sidebar-item-drop-area-overlay.bottom
    {:on-drag-enter #(reset! *drag-to idx)}]])

(rum/defc inner-component <
  {:should-update (fn [_prev-state state] (last (:rum/args state)))}
  [component _should-update?]
  component)

(rum/defc sidebar-item < rum/reactive
  [repo idx db-id block-type block-count]
  (let [drag-from (rum/react *drag-from)
        drag-to (rum/react *drag-to)
        item (build-sidebar-item repo idx db-id block-type)]
    (when item
      (let [collapsed? (state/sub [:ui/sidebar-collapsed-blocks db-id])]
        [:<>
         (when (zero? idx) (drop-indicator (dec idx) drag-to))
         [:div.flex.sidebar-item.content.color-level.shadow-md.rounded
          {:class [(str "item-type-" (name block-type))
                   (when collapsed? "collapsed")]}
          (let [[title component] item]
            [:div.flex.flex-col.w-full.relative
             [:.flex.flex-row.justify-between.pr-2.sidebar-item-header.color-level
              {:draggable true
               :on-drag-start (fn [event]
                                (editor-handler/block->data-transfer! (:block/name (db/entity db-id)) event)
                                (reset! *drag-from idx))
               :on-drag-end (fn [_event]
                              (when drag-to (state/sidebar-move-block! idx drag-to))
                              (reset! *drag-to nil)
                              (reset! *drag-from nil))
               :on-mouse-up (fn [event]
                              (when (= (.-which (.-nativeEvent event)) 2)
                                (state/sidebar-remove-block! idx)))
               :on-context-menu (fn [e]
                                  (util/stop e)
                                  (common-handler/show-custom-context-menu! e (context-menu-content db-id idx block-type collapsed? block-count #())))}
              [:button.flex.flex-row.p-2.items-center.w-full.overflow-hidden
               {:aria-expanded (str (not collapsed?))
                :id (str "sidebar-panel-header-" idx)
                :aria-controls (str "sidebar-panel-content-" idx)
                :on-click (fn [event]
                            (util/stop event)
                            (state/sidebar-block-toggle-collapse! db-id))}
               [:span.opacity-50.hover:opacity-100.flex.items-center.pr-1
                (ui/rotating-arrow collapsed?)]
               [:div.ml-1.font-medium.overflow-hidden
                title]]
              [:.item-actions.flex.items-center
               (ui/dropdown (fn [{:keys [toggle-fn]}]
                              [:button.button {:title (t :right-side-bar/pane-more)
                                               :on-click (fn [e]
                                                           (util/stop e)
                                                           (toggle-fn))} (ui/icon "dots")])
                            (fn [{:keys [close-fn]}]
                              (context-menu-content db-id idx block-type collapsed? block-count close-fn)))
               [:button.button.close {:title (t :right-side-bar/pane-close)
                                      :on-click #(state/sidebar-remove-block! idx)} (ui/icon "x")]]]
             [:div.scrollbar-spacing.p-4 {:role "region"
                                          :id (str "sidebar-panel-content-" idx)
                                          :aria-labelledby (str "sidebar-panel-header-" idx)
                                          :class (if collapsed? "hidden" "initial")}
              (inner-component component (not drag-from))]
             (when drag-from (drop-area idx))])]
         (drop-indicator idx drag-to)]))))

(defn- get-page
  [match]
  (let [route-name (get-in match [:data :name])
        page (case route-name
               :page
               (get-in match [:path-params :name])

               :file
               (get-in match [:path-params :path])

               (date/journal-name))]
    (when page
      (string/lower-case page))))

(defn get-current-page
  []
  (let [match (:route-match @state/state)]
    (get-page match)))

(rum/defc sidebar-resizer
  [sidebar-open? sidebar-id handler-position]
  (let [el-ref (rum/use-ref nil)
        min-px-width 144 ; Custom window controls width
        min-ratio 0.1
        max-ratio 0.7
        keyboard-step 5
        add-resizing-class #(.. js/document.documentElement -classList (add "is-resizing-buf"))
        remove-resizing-class (fn []
                                (.. js/document.documentElement -classList (remove "is-resizing-buf"))
                                (reset! ui-handler/*right-sidebar-resized-at (js/Date.now)))
        set-width! (fn [ratio]
                     (when el-ref
                       (let [value (* ratio 100)
                             width (str value "%")]
                         (.setAttribute (rum/deref el-ref) "aria-valuenow" value)
                         (ui-handler/persist-right-sidebar-width! width))))]
    (rum/use-effect!
     (fn []
       (when-let [el (and (fn? js/window.interact) (rum/deref el-ref))]
         (-> (js/interact el)
             (.draggable
              (bean/->js
               {:listeners
                {:move
                 (fn [^js/MouseEvent e]
                   (let [width js/document.documentElement.clientWidth
                         min-ratio (max min-ratio (/ min-px-width width))
                         sidebar-el (js/document.getElementById sidebar-id)
                         offset (.-pageX e)
                         ratio (.toFixed (/ offset width) 6)
                         ratio (if (= handler-position :west) (- 1 ratio) ratio)
                         cursor-class (str "cursor-" (first (name handler-position)) "-resize")]
                     (if (= (.getAttribute el "data-expanded") "true")
                       (cond
                         (< ratio (/ min-ratio 2))
                         (state/hide-right-sidebar!)

                         (< ratio min-ratio)
                         (.. js/document.documentElement -classList (add cursor-class))

                         (and (< ratio max-ratio) sidebar-el)
                         (when sidebar-el
                           (#(.. js/document.documentElement -classList (remove cursor-class))
                            (set-width! ratio)))
                         :else
                         #(.. js/document.documentElement -classList (remove cursor-class)))
                       (when (> ratio (/ min-ratio 2)) (state/open-right-sidebar!)))))}}))
             (.styleCursor false)
             (.on "dragstart" add-resizing-class)
             (.on "dragend" remove-resizing-class)
             (.on "keydown" (fn [e]
                              (when-let [sidebar-el (js/document.getElementById sidebar-id)]
                                (let [width js/document.documentElement.clientWidth
                                      min-ratio (max min-ratio (/ min-px-width width))
                                      keyboard-step (case (.-code e)
                                                      "ArrowLeft" (- keyboard-step)
                                                      "ArrowRight" keyboard-step
                                                      0)
                                      offset (+ (.-x (.getBoundingClientRect sidebar-el)) keyboard-step)
                                      ratio (.toFixed (/ offset width) 6)
                                      ratio (if (= handler-position :west) (- 1 ratio) ratio)]
                                  (when (and (> ratio min-ratio) (< ratio max-ratio) (not (zero? keyboard-step)))
                                    (do (add-resizing-class)
                                        (set-width! ratio)))))))
             (.on "keyup" remove-resizing-class)))
       #())
     [])

    (rum/use-effect!
      (fn []
        ;; sidebar animation duration
        (js/setTimeout
          #(reset! ui-handler/*right-sidebar-resized-at (js/Date.now)) 300))
      [sidebar-open?])

    [:.resizer {:ref el-ref
                :role "separator"
                :aria-orientation "vertical"
                :aria-label (t :right-side-bar/separator)
                :aria-valuemin (* min-ratio 100)
                :aria-valuemax (* max-ratio 100)
                :tabIndex "0"
                :data-expanded sidebar-open?}]))

(rum/defcs sidebar-inner <
  (rum/local false ::anim-finished?)
  {:will-mount (fn [state]
                 (js/setTimeout (fn [] (reset! (get state ::anim-finished?) true)) 300)
                 state)}
  [state repo t blocks]
  (let [*anim-finished? (get state ::anim-finished?)
        block-count (count blocks)]
    [:div.cp__right-sidebar-inner.flex.flex-col.h-full#right-sidebar-container

     [:div.cp__right-sidebar-scrollable
      [:div.cp__right-sidebar-topbar.flex.flex-row.justify-between.items-center.px-2.h-12
       [:div.cp__right-sidebar-settings.hide-scrollbar.gap-1 {:key "right-sidebar-settings"}
        [:div.text-sm
         [:button.button.cp__right-sidebar-settings-btn {:on-click (fn [_e]
                                                                     (state/sidebar-add-block! repo "contents" :contents))}
          (t :right-side-bar/contents)]]

        [:div.text-sm
         [:button.button.cp__right-sidebar-settings-btn {:on-click (fn []
                                                                     (when-let [page (get-current-page)]
                                                                       (state/sidebar-add-block!
                                                                        repo
                                                                        page
                                                                        :page-graph)))}
          (t :right-side-bar/page-graph)]]

        [:div.text-sm
         [:button.button.cp__right-sidebar-settings-btn {:on-click (fn [_e]
                                                                     (state/sidebar-add-block! repo "help" :help))}
          (t :right-side-bar/help)]]

        (when (and config/dev? (state/sub [:ui/developer-mode?]))
          [:div.text-sm
           [:button.button.cp__right-sidebar-settings-btn {:on-click (fn [_e]
                                                                       (state/sidebar-add-block! repo "history" :history))}
            (t :right-side-bar/history)]])]]

      [:.sidebar-item-list.flex-1.scrollbar-spacing.flex.flex-col.mx-2
       (if @*anim-finished?
         (for [[idx [repo db-id block-type]] (medley/indexed blocks)]
           (rum/with-key
             (sidebar-item repo idx db-id block-type block-count)
             (str "sidebar-block-" db-id)))
         [:div.p-4
          [:span.font-medium.opacity-50 "Loading ..."]])]]]))

(rum/defcs sidebar < rum/reactive
  [state]
  (let [blocks (state/sub-right-sidebar-blocks)
        sidebar-open? (state/sub :ui/sidebar-open?)
        width (state/sub :ui/sidebar-width)
        repo (state/sub :git/current-repo)]
    [:div#right-sidebar.cp__right-sidebar.h-screen
     {:class (if sidebar-open? "open" "closed")
      :style {:width width}}
     (sidebar-resizer sidebar-open? "right-sidebar" :west)
     (when sidebar-open?
       (sidebar-inner repo t blocks))]))
