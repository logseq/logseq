(ns frontend.components.container
  (:require [cljs-drag-n-drop.core :as dnd]
            [clojure.string :as string]
            [dommy.core :as d]
            [electron.ipc :as ipc]
            [frontend.components.block :as block]
            [frontend.components.content :as cp-content]
            [frontend.components.dnd :as dnd-component]
            [frontend.components.find-in-page :as find-in-page]
            [frontend.components.handbooks :as handbooks]
            [frontend.components.header :as header]
            [frontend.components.icon :as icon]
            [frontend.components.journal :as journal]
            [frontend.components.plugins :as plugins]
            [frontend.components.repo :as repo]
            [frontend.components.right-sidebar :as right-sidebar]
            [frontend.components.theme :as theme]
            [frontend.components.window-controls :as window-controls]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t tt]]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.extensions.fsrs :as fsrs]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.handler.block :as block-handler]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.recent :as recent-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.whiteboard :as whiteboard-handler]
            [frontend.mixins :as mixins]
            [frontend.mobile.footer :as footer]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.shortcut.data-helper :as shortcut-dh]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.page :as page-util]
            [frontend.version :refer [version]]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.common.util.namespace :as ns-util]
            [logseq.db :as ldb]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.toaster.core :as shui-toaster]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
            [promesa.core :as p]
            [react-draggable]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(rum/defc sidebar-content-group < rum/reactive
  [name {:keys [class count more header-props enter-show-more? collapsable?]} child]
  (let [collapsed? (state/sub [:ui/navigation-item-collapsed? class])]
    [:div.sidebar-content-group
     {:class (util/classnames [class {:is-expand (not collapsed?)
                                      :has-children (and (number? count) (> count 0))}])}
     [:div.sidebar-content-group-inner
      [:div.hd.items-center
       (cond-> (merge header-props
                      {:class (util/classnames [(:class header-props)
                                                {:non-collapsable (false? collapsable?)
                                                 :enter-show-more (true? enter-show-more?)}])})

         (not (false? collapsable?))
         (assoc :on-click (fn [^js/MouseEvent _e]
                            (state/toggle-navigation-item-collapsed! class))))
       [:span.a name]
       [:span.b (or more (ui/icon "chevron-right" {:class "more" :size 15}))]]
      (when child [:div.bd child])]]))

