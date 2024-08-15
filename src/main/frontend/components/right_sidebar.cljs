(ns frontend.components.right-sidebar
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.onboarding :as onboarding]
            [frontend.components.page :as page]
            [frontend.components.shortcut-help :as shortcut-help]
            [frontend.components.cmdk.core :as cmdk]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.extensions.slide :as slide]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.ui :as shui]
            [frontend.util :as util]
            [medley.core :as medley]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [frontend.db.rtc.debug-ui :as rtc-debug-ui]
            [frontend.handler.route :as route-handler]
            [logseq.db :as ldb]
            [frontend.components.icon :as icon]))

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
   (when-let [contents (db/get-page "contents")]
     (page/contents-page contents))])

(rum/defc shortcut-settings
  []
  [:div.contents.flex-col.flex.ml-3
   (shortcut-help/shortcut-page {:show-title? false})])

(defn- block-with-breadcrumb
  [repo block idx sidebar-key ref?]
  (when-let [block-id (:block/uuid block)]
    [[:.flex.items-center {:class (when ref? "ml-2")}
      (ui/icon "letter-n" {:class "text-md mr-2"})
      (block/breadcrumb {:id     "block-parent"
                         :block? true
                         :sidebar-key sidebar-key} repo block-id {:indent? false})]
     (block-cp repo idx block)]))

