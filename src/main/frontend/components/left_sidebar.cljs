(ns frontend.components.left-sidebar
  "App left sidebar"
  (:require [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.dnd :as dnd-component]
            [frontend.components.icon :as icon]
            [frontend.components.repo :as repo]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.extensions.fsrs :as fsrs]
            [frontend.handler.block :as block-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.recent :as recent-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.tabs :as tabs-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.object :as gobj]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [reitit.frontend.easy :as rfe]
            [io.factorhouse.hsx.core :as hsx]))

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

(hsx/defc page-title-content
  [page-id display-title tooltip-title untitled? left-sidebar-resized-at]
  (let [*title-ref (hooks/use-ref nil)
        [truncated? set-truncated?!] (hooks/use-state false)
        sync-truncated! (fn []
                          (if-let [^js el (hooks/deref *title-ref)]
                            (set-truncated?! (> (.-scrollWidth el)
                                                (+ (.-clientWidth el) 1)))
                            (set-truncated?! false)))
        title-el [:span.page-title {:ref *title-ref
                                    :class (when untitled? "opacity-50")}
                  display-title]]
    (hooks/use-effect!
     (fn []
       (if-let [^js el (hooks/deref *title-ref)]
         (let [observer (js/ResizeObserver. (fn [_] (sync-truncated!)))]
           (.observe observer el)
           (sync-truncated!)
           #(.disconnect observer))
         (do
           (set-truncated?! false)
           nil)))
     [page-id display-title tooltip-title])
    (hooks/use-effect!
     (fn []
       (let [raf-id (js/requestAnimationFrame sync-truncated!)]
         #(js/cancelAnimationFrame raf-id)))
     [left-sidebar-resized-at])
    (if (and truncated? (not (string/blank? tooltip-title)))
      (ui/tooltip title-el tooltip-title)
      title-el)))

(hsx/defc ^:large-vars/cleanup-todo page-name
  [page recent?]
  (let [[left-sidebar-resized-at] (hooks/use-atom ui-handler/*left-sidebar-resized-at)
        id (:db/id page)
        page (db/sub-block id)]
    (when id
      (let [icon (icon/get-node-icon-cp page {:size 16})
            title (:block/title page)
            untitled? (db-model/untitled-page? title)
            display-title (cond
                            (not (db/page? page))
                            (block/inline-text :markdown (string/replace (apply str (take 64 (:block/title page))) "\n" " "))
                            untitled? (t :ui/untitled)
                            :else (block-handler/block-unique-title page))
            tooltip-title (or (block-handler/block-unique-title page)
                              (when untitled? (t :ui/untitled)))
            ctx-icon #(shui/tabler-icon %1 {:class "scale-90 pr-1 opacity-80"})
            open-in-sidebar #(state/sidebar-add-block!
                              (state/get-current-repo)
                              (:db/id page)
                              :page)
            x-menu-content (fn []
                             (let [x-menu-item shui/dropdown-menu-item]
                               [:<>
                                (when-not recent?
                                  (x-menu-item
                                   {:key "unfavorite"
                                    :on-click #(page-handler/<unfavorite-page! (str (:block/uuid page)))}
                                   (ctx-icon "star-off")
                                   (t :page/unfavorite)
                                   (ui/dropdown-shortcut :page/toggle-favorite)))
                                (x-menu-item
                                 {:key "open in sidebar"
                                  :on-click open-in-sidebar}
                                 (ctx-icon "layout-sidebar-right")
                                 (t :sidebar.right/open)
                                 (ui/dropdown-shortcut "shift+click"))]))]

    ;; TODO: move to standalone component
        [:a.link-item.group
         (if (util/mobile?)
           {:on-pointer-down util/stop-propagation
            :on-pointer-up (fn [_e]
                             (route-handler/redirect-to-page! (:block/uuid page) {:click-from-recent? recent?}))}
           (cond->
            {:on-click
             (fn [e]
               (let [cmd-key? (or (.-metaKey e) (.-ctrlKey e))
                     shift? (gobj/get e "shiftKey")]
                 (cond
                   (and cmd-key? (not shift?))
                   (tabs-handler/open-tab-by-page! (:block/uuid page) {:new-tab? true})

                   shift?
                   (open-in-sidebar)

                   :else
                   (route-handler/redirect-to-page! (:block/uuid page) {:click-from-recent? recent?}))))
             :on-context-menu (fn [^js e]
                                (shui/popup-show! e (x-menu-content)
                                                  {:as-dropdown? true
                                                   :content-props {:on-click (fn [] (shui/popup-hide!))
                                                                   :class "w-60"}})
                                (util/stop e))}
             (ldb/object? page)
             (assoc :title (block-handler/block-unique-title page))))
         [:span.page-icon {:key "page-icon"} icon]
         (page-title-content id display-title tooltip-title untitled? left-sidebar-resized-at)
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
           [:i.relative {:style {:top "4px"}} (shui/tabler-icon "dots")])]))))

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
      [:span.ml-1.mr-2.flex.items-center
       (ui/render-keyboard-shortcut
        (ui/keyboard-shortcut-from-config shortcut {:pick-first? true})
        :shortcut-id shortcut)])
    more]])

(hsx/defc sidebar-graphs
  []
  [:div.sidebar-graphs
   (repo/graphs-selector)])

(defn navigation-label-key
  [nav]
  (case nav
    :flashcards :nav/flashcards
    :all-pages :nav.all-pages/label
    :graph-view :nav/graph-view
    :tag/tasks :nav/tasks
    :tag/assets :nav/assets
    :nav/unknown))

(hsx/defc sidebar-navigations-edit-content
  [{:keys [_id navs checked-navs set-checked-navs!]}]
  (let [[local-navs set-local-navs!] (hooks/use-state checked-navs)]

    (hooks/use-effect!
     (fn []
       (set-checked-navs! local-navs))
     [local-navs])

    (for [nav navs]
      (shui/dropdown-menu-checkbox-item
       {:checked (contains? (set local-navs) nav)
        :onCheckedChange (fn [v] (set-local-navs!
                                  (fn []
                                    (if v
                                      (conj local-navs nav)
                                      (filterv #(not= nav %) local-navs)))))}
       (t (navigation-label-key nav))))))

(hsx/defc sidebar-content-group-body
  [child]
  [:div.bd child])

(hsx/defc sidebar-content-group
  [name {:keys [class count more header-props enter-show-more? collapsable?]} child]
  (let [collapsed? (state/use-sub [:ui/navigation-item-collapsed? class])]
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
      (when child
        ^{:key (str (or class "group") "-body")}
        [sidebar-content-group-body child])]]))

(hsx/defc ^:large-vars/cleanup-todo sidebar-navigations
  [{:keys [default-home route-match route-name srs-open?]}]
  (let [navs [:flashcards :all-pages :graph-view :tag/tasks :tag/assets]
        _preferred-language (state/use-sub [:preferred-language])
        cards-due-count (state/use-sub :srs/cards-due-count)
        [checked-navs set-checked-navs!] (hooks/use-state (or (storage/get :ls-sidebar-navigations)
                                                            [:flashcards :all-pages :graph-view]))]

    (hooks/use-effect!
     (fn []
       (when (vector? checked-navs)
         (storage/set :ls-sidebar-navigations checked-navs)))
     [checked-navs])

    (sidebar-content-group
      [:a.wrap-th [:strong.flex-1 (t :sidebar.left/navigations)]]
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
      (let [page (:page default-home)]
        (if page
          (sidebar-item
           {:class "home-nav"
            :title page
            :on-click-handler route-handler/redirect-to-home!
            :active (and (not srs-open?)
                         (= route-name :page)
                         (= page (get-in route-match [:path-params :name])))
            :icon "home"
            :shortcut :go/home})

          (sidebar-item
             {:class "journals-nav"
              :active (and (not srs-open?)
                           (or (= route-name :all-journals) (= route-name :home)))
              :title (t :nav/journals)
              :on-click-handler (fn [e]
                                  (let [cmd-key? (or (.-metaKey e) (.-ctrlKey e))
                                        shift? (gobj/get e "shiftKey")]
                                    (cond
                                      (and cmd-key? (not shift?))
                                      (tabs-handler/open-all-journals-in-tab!)

                                      shift?
                                      (route-handler/sidebar-journals!)

                                      :else
                                      (route-handler/go-to-journals!))))
              :icon "calendar"
              :shortcut :go/journals})))

      (for [nav checked-navs]
        (cond
          (= nav :flashcards)
          (when (state/enable-flashcards? (state/get-current-repo))
            (sidebar-item
             {:class "flashcards-nav"
              :title (t :nav/flashcards)
              :icon "cards"
              :shortcut :go/flashcards
              :active srs-open?
              :on-click-handler #(do (fsrs/update-due-cards-count)
                                     (state/pub-event! [:modal/show-cards]))
              :more (when (and cards-due-count (not (zero? cards-due-count)))
                      [:span.ml-1.inline-block.py-0.5.px-3.text-xs.font-medium.rounded-full.fade-in cards-due-count])}))

          (= nav :graph-view)
          (sidebar-item
           {:class "graph-view-nav"
            :title (t :nav/graph-view)
            :href (rfe/href :graph)
            :active (and (not srs-open?) (= route-name :graph))
            :icon "hierarchy"
            :shortcut :go/graph-view})

          (= nav :all-pages)
          (sidebar-item
           {:class "all-pages-nav"
            :title (t :nav.all-pages/label)
            :href (rfe/href :all-pages)
            :active (and (not srs-open?) (= route-name :all-pages))
            :icon "files"})

          (= (namespace nav) "tag")
          (let [name'' (name nav)
                class-ident (get {"assets" :logseq.class/Asset  "tasks" :logseq.class/Task} name'')]
            (when-let [tag-uuid (and class-ident (:block/uuid (db/entity class-ident)))]
              (sidebar-item
               {:class (str "tag-view-nav " name'')
                :title (t (navigation-label-key nav))
                :href (rfe/href :page {:name tag-uuid})
                :active (= (str tag-uuid) (get-in route-match [:path-params :name]))
                :icon "hash"})))))])))

(hsx/defc sidebar-favorites
  []
  (let [current-repo (state/use-sub :git/current-repo)
        db-restoring? (state/use-sub :db/restoring?)
        _favorites-updated? (state/use-sub :favorites/updated?)
        _preferred-language (state/use-sub [:preferred-language])
        favorite-entities (when (and current-repo (false? db-restoring?))
                            (page-handler/get-favorites))]
    (sidebar-content-group
     [:a.wrap-th
      [:strong.flex-1 (t :sidebar.left/favorites)]]

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

(hsx/defc sidebar-recent-pages
  []
  (let [current-repo (state/use-sub :git/current-repo)
        db-restoring? (state/use-sub :db/restoring?)
        _recent-page-ids (state/use-sub [:ui/recent-pages current-repo])
        _preferred-language (state/use-sub [:preferred-language])
        pages (when (and current-repo (false? db-restoring?))
                (recent-handler/get-recent-pages))]
       (sidebar-content-group
        [:a.wrap-th [:strong.flex-1 (t :sidebar.left/recent-pages)]]

        {:class "recent"
         :count (count pages)}

        [:ul.text-sm
         (for [page pages]
           [:li.recent-item.select-none.font-medium
            {:key (str "recent-" (:db/id page))}
            (page-name page true)])])))

(hsx/defc ^:large-vars/cleanup-todo sidebar-container
  [route-match close-modal-fn left-sidebar-open? srs-open?
   *closing? close-signal touching-x-offset]
  (let [[local-closing? set-local-closing?] (hooks/use-state false)
        [el-rect set-el-rect!] (hooks/use-state nil)
        ref-el (hooks/use-ref nil)
        ref-open? (hooks/use-ref left-sidebar-open?)
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
       (fn [] (some-> (hooks/deref ref-el)
                      (.getBoundingClientRect)
                      (.toJSON)
                      (js->clj :keywordize-keys true)
                      (set-el-rect!)))
       16)
     [])

    (hooks/use-layout-effect!
     (fn []
       (when (and (hooks/deref ref-open?) local-closing?)
         (reset! *closing? true))
       (hooks/set-ref! ref-open? left-sidebar-open?)
       #())
     [local-closing? left-sidebar-open?])

    (hooks/use-effect!
     (fn []
       (when-not (neg? close-signal)
         (close-fn)))
     [close-signal])

    [:<>
     [:div.left-sidebar-inner.as-container.flex-1.flex.flex-col.min-h-0
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

(hsx/defc sidebar-resizer
  []
  (let [*el-ref (hooks/use-ref nil)
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
       (when-let [el (and (fn? js/window.interact) (hooks/deref *el-ref))]
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
                                (.. el-doc -classList (remove "is-resizing-buf"))
                                (reset! ui-handler/*left-sidebar-resized-at (js/Date.now))))))
         #()))
     [])
    [:span.left-sidebar-resizer {:ref *el-ref}]))

(hsx/defc left-sidebar
  [{:keys [left-sidebar-open? route-match]}]
  (let [close-fn #(state/set-left-sidebar-open! false)
        *closing? (hooks/use-memo #(atom false) [])
        [closing?] (hooks/use-atom *closing?)
        [touch-state set-touch-state!] (hooks/use-state nil)
        [close-signal set-close-signal!] (hooks/use-state -1)
        touch-point-fn (fn [^js e] (some-> (gobj/get e "touches") (aget 0) (#(hash-map :x (.-clientX %) :y (.-clientY %)))))
        srs-open? (= :srs (state/use-sub :modal/id))
        touching-x-offset (and (some-> touch-state :after)
                               (some->> touch-state
                                        ((juxt :after :before))
                                        (map :x) (apply -)))
        touch-pending? (> (abs touching-x-offset) 20)]

    [:div#left-sidebar.cp__sidebar-left-layout
     {:class (util/classnames [{:is-open left-sidebar-open?
                                :is-closing closing?
                                :is-touching touch-pending?}])
      :on-touch-start
      (fn [^js e]
        (set-touch-state! {:before (touch-point-fn e)}))
      :on-touch-move
      (fn [^js e]
        (when touch-state
          (set-touch-state! (assoc touch-state :after (touch-point-fn e)))))
      :on-touch-end
      (fn []
        (when touch-pending?
          (cond
            (and (not left-sidebar-open?) (> touching-x-offset 40))
            (state/set-left-sidebar-open! true)

            (and left-sidebar-open? (< touching-x-offset -30))
            (set-close-signal! (inc close-signal))))
        (set-touch-state! nil))}

     ;; sidebar contents
     (sidebar-container route-match close-fn left-sidebar-open? srs-open? *closing?
                        close-signal (and touch-pending? touching-x-offset))

     ;; resizer
     (sidebar-resizer)]))