(rum/defc page-name < rum/reactive db-mixins/query
  [page recent?]
  (when-let [id (:db/id page)]
    (let [page (db/sub-block id)
          repo (state/get-current-repo)
          db-based? (config/db-based-graph? repo)
          icon (icon/get-node-icon-cp page {:size 16})
          title (:block/title page)
          untitled? (db-model/untitled-page? title)
          name (:block/name page)
          file-rpath (when (util/electron?) (page-util/get-page-file-rpath name))
          ctx-icon #(shui/tabler-icon %1 {:class "scale-90 pr-1 opacity-80"})
          open-in-sidebar #(state/sidebar-add-block!
                            (state/get-current-repo)
                            (:db/id page)
                            :page)
          x-menu-content (fn []
                           (let [x-menu-item shui/dropdown-menu-item
                                 x-menu-shortcut shui/dropdown-menu-shortcut]
                             [:<>
                              (when-not recent?
                                (x-menu-item
                                 {:key "unfavorite"
                                  :on-click #(page-handler/<unfavorite-page! (if db-based? (str (:block/uuid page)) title))}
                                 (ctx-icon "star-off")
                                 (t :page/unfavorite)
                                 (x-menu-shortcut (when-let [binding (shortcut-dh/shortcut-binding :command/toggle-favorite)]
                                                    (some-> binding
                                                            (first)
                                                            (shortcut-utils/decorate-binding))))))
                              (when-let [page-fpath (and (util/electron?) file-rpath
                                                         (config/get-repo-fpath (state/get-current-repo) file-rpath))]
                                [:<>
                                 (x-menu-item
                                  {:key "open-in-folder"
                                   :on-click #(ipc/ipc :openFileInFolder page-fpath)}
                                  (ctx-icon "folder")
                                  (t :page/open-in-finder))

                                 (x-menu-item
                                  {:key "open with default app"
                                   :on-click #(js/window.apis.openPath page-fpath)}
                                  (ctx-icon "file")
                                  (t :page/open-with-default-app))])
                              (x-menu-item
                               {:key "open in sidebar"
                                :on-click open-in-sidebar}
                               (ctx-icon "layout-sidebar-right")
                               (t :content/open-in-sidebar)
                               (x-menu-shortcut (shortcut-utils/decorate-binding "shift+click")))]))]

    ;; TODO: move to standalone component
      [:a.link-item.group
       (cond->
        {:on-click
         (fn [e]
           (if (gobj/get e "shiftKey")
             (open-in-sidebar)
             (route-handler/redirect-to-page! (:block/uuid page) {:click-from-recent? recent?})))
         :on-context-menu (fn [^js e]
                            (shui/popup-show! e (x-menu-content)
                                              {:as-dropdown? true
                                               :content-props {:on-click (fn [] (shui/popup-hide!))
                                                               :class "w-60"}})
                            (util/stop e))}
         (ldb/object? page)
         (assoc :title (block-handler/block-unique-title page)))
       [:span.page-icon {:key "page-icon"} icon]
       [:span.page-title {:key "title"
                          :class (when untitled? "opacity-50")
                          :style {:display "ruby"}}
        (cond
          (not (db/page? page))
          (block/inline-text :markdown (:block/title page))
          untitled? (t :untitled)
          :else (let [title' (pdf-utils/fix-local-asset-pagename title)
                      parent (:block/parent page)]
                  (if (and parent
                           (not (or (ldb/class? page)
                                    (and (:logseq.property/built-in? parent)
                                         (= (:block/title parent)
                                            common-config/library-page-name)))))
                    (str (:block/title parent) ns-util/parent-char title')
                    title')))]

     ;; dots trigger
       (shui/button
        {:key "more actions"
         :size :sm
         :variant :ghost
         :class "absolute !bg-transparent right-0 top-0 px-1.5 scale-75 opacity-40 hidden group-hover:block hover:opacity-80 active:opacity-100"
         :on-click #(do
                      (shui/popup-show! (.-target %) (x-menu-content)
                                        {:as-dropdown? true
                                         :content-props {:on-click (fn [] (shui/popup-hide!))
                                                         :class "w-60"}})
                      (util/stop %))}
        [:i.relative {:style {:top "4px"}} (shui/tabler-icon "dots")])])))

(defn sidebar-item
  [{:keys [on-click-handler class title icon icon-extension? active href shortcut more]}]
  [:div
   {:key class
    :class (util/classnames [class {:active active}])}
   [:a.item.group.flex.items-center.text-sm.rounded-md.font-medium
    {:on-click on-click-handler
     :class (when active "active")
     :href href}
    (ui/icon (str icon) {:extension? icon-extension? :size 16})
    [:span.flex-1 title]
    (when shortcut
      [:span.ml-1
       (ui/render-keyboard-shortcut
        (ui/keyboard-shortcut-from-config shortcut {:pick-first? true}))])
    more]])

(rum/defc sidebar-graphs
  []
  [:div.sidebar-graphs
   (repo/graphs-selector)])

(rum/defc sidebar-navigations-edit-content
  [{:keys [_id navs checked-navs set-checked-navs!]}]
  (let [[local-navs set-local-navs!] (rum/use-state checked-navs)]

    (hooks/use-effect!
     (fn []
       (set-checked-navs! local-navs))
     [local-navs])

    (for [nav navs
          :let [name' (name nav)]]
      (shui/dropdown-menu-checkbox-item
       {:checked (contains? (set local-navs) nav)
        :onCheckedChange (fn [v] (set-local-navs!
                                  (fn []
                                    (if v
                                      (conj local-navs nav)
                                      (filterv #(not= nav %) local-navs)))))}
       (tt (keyword "left-side-bar" name')
           (keyword "right-side-bar" name'))))))

(rum/defc ^:large-vars/cleanup-todo sidebar-navigations
  [{:keys [default-home route-match route-name srs-open? db-based? enable-whiteboards?]}]
  (let [navs (cond-> [:flashcards :graph-view :all-pages]
               db-based?
               (concat [:tag/tasks :tag/assets])
               (not db-based?)
               (#(cons :whiteboards %)))
        [checked-navs set-checked-navs!] (rum/use-state (or (storage/get :ls-sidebar-navigations)
                                                            [:whiteboards :flashcards :graph-view :all-pages]))]

    (hooks/use-effect!
     (fn []
       (when (vector? checked-navs)
         (storage/set :ls-sidebar-navigations checked-navs)))
     [checked-navs])

    (sidebar-content-group
     [:a.wrap-th [:strong.flex-1 "Navigations"]]
     {:collapsable? false
      :enter-show-more? true
      :header-props {:on-click (fn [^js e] (when-let [^js _el (some-> (.-target e) (.closest ".as-edit"))]
                                             (shui/popup-show! _el
                                                               #(sidebar-navigations-edit-content
                                                                 {:id (:id %) :navs navs
                                                                  :checked-navs checked-navs
                                                                  :set-checked-navs! set-checked-navs!})
                                                               {:as-dropdown? false})))}
      :more [:a.as-edit {:class "!opacity-60 hover:!opacity-80 relative -top-0.5 -right-0.5"}
             (shui/tabler-icon "filter-edit" {:size 14})]}
     [:div.sidebar-navigations.flex.flex-col.mt-1
       ;; required custom home page
      (let [page (:page default-home)
            enable-journals? (state/enable-journals? (state/get-current-repo))]
        (if (and page (not enable-journals?))
          (sidebar-item
           {:class "home-nav"
            :title page
            :on-click-handler route-handler/redirect-to-home!
            :active (and (not srs-open?)
                         (= route-name :page)
                         (= page (get-in route-match [:path-params :name])))
            :icon "home"
            :shortcut :go/home})

          (when enable-journals?
            (sidebar-item
             {:class "journals-nav"
              :active (and (not srs-open?)
                           (or (= route-name :all-journals) (= route-name :home)))
              :title (t :left-side-bar/journals)
              :on-click-handler (fn [e]
                                  (if (gobj/get e "shiftKey")
                                    (route-handler/sidebar-journals!)
                                    (route-handler/go-to-journals!)))
              :icon "calendar"
              :shortcut :go/journals}))))

      (for [nav checked-navs]
        (cond
          (= nav :whiteboards)
          (when enable-whiteboards?
            (when (not db-based?)
              (sidebar-item
               {:class "whiteboard"
                :title (t :right-side-bar/whiteboards)
                :href (rfe/href :whiteboards)
                :on-click-handler (fn [_e] (whiteboard-handler/onboarding-show))
                :active (and (not srs-open?) (#{:whiteboard :whiteboards} route-name))
                :icon "writing"
                :shortcut :go/whiteboards})))

          (= nav :flashcards)
          (when (state/enable-flashcards? (state/get-current-repo))
            (let [num (state/sub :srs/cards-due-count)]
              (sidebar-item
               {:class "flashcards-nav"
                :title (t :right-side-bar/flashcards)
                :icon "infinity"
                :shortcut :go/flashcards
                :active srs-open?
                :on-click-handler #(do (fsrs/update-due-cards-count)
                                       (state/pub-event! [:modal/show-cards]))
                :more (when (and num (not (zero? num)))
                        [:span.ml-1.inline-block.py-0.5.px-3.text-xs.font-medium.rounded-full.fade-in num])})))

          (= nav :graph-view)
          (sidebar-item
           {:class "graph-view-nav"
            :title (t :right-side-bar/graph-view)
            :href (rfe/href :graph)
            :active (and (not srs-open?) (= route-name :graph))
            :icon "hierarchy"
            :shortcut :go/graph-view})

          (= nav :all-pages)
          (sidebar-item
           {:class "all-pages-nav"
            :title (t :right-side-bar/all-pages)
            :href (rfe/href :all-pages)
            :active (and (not srs-open?) (= route-name :all-pages))
            :icon "files"})

          (= (namespace nav) "tag")
          (when db-based?
            (let [name'' (name nav)
                  class-ident (get {"assets" :logseq.class/Asset  "tasks" :logseq.class/Task} name'')]
              (when-let [tag-uuid (and class-ident (:block/uuid (db/entity class-ident)))]
                (sidebar-item
                 {:class (str "tag-view-nav " name'')
                  :title (tt (keyword "left-side-bar" name'')
                             (keyword "right-side-bar" name''))
                  :href (rfe/href :page {:name tag-uuid})
                  :active (= (str tag-uuid) (get-in route-match [:path-params :name]))
                  :icon "hash"}))))))])))

(rum/defc sidebar-favorites < rum/reactive
  []
  (let [_favorites-updated? (state/sub :favorites/updated?)
        favorite-entities (page-handler/get-favorites)]
    (sidebar-content-group
     [:a.wrap-th
      [:strong.flex-1 (t :left-side-bar/nav-favorites)]]

     {:class "favorites"
      :count (count favorite-entities)
      :edit-fn
      (fn [e]
        (rfe/push-state :page {:name "Favorites"})
        (util/stop e))}
     (when (seq favorite-entities)
       (let [favorite-items (map
                             (fn [e]
                               {:id (str (:db/id e))
                                :value (:block/uuid e)
                                :content [:li.favorite-item.font-medium (page-name e false)]})
                             favorite-entities)]
         (dnd-component/items favorite-items
                              {:on-drag-end (fn [favorites']
                                              (page-handler/<reorder-favorites! favorites'))
                               :parent-node :ul.favorites.text-sm}))))))

(rum/defc sidebar-recent-pages < rum/reactive db-mixins/query
  []
  (let [pages (recent-handler/get-recent-pages)]
    (sidebar-content-group
     [:a.wrap-th [:strong.flex-1 (t :left-side-bar/nav-recent-pages)]]

     {:class "recent"
      :count (count pages)}

     [:ul.text-sm
      (for [page pages]
        [:li.recent-item.select-none.font-medium
         {:key (str "recent-" (:db/id page))
          :title (block-handler/block-unique-title page)}
         (page-name page true)])])))

(defn get-default-home-if-valid
  []
  (when-let [default-home (state/get-default-home)]
    (let [page (:page default-home)
          page (when (and (string? page)
                          (not (string/blank? page)))
                 (db/get-page page))]
      (if page
        default-home
        (dissoc default-home :page)))))

(rum/defc ^:large-vars/cleanup-todo sidebar-container
  [route-match close-modal-fn left-sidebar-open? enable-whiteboards? srs-open?
   *closing? close-signal touching-x-offset]
  (let [[local-closing? set-local-closing?] (rum/use-state false)
        [el-rect set-el-rect!] (rum/use-state nil)
        ref-el (rum/use-ref nil)
        ref-open? (rum/use-ref left-sidebar-open?)
        db-based? (config/db-based-graph? (state/get-current-repo))
        default-home (get-default-home-if-valid)
        route-name (get-in route-match [:data :name])
        on-contents-scroll #(when-let [^js el (.-target %)]
                              (let [top (.-scrollTop el)
                                    cls (.-classList el)
                                    cls' "is-scrolled"]
                                (if (> top 2)
                                  (.add cls cls')
                                  (.remove cls cls'))))
        close-fn #(set-local-closing? true)
        touching-x-offset (when (number? touching-x-offset)
                            (if-not left-sidebar-open?
                              (when (> touching-x-offset 0)
                                (min touching-x-offset (:width el-rect)))
                              (when (< touching-x-offset 0)
                                (max touching-x-offset (- 0 (:width el-rect))))))
        offset-ratio (and (number? touching-x-offset)
                          (some->> (:width el-rect)
                                   (/ touching-x-offset)))]

    (hooks/use-effect!
     #(js/setTimeout
       (fn [] (some-> (rum/deref ref-el)
                      (.getBoundingClientRect)
                      (.toJSON)
                      (js->clj :keywordize-keys true)
                      (set-el-rect!)))
       16)
     [])

    (hooks/use-layout-effect!
     (fn []
       (when (and (rum/deref ref-open?) local-closing?)
         (reset! *closing? true))
       (rum/set-ref! ref-open? left-sidebar-open?)
       #())
     [local-closing? left-sidebar-open?])

    (hooks/use-effect!
     (fn []
       (when-not (neg? close-signal)
         (close-fn)))
     [close-signal])

    [:<>
     [:div.left-sidebar-inner.flex-1.flex.flex-col.min-h-0
      {:key "left-sidebar"
       :ref ref-el
       :style (cond-> {}
                (and (number? offset-ratio)
                     (> touching-x-offset 0))
                (assoc :transform (str "translate3d(calc(" touching-x-offset "px - 100%), 0, 0)"))

                (and (number? offset-ratio)
                     (< touching-x-offset 0))
                (assoc :transform (str "translate3d(" (* offset-ratio 100) "%, 0, 0)")))
       :on-transition-end (fn []
                            (when local-closing?
                              (reset! *closing? false)
                              (set-local-closing? false)
                              (close-modal-fn)))
       :on-click #(when-let [^js target (and (util/sm-breakpoint?) (.-target %))]
                    (when (some (fn [sel] (boolean (.closest target sel)))
                                [".favorites .bd" ".recent .bd" ".dropdown-wrapper" ".nav-header"])
                      (close-fn)))}

      [:div.wrap
       [:div.sidebar-header-container
        ;; sidebar graphs
        (when (not config/publishing?)
          (sidebar-graphs))

        ;; sidebar sticky navigations
        (sidebar-navigations
         {:default-home default-home
          :route-match route-match
          :db-based? db-based?
          :enable-whiteboards? enable-whiteboards?
          :route-name route-name
          :srs-open? srs-open?})]

       [:div.sidebar-contents-container
        {:on-scroll on-contents-scroll}
        (sidebar-favorites)

        (when (not config/publishing?)
          (sidebar-recent-pages))]]]

     [:span.shade-mask
      (cond-> {:on-click close-fn
               :key "shade-mask"}
        (number? offset-ratio)
        (assoc :style {:opacity (cond-> offset-ratio
                                  (neg? offset-ratio)
                                  (+ 1))}))]]))

(rum/defc sidebar-resizer
  []
  (let [*el-ref (rum/use-ref nil)
        ^js el-doc js/document.documentElement
        adjust-size! (fn [width]
                       (.setProperty (.-style el-doc) "--ls-left-sidebar-width" width)
                       (storage/set :ls-left-sidebar-width width))]

    ;; restore size
    (hooks/use-layout-effect!
     (fn []
       (when-let [width (storage/get :ls-left-sidebar-width)]
         (.setProperty (.-style el-doc) "--ls-left-sidebar-width" width))))

    ;; draggable handler
    (hooks/use-effect!
     (fn []
       (when-let [el (and (fn? js/window.interact) (rum/deref *el-ref))]
         (let [^js sidebar-el (.querySelector el-doc "#left-sidebar")]
           (-> (js/interact el)
               (.draggable
                #js {:listeners
                     #js {:move (fn [^js/MouseEvent e]
                                  (when-let [offset (.-left (.-rect e))]
                                    (let [width (.toFixed (max (min offset 460) 240) 2)]
                                      (adjust-size! (str width "px")))))}})
               (.styleCursor false)
               (.on "dragstart" (fn []
                                  (.. sidebar-el -classList (add "is-resizing"))
                                  (.. el-doc -classList (add "is-resizing-buf"))))
               (.on "dragend" (fn []
                                (.. sidebar-el -classList (remove "is-resizing"))
                                (.. el-doc -classList (remove "is-resizing-buf"))))))
         #()))
     [])
    [:span.left-sidebar-resizer {:ref *el-ref}]))

(rum/defcs left-sidebar < rum/reactive
  (rum/local false ::closing?)
  (rum/local -1 ::close-signal)
  (rum/local nil ::touch-state)
  [s {:keys [left-sidebar-open? route-match]}]
  (let [close-fn #(state/set-left-sidebar-open! false)
        *closing? (::closing? s)
        *touch-state (::touch-state s)
        *close-signal (::close-signal s)
        enable-whiteboards? (state/enable-whiteboards?)
        touch-point-fn (fn [^js e] (some-> (gobj/get e "touches") (aget 0) (#(hash-map :x (.-clientX %) :y (.-clientY %)))))
        srs-open? (= :srs (state/sub :modal/id))
        touching-x-offset (and (some-> @*touch-state :after)
                               (some->> @*touch-state
                                        ((juxt :after :before))
                                        (map :x) (apply -)))
        touch-pending? (> (abs touching-x-offset) 20)]

    [:div#left-sidebar.cp__sidebar-left-layout
     {:class (util/classnames [{:is-open left-sidebar-open?
                                :is-closing @*closing?
                                :is-touching touch-pending?}])
      :on-touch-start
      (fn [^js e]
        (reset! *touch-state {:before (touch-point-fn e)}))
      :on-touch-move
      (fn [^js e]
        (when @*touch-state
          (some-> *touch-state (swap! assoc :after (touch-point-fn e)))))
      :on-touch-end
      (fn []
        (when touch-pending?
          (cond
            (and (not left-sidebar-open?) (> touching-x-offset 40))
            (state/set-left-sidebar-open! true)

            (and left-sidebar-open? (< touching-x-offset -30))
            (reset! *close-signal (inc @*close-signal))))
        (reset! *touch-state nil))}

     ;; sidebar contents
     (sidebar-container route-match close-fn left-sidebar-open? enable-whiteboards? srs-open? *closing?
                        @*close-signal (and touch-pending? touching-x-offset))

     ;; resizer
     (sidebar-resizer)]))

(rum/defc recording-bar
  []
  [:> react-draggable
   {:onStart (fn [_event]
               (when-let [pos (some-> (state/get-input) cursor/pos)]
                 (state/set-editor-last-pos! pos)))
    :onStop (fn [_event]
              (when-let [block (get @(get @state/state :editor/block) :block/uuid)]
                (editor-handler/edit-block! block :max)
                (when-let [input (state/get-input)]
                  (when-let [saved-cursor (state/get-editor-last-pos)]
                    (cursor/move-cursor-to input saved-cursor)))))}
   [:div#audio-record-toolbar
    {:style {:bottom (+ @util/keyboard-height 45)}}
    (footer/audio-record-cp)]])

(rum/defc main <
  {:did-mount (fn [state]
                (when-let [element (gdom/getElement "main-content-container")]
                  (dnd/subscribe!
                   element
                   :upload-files
                   {:drop (fn [_e files]
                            (when-let [id (state/get-edit-input-id)]
                              (let [format (get (state/get-edit-block) :block/format :markdown)]
                                (editor-handler/upload-asset! id files format editor-handler/*asset-uploading? true))))})
                  (common-handler/listen-to-scroll! element)
                  (when (:margin-less-pages? (first (:rum/args state))) ;; makes sure full screen pages displaying without scrollbar
                    (set! (.. element -scrollTop) 0)))
                state)
   :will-unmount (fn [state]
                   (when-let [el (gdom/getElement "main-content-container")]
                     (dnd/unsubscribe! el :upload-files))
                   state)}
  [{:keys [route-match margin-less-pages? route-name indexeddb-support? db-restoring? main-content show-recording-bar?]}]
  (let [left-sidebar-open? (state/sub :ui/left-sidebar-open?)
        onboarding-and-home? (and (or (nil? (state/get-current-repo)) (config/demo-graph?))
                                  (not config/publishing?)
                                  (= :home route-name))
        margin-less-pages? (or (and (mobile-util/native-platform?) onboarding-and-home?) margin-less-pages?)]
    [:div#main-container.cp__sidebar-main-layout.flex-1.flex
     {:class (util/classnames [{:is-left-sidebar-open left-sidebar-open?}])}

     ;; desktop left sidebar layout
     (left-sidebar {:left-sidebar-open? left-sidebar-open?
                    :route-match route-match})

     [:div#main-content-container.scrollbar-spacing.w-full.flex.justify-center.flex-row.outline-none.relative

      {:tabIndex "-1"
       :data-is-margin-less-pages margin-less-pages?}

      [:div.cp__sidebar-main-content
       {:data-is-margin-less-pages margin-less-pages?
        :data-is-full-width (or margin-less-pages?
                                (contains? #{:all-files :all-pages :my-publishing} route-name))}

       (when show-recording-bar?
         (recording-bar))

       (footer/footer)

       (cond
         (not indexeddb-support?)
         nil

         db-restoring?
         (if config/publishing?
           [:div.space-y-2
            (shui/skeleton {:class "h-8 w-1/3 mb-8 bg-gray-400"})
            (shui/skeleton {:class "h-6 w-full bg-gray-400"})
            (shui/skeleton {:class "h-6 w-full bg-gray-400"})]
           [:div.space-y-2
            (shui/skeleton {:class "h-8 w-1/3 mb-8"})
            (shui/skeleton {:class "h-6 w-full"})
            (shui/skeleton {:class "h-6 w-full"})])

         :else
         [:div
          {:class (if (or onboarding-and-home? margin-less-pages?) "" (util/hiccup->class "mx-auto.pb-24"))
           :style {:margin-bottom (cond
                                    margin-less-pages? 0
                                    onboarding-and-home? 0
                                    :else 120)}}
          main-content])

       (comment
         (when onboarding-and-home?
           (onboarding/intro onboarding-and-home?)))]]]))

(defonce sidebar-inited? (atom false))
;; TODO: simplify logic

(rum/defc parsing-progress < rum/static
  [state]
  (let [finished (or (:finished state) 0)
        total (:total state)
        width (js/Math.round (* (.toFixed (/ finished total) 2) 100))
        display-filename (some-> (:current-parsing-file state)
                                 not-empty
                                 path/filename)
        left-label [:div.flex.flex-row.font-bold
                    (t :parsing-files)
                    [:div.hidden.md:flex.flex-row
                     [:span.mr-1 ": "]
                     [:div.text-ellipsis-wrapper {:style {:max-width 300}}
                      display-filename]]]]
    (ui/progress-bar-with-label width left-label (str finished "/" total))))

(rum/defc main-content < rum/reactive db-mixins/query
  {:init (fn [state]
           (when-not @sidebar-inited?
             (let [current-repo (state/sub :git/current-repo)
                   default-home (get-default-home-if-valid)
                   sidebar (:sidebar default-home)
                   sidebar (if (string? sidebar) [sidebar] sidebar)]
               (when-let [pages (->> (seq sidebar)
                                     (remove string/blank?))]
                 (doseq [page pages]
                   (let [page (util/safe-page-name-sanity-lc page)
                         [db-id block-type] (if (= page "contents")
                                              [(or (:db/id (db/get-page page)) "contents") :contents]
                                              [(:db/id (db/get-page page)) :page])]
                     (state/sidebar-add-block! current-repo db-id block-type)))
                 (reset! sidebar-inited? true))))
           state)}
  []
  (let [default-home (get-default-home-if-valid)
        current-repo (state/sub :git/current-repo)
        loading-files? (when current-repo (state/sub [:repo/loading-files? current-repo]))
        graph-parsing-state (state/sub [:graph/parsing-state current-repo])]
    (cond
      (or
       (:graph-loading? graph-parsing-state)
       (not= (:total graph-parsing-state) (:finished graph-parsing-state)))
      [:div.flex.items-center.justify-center.full-height-without-header
       [:div.flex-1
        (parsing-progress graph-parsing-state)]]

      :else
      [:div
       (cond
         (and default-home
              (= :home (state/get-current-route))
              (not (state/route-has-p?))
              (:page default-home))
         (route-handler/redirect-to-page! (:page default-home))

         (or (not (state/enable-journals? current-repo))
             (let [latest-journals (db/get-latest-journals (state/get-current-repo) 1)]
               (and config/publishing?
                    (not default-home)
                    (empty? latest-journals))))
         (route-handler/redirect! {:to :all-pages})

         loading-files?
         (ui/loading (t :loading-files))

         :else
         (journal/all-journals))])))

(defn- hide-context-menu-and-clear-selection
  [e & {:keys [esc?]}]
  (state/hide-custom-context-menu!)
  (when-not (or (gobj/get e "shiftKey")
                (util/meta-key? e)
                (state/get-edit-input-id)
                (some-> (.-target e) util/input?)
                (= (shui-dialog/get-last-modal-id) :property-dialog)
                (some-> (.-target e) (.closest ".ls-block"))
                (some-> (.-target e) (.closest "[data-keep-selection]")))
    (if (and esc? (editor-handler/popup-exists? :selection-action-bar))
      (state/pub-event! [:editor/hide-action-bar])
      (editor-handler/clear-selection!))))

(rum/defc render-custom-context-menu
  [links position]
  (let [ref (rum/use-ref nil)]
    (hooks/use-effect!
     #(let [el (rum/deref ref)
            {:keys [x y]} (util/calc-delta-rect-offset el js/document.documentElement)]
        (set! (.. el -style -transform)
              (str "translate3d(" (if (neg? x) x 0) "px," (if (neg? y) (- y 10) 0) "px" ",0)"))))
    [:<>
     [:div.menu-backdrop {:on-pointer-down (fn [e] (hide-context-menu-and-clear-selection e))}]
     [:div#custom-context-menu
      {:ref ref
       :style {:z-index 999
               :left (str (first position) "px")
               :top (str (second position) "px")}} links]]))

(rum/defc custom-context-menu < rum/reactive
  []
  (let [show? (state/sub :custom-context-menu/show?)
        links (state/sub :custom-context-menu/links)
        position (state/sub :custom-context-menu/position)]
    (when (and show? links position)
      (render-custom-context-menu links position))))

(rum/defc new-block-mode < rum/reactive
  []
  (when (state/sub [:document/mode?])
    (ui/tooltip
     [:a.block.px-1.text-sm.font-medium.bg-base-2.rounded-md.mx-2
      {:on-click state/toggle-document-mode!}
      "D"]
     [:div.p-2
      [:p.mb-2 [:b "Document mode"]]
      [:ul
       [:li
        [:div.inline-block.mr-1 (ui/render-keyboard-shortcut (shortcut-dh/gen-shortcut-seq :editor/new-line))]
        [:p.inline-block "to create new block"]]
       [:li
        [:p.inline-block.mr-1 "Click `D` or type"]
        [:div.inline-block.mr-1 (ui/render-keyboard-shortcut (shortcut-dh/gen-shortcut-seq :ui/toggle-document-mode))]
        [:p.inline-block "to toggle document mode"]]]])))

(def help-menu-items
  [{:title "Handbook" :icon "book-2" :on-click #(handbooks/toggle-handbooks)}
   {:title "Keyboard shortcuts" :icon "command" :on-click #(state/sidebar-add-block! (state/get-current-repo) "shortcut-settings" :shortcut-settings)}
   {:title "Documentation" :icon "help" :href "https://docs.logseq.com/"}
   :hr
   {:title "Report bug" :icon "bug" :on-click #(rfe/push-state :bug-report)}
   {:title "Request feature" :icon "git-pull-request" :href "https://discuss.logseq.com/c/feedback/feature-requests/"}
   {:title "Submit feedback" :icon "messages" :href "https://discuss.logseq.com/c/feedback/13"}
   :hr
   {:title "Ask the community" :icon "brand-discord" :href "https://discord.com/invite/KpN4eHY"}
   {:title "Support forum" :icon "message" :href "https://discuss.logseq.com/"}
   :hr
   {:title "Release notes" :icon "asterisk" :href "https://docs.logseq.com/#/page/changelog"}])

(rum/defc help-menu-popup
  []

  (hooks/use-effect!
   (fn []
     (state/set-state! :ui/handbooks-open? false))
   [])

  (hooks/use-effect!
   (fn []
     (let [h #(state/set-state! :ui/help-open? false)]
       (.addEventListener js/document.body "click" h)
       #(.removeEventListener js/document.body "click" h)))
   [])

  [:div.cp__sidebar-help-menu-popup
   [:div.list-wrap
    (for [[idx {:keys [title icon href on-click] :as item}] (medley/indexed help-menu-items)]
      (case item
        :hr
        [:hr.my-2 {:key idx}]

        ;; default
        [:a.it.flex.items-center.px-4.py-1.select-none
         {:key title
          :on-click (fn []
                      (cond
                        (fn? on-click) (on-click)
                        (string? href) (util/open-url href))
                      (state/set-state! :ui/help-open? false))}
         [:span.flex.items-center.pr-2.opacity-40 (ui/icon icon {:size 20})]
         [:strong.font-normal title]]))]
   [:div.ft.pl-11.pb-3
    [:span.opacity.text-xs.opacity-30 "Logseq " version]]])

(rum/defc help-button < rum/reactive
  []
  (let [help-open? (state/sub :ui/help-open?)
        handbooks-open? (state/sub :ui/handbooks-open?)]
    [:<>
     [:div.cp__sidebar-help-btn
      [:div.inner
       {:title (t :help-shortcut-title)
        :on-click #(state/toggle! :ui/help-open?)}
       [:svg.scale-125 {:stroke "currentColor", :fill "none", :stroke-linejoin "round", :width "24", :view-box "0 0 24 24", :xmlns "http://www.w3.org/2000/svg", :stroke-linecap "round", :stroke-width "2", :class "icon icon-tabler icon-tabler-help-small", :height "24"}
        [:path {:stroke "none", :d "M0 0h24v24H0z", :fill "none"}]
        [:path {:d "M12 16v.01"}]
        [:path {:d "M12 13a2 2 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483"}]]]]

     (when help-open?
       (help-menu-popup))

     (when handbooks-open?
       (handbooks/handbooks-popup))]))

(rum/defc app-context-menu-observer
  < rum/static
  (mixins/event-mixin
   (fn [state]
        ;; fixme: this mixin will register global event listeners on window
        ;; which might cause unexpected issues
     (mixins/listen state js/window "contextmenu"
                    (fn [^js e]
                      (let [target (gobj/get e "target")
                            block-el (.closest target ".bullet-container[blockid]")
                            block-id (some-> block-el (.getAttribute "blockid"))
                            {:keys [block block-ref]} (state/sub :block-ref/context)
                            {:keys [page page-entity]} (state/sub :page-title/context)]

                        (let [show!
                              (fn [content & {:as option}]
                                (shui/popup-show! e
                                                  (fn [{:keys [id]}]
                                                    [:div {:on-click #(shui/popup-hide! id)
                                                           :data-keep-selection true}
                                                     content])
                                                  (merge
                                                   {:on-before-hide state/dom-clear-selection!
                                                    :on-after-hide state/state-clear-selection!
                                                    :content-props {:class "w-[280px] ls-context-menu-content"}
                                                    :as-dropdown? true}
                                                   option)))

                              handled
                              (cond
                                (and page (not block-id))
                                (do
                                  (show! (cp-content/page-title-custom-context-menu-content page-entity))
                                  (state/set-state! :page-title/context nil))

                                block-ref
                                (do
                                  (show! (cp-content/block-ref-custom-context-menu-content block block-ref))
                                  (state/set-state! :block-ref/context nil))

                                ;; block selection
                                (and (state/selection?) (not (d/has-class? target "bullet")))
                                (show! (cp-content/custom-context-menu-content)
                                       {:id :blocks-selection-context-menu})

                                ;; block bullet
                                (and block-id (parse-uuid block-id))
                                (let [block (.closest target ".ls-block")
                                      property-default-value? (when block
                                                                (= "true" (d/attr block "data-is-property-default-value")))]
                                  (when block
                                    (state/clear-selection!)
                                    (state/conj-selection-block! block :down))
                                  (p/do!
                                   (db-async/<get-block (state/get-current-repo) (uuid block-id) {:children? false})
                                   (show! (cp-content/block-context-menu-content target (uuid block-id) property-default-value?))))

                                :else
                                false)]
                          (when (not (false? handled))
                            (util/stop e))))))))
  []
  nil)

(defn- on-mouse-up
  [e]
  (when-not (or (.closest (.-target e) ".block-control-wrap")
                (.closest (.-target e) "button")
                (.closest (.-target e) "input")
                (.closest (.-target e) "textarea")
                (.closest (.-target e) "a"))
    (editor-handler/show-action-bar!)))

(rum/defcs ^:large-vars/cleanup-todo root-container < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "pointerdown" hide-context-menu-and-clear-selection)
     (mixins/listen state js/window "keydown"
                    (fn [e]
                      (cond
                        (= 27 (.-keyCode e))
                        (if (and (state/modal-opened?)
                                 (not
                                  (and
                                                                          ;; FIXME: this does not work on CI tests
                                   util/node-test?
                                   (state/editing?))))
                          (state/close-modal!)
                          (hide-context-menu-and-clear-selection e {:esc? true})))
                      (state/set-ui-last-key-code! (.-key e))))
     (mixins/listen state js/window "keyup"
                    (fn [_e]
                      (state/set-state! :editor/latest-shortcut nil)))))
  [state route-match main-content']
  (let [current-repo (state/sub :git/current-repo)
        theme (state/sub :ui/theme)
        accent-color (some-> (state/sub :ui/radix-color) (name))
        editor-font (some-> (state/sub :ui/editor-font) (name))
        system-theme? (state/sub :ui/system-theme?)
        light? (= "light" (state/sub :ui/theme))
        sidebar-open? (state/sub :ui/sidebar-open?)
        settings-open? (state/sub :ui/settings-open?)
        left-sidebar-open? (state/sub :ui/left-sidebar-open?)
        wide-mode? (state/sub :ui/wide-mode?)
        ls-block-hl-colored? (state/sub :pdf/block-highlight-colored?)
        onboarding-state (state/sub :file-sync/onboarding-state)
        right-sidebar-blocks (state/sub-right-sidebar-blocks)
        route-name (get-in route-match [:data :name])
        margin-less-pages? (or (boolean (#{:graph} route-name))
                               (db-model/whiteboard-page? (state/get-current-page)))
        db-restoring? (state/sub :db/restoring?)
        indexeddb-support? (state/sub :indexeddb/support?)
        page? (= :page route-name)
        home? (= :home route-name)
        native-titlebar? (state/sub [:electron/user-cfgs :window/native-titlebar?])
        window-controls? (and (util/electron?) (not util/mac?) (not native-titlebar?))
        edit? (state/editing?)
        default-home (get-default-home-if-valid)
        logged? (user-handler/logged-in?)
        fold-button-on-right? (state/enable-fold-button-right?)
        show-action-bar? (state/sub :mobile/show-action-bar?)
        show-recording-bar? (state/sub :mobile/show-recording-bar?)
        preferred-language (state/sub [:preferred-language])]
    (theme/container
     {:t t
      :theme theme
      :accent-color accent-color
      :editor-font editor-font
      :route route-match
      :current-repo current-repo
      :edit? edit?

      :db-restoring? db-restoring?
      :sidebar-open? sidebar-open?
      :settings-open? settings-open?
      :sidebar-blocks-len (count right-sidebar-blocks)
      :system-theme? system-theme?
      :onboarding-state onboarding-state
      :preferred-language preferred-language
      :on-click (fn [e]
                  (editor-handler/unhighlight-blocks!)
                  (util/fix-open-external-with-shift! e))}

     [:main.theme-container-inner#app-container-wrapper
      {:class (util/classnames
               [{:ls-left-sidebar-open left-sidebar-open?
                 :ls-right-sidebar-open sidebar-open?
                 :ls-wide-mode wide-mode?
                 :ls-window-controls window-controls?
                 :ls-fold-button-on-right fold-button-on-right?
                 :ls-hl-colored ls-block-hl-colored?}])
       :on-pointer-up (fn []
                        (when-let [container (gdom/getElement "app-container-wrapper")]
                          (d/remove-class! container "blocks-selection-mode")
                          (when (> (count (state/get-selection-blocks)) 1)
                            (util/clear-selection!))))}

      [:button#skip-to-main
       {:on-click #(ui/focus-element (ui/main-node))
        :on-key-up (fn [e]
                     (when (= "Enter" (.-key e))
                       (ui/focus-element (ui/main-node))))}
       (t :accessibility/skip-to-main-content)]
      [:div.#app-container
       {:on-mouse-up on-mouse-up}
       [:div#left-container
        {:class (if (state/sub :ui/sidebar-open?) "overflow-hidden" "w-full")}
        (header/header {:light? light?
                        :current-repo current-repo
                        :logged? logged?
                        :page? page?
                        :route-match route-match
                        :default-home default-home
                        :new-block-mode new-block-mode})
        (when (util/electron?)
          (find-in-page/search))

        (if (state/sub :rtc/uploading?)
          [:div.flex.items-center.justify-center.full-height-without-header
           (ui/loading "Creating remote graph...")]
          (main {:route-match route-match
                 :margin-less-pages? margin-less-pages?
                 :logged? logged?
                 :home? home?
                 :route-name route-name
                 :indexeddb-support? indexeddb-support?
                 :light? light?
                 :db-restoring? db-restoring?
                 :main-content main-content'
                 :show-action-bar? show-action-bar?
                 :show-recording-bar? show-recording-bar?}))]

       (when window-controls?
         (window-controls/container))

       (right-sidebar/sidebar)

       [:div#app-single-container]]

      (ui/notification)

      (shui-toaster/install-toaster)
      (shui-dialog/install-modals)
      (shui-popup/install-popups)

      (custom-context-menu)
      (plugins/custom-js-installer
       {:t t
        :current-repo current-repo
        :db-restoring? db-restoring?})
      (app-context-menu-observer)

      [:a#download.hidden]
      [:a#download-as-edn-v2.hidden]
      [:a#download-as-json-v2.hidden]
      [:a#download-as-transit-debug.hidden]
      [:a#download-as-sqlite-db.hidden]
      [:a#download-as-db-edn.hidden]
      [:a#download-as-roam-json.hidden]
      [:a#download-as-html.hidden]
      [:a#download-as-zip.hidden]
      [:a#export-as-markdown.hidden]
      [:a#export-as-opml.hidden]
      [:a#convert-markdown-to-unordered-list-or-heading.hidden]
      (when (and (not config/mobile?)
                 (not config/publishing?))
        (help-button))])))