(defn build-sidebar-item
  [repo idx db-id block-type *db-id init-key]
  (case (keyword block-type)
    :contents
    [[:.flex.items-center (ui/icon "list-details" {:class "text-md mr-2"}) (t :right-side-bar/contents)]
     (contents)]

    :help
    [[:.flex.items-center (ui/icon "help" {:class "text-md mr-2"}) (t :right-side-bar/help)] (onboarding/help)]

    :page-graph
    [[:.flex.items-center (ui/icon "hierarchy" {:class "text-md mr-2"}) (t :right-side-bar/page-graph)]
     (page/page-graph)]

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
          page (db/entity repo lookup)]
      (if (ldb/page? page)
        [[:.flex.items-center.page-title
          (icon/get-node-icon page {:class "text-md mr-2"})
          [:span.overflow-hidden.text-ellipsis (:block/title page)]]
         (page-cp repo (str (:block/uuid page)))]
        (block-with-breadcrumb repo page idx [repo db-id block-type] false)))

    :search
    [[:.flex.items-center.page-title
      (ui/icon "search" {:class "text-md mr-2"})
      (let [input (rum/react *db-id)
            input' (if (string/blank? input) "Blank input" input)]
        [:span.overflow-hidden.text-ellipsis input'])]
     (rum/with-key
       (cmdk/cmdk-block {:initial-input db-id
                         :sidebar? true
                         :on-input-change (fn [new-value]
                                            (reset! *db-id new-value))
                         :on-input-blur (fn [new-value]
                                          (state/sidebar-replace-block! [repo db-id block-type]
                                                                        [repo new-value block-type]))})
       (str init-key))]

    :page-slide-view
    (let [page (db/entity db-id)]
      [[:a.page-title {:href (rfe/href :page {:name (str (:block/uuid page))})}
        (:block/title page)]
       [:div.ml-2.slide.mt-2
        (slide/slide page)]])

    :shortcut-settings
    [[:.flex.items-center (ui/icon "command" {:class "text-md mr-2"}) (t :help/shortcuts)]
     (shortcut-settings)]
    :rtc
    [[:.flex.items-center (ui/icon "cloud" {:class "text-md mr-2"}) "(Dev) RTC"]
     (rtc-debug-ui/rtc-debug-ui)]

    ["" [:span]]))

(defonce *drag-to
  (atom nil))

(defonce *drag-from
  (atom nil))

(rum/defc actions-menu-content
  [db-id idx type collapsed? block-count]
  (let [multi-items? (> block-count 1)
        menu-item shui/dropdown-menu-item]
    [:<>
     (menu-item {:on-click #(state/sidebar-remove-block! idx)} (t :right-side-bar/pane-close))
     (when multi-items? (menu-item {:on-click #(state/sidebar-remove-rest! db-id)} (t :right-side-bar/pane-close-others)))
     (when multi-items? (menu-item {:on-click (fn []
                                                (state/clear-sidebar-blocks!)
                                                (state/hide-right-sidebar!))} (t :right-side-bar/pane-close-all)))
     (when (and (not collapsed?) multi-items?) [:hr.menu-separator])
     (when-not collapsed? (menu-item {:on-click #(state/sidebar-block-toggle-collapse! db-id)} (t :right-side-bar/pane-collapse)))
     (when multi-items? (menu-item {:on-click #(state/sidebar-block-collapse-rest! db-id)} (t :right-side-bar/pane-collapse-others)))
     (when multi-items? (menu-item {:on-click #(state/sidebar-block-set-collapsed-all! true)} (t :right-side-bar/pane-collapse-all)))
     (when (and collapsed? multi-items?) [:hr.menu-separator])
     (when collapsed? (menu-item {:on-click #(state/sidebar-block-toggle-collapse! db-id)} (t :right-side-bar/pane-expand)))
     (when multi-items? (menu-item {:on-click #(state/sidebar-block-set-collapsed-all! false)} (t :right-side-bar/pane-expand-all)))
     (when (= type :page) [:hr.menu-separator])
     (when (= type :page)
       (let [page  (db/entity db-id)]
         (menu-item {:on-click (fn [] (route-handler/redirect-to-page! (:block/uuid page)))}
                    (t :right-side-bar/pane-open-as-page))))]))

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

(rum/defcs sidebar-item < rum/reactive
  {:init (fn [state] (assoc state
                            ::db-id (atom (nth (:rum/args state) 2))
                            ::init-key (random-uuid)))}
  [state repo idx db-id block-type block-count]
  (let [drag-from (rum/react *drag-from)
        drag-to (rum/react *drag-to)
        item (build-sidebar-item repo idx db-id block-type
                                 (::db-id state)
                                 (::init-key state))]
    (when item
      (let [collapsed? (state/sub [:ui/sidebar-collapsed-blocks db-id])]
        [:<>
         (when (zero? idx) (drop-indicator (dec idx) drag-to))
         [:div.flex.sidebar-item.content.color-level.rounded-md.shadow-lg
          {:class [(str "item-type-" (name block-type))
                   (when collapsed? "collapsed")]}
          (let [[title component] item]
            [:div.flex.flex-col.w-full.relative
             [:.flex.flex-row.justify-between.pr-2.sidebar-item-header.color-level.rounded-t-md
              {:class         (when collapsed? "rounded-b-md")
               :draggable     true
               :on-context-menu (fn [e]
                                  (util/stop e)
                                  (shui/popup-show! e
                                                    (actions-menu-content db-id idx block-type collapsed? block-count)
                                                    {:as-dropdown? true
                                                     :content-props {:on-click (fn [] (shui/popup-hide!))}}))
               :on-drag-start (fn [event]
                                (editor-handler/block->data-transfer! (:block/name (db/entity db-id)) event true)
                                (reset! *drag-from idx))
               :on-drag-end   (fn [_event]
                                (when drag-to (state/sidebar-move-block! idx drag-to))
                                (reset! *drag-to nil)
                                (reset! *drag-from nil))
               :on-pointer-up   (fn [event]
                                  (when (= (.-which (.-nativeEvent event)) 2)
                                    (state/sidebar-remove-block! idx)))}

              [:button.flex.flex-row.p-2.items-center.w-full.overflow-hidden
               {:aria-expanded (str (not collapsed?))
                :id            (str "sidebar-panel-header-" idx)
                :aria-controls (str "sidebar-panel-content-" idx)
                :on-click      (fn [event]
                                 (util/stop event)
                                 (state/sidebar-block-toggle-collapse! db-id))}
               [:span.opacity-50.hover:opacity-100.flex.items-center.pr-1
                (ui/rotating-arrow collapsed?)]
               [:div.ml-1.font-medium.overflow-hidden.whitespace-nowrap
                title]]
              [:.item-actions.flex.items-center
               (shui/button
                {:title (t :right-side-bar/pane-more)
                 :class "px-3"
                 :variant :text
                 :on-click #(shui/popup-show!
                             (.-target %)
                             (actions-menu-content db-id idx block-type collapsed? block-count)
                             {:as-dropdown? true
                              :content-props {:on-click (fn [] (shui/popup-hide!))}})}
                (ui/icon "dots"))

               (shui/button
                {:title (t :right-side-bar/pane-close)
                 :variant :text
                 :class "px-3"
                 :on-click #(state/sidebar-remove-block! idx)}
                (ui/icon "x"))]]

             [:div {:role "region"
                    :id (str "sidebar-panel-content-" idx)
                    :aria-labelledby (str "sidebar-panel-header-" idx)
                    :class           (util/classnames [{:hidden  collapsed?
                                                        :initial (not collapsed?)
                                                        :sidebar-panel-content true
                                                        :px-2    (not (contains? #{:search :shortcut-settings} block-type))}])}
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
        min-px-width 320 ; Custom window controls width
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

    [:.resizer
     {:ref              el-ref
      :role             "separator"
      :aria-orientation "vertical"
      :aria-label       (t :right-side-bar/separator)
      :aria-valuemin    (* min-ratio 100)
      :aria-valuemax    (* max-ratio 100)
      :aria-valuenow    50
      :tabIndex         "0"
      :data-expanded    sidebar-open?}]))

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
      {:on-drag-over util/stop}
      [:div.cp__right-sidebar-topbar.flex.flex-row.justify-between.items-center
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

        (when (state/sub [:ui/developer-mode?])
          [:div.text-sm
           [:button.button.cp__right-sidebar-settings-btn {:on-click (fn [_e]
                                                                       (state/sidebar-add-block! repo "rtc" :rtc))}
            "(Dev) RTC"]])]]

      [:.sidebar-item-list.flex-1.scrollbar-spacing.px-2
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
        blocks (if (empty? blocks)
                 [[(state/get-current-repo) "contents" :contents nil]]
                 blocks)
        sidebar-open? (state/sub :ui/sidebar-open?)
        width (state/sub :ui/sidebar-width)
        repo (state/sub :git/current-repo)]
    [:div#right-sidebar.cp__right-sidebar.h-screen
     {:class (if sidebar-open? "open" "closed")
      :style {:width width}}
     (sidebar-resizer sidebar-open? "right-sidebar" :west)
     (when sidebar-open?
       (sidebar-inner repo t blocks))]))
