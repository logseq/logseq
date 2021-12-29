(ns frontend.components.sidebar
  (:require [cljs-drag-n-drop.core :as dnd]
            [clojure.string :as string]
            [frontend.components.command-palette :as command-palette]
            [frontend.components.header :as header]
            [frontend.components.journal :as journal]
            [frontend.components.repo :as repo]
            [frontend.components.right-sidebar :as right-sidebar]
            [frontend.components.settings :as settings]
            [frontend.components.theme :as theme]
            [frontend.components.widgets :as widgets]
            [frontend.components.plugins :as plugins]
            [frontend.components.select :as select]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.components.svg :as svg]
            [frontend.db-mixins :as db-mixins]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.data-helper :as shortcut-dh]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [reitit.frontend.easy :as rfe]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [rum.core :as rum]
            [frontend.extensions.srs :as srs]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.mobile.util :as mobile-util]
            [frontend.handler.mobile.swipe :as swipe]))

(rum/defc nav-content-item
  [name {:keys [class]} child]

  [:div.nav-content-item.is-expand
   {:class class}
   [:div.header.items-center.mb-1
    {:on-click (fn [^js/MouseEvent e]
                 (let [^js target (.-target e)
                       ^js parent (.closest target ".nav-content-item")]
                   (.toggle (.-classList parent) "is-expand")))}

    [:div.font-medium.fade-link name]
    [:span
     [:a.more svg/arrow-down-v2]]]
   [:div.bd child]])

(defn- delta-y
  [e]
  (when-let [target (.. e -target)]
    (let [rect (.. target getBoundingClientRect)]
     (- (.. e -pageY) (.. rect -top)))))

(defn- move-up?
  [e]
  (let [delta (delta-y e)]
    (< delta 14)))

(rum/defc page-name
  [name icon]
  (let [original-name (db-model/get-page-original-name name)]
    [:a {:on-click (fn [e]
                     (let [name (util/safe-page-name-sanity-lc name)]
                       (if (gobj/get e "shiftKey")
                         (when-let [page-entity (db/entity [:block/name name])]
                           (state/sidebar-add-block!
                            (state/get-current-repo)
                            (:db/id page-entity)
                            :page
                            {:page page-entity}))
                         (route-handler/redirect-to-page! name))))}
     [:span.page-icon icon]
     (pdf-assets/fix-local-asset-filename original-name)]))

(defn get-page-icon [page-entity]
  (let [default-icon "◦"
        from-properties (get-in (into {} page-entity) [:block/properties :icon])]
    (or
     (when (not= from-properties "") from-properties)
     default-icon))) ;; Fall back to default if icon is undefined or empty

(rum/defcs favorite-item <
  (rum/local nil ::up?)
  (rum/local nil ::dragging-over)
  [state _t name icon]
  (let [up? (get state ::up?)
        dragging-over (get state ::dragging-over)
        target (state/sub :favorites/dragging)]
    [:li.favorite-item
     {:key name
      :data-ref name
      :class (if (and target @dragging-over (not= target @dragging-over))
               "dragging-target"
               "")
      :draggable true
      :on-drag-start (fn [_event]
                       (state/set-state! :favorites/dragging name))
      :on-drag-over (fn [e]
                      (util/stop e)
                      (reset! dragging-over name)
                      (when-not (= name (get @state/state :favorites/dragging))
                        (reset! up? (move-up? e))))
      :on-drag-leave (fn [_e]
                       (reset! dragging-over nil))
      :on-drop (fn [e]
                 (page-handler/reorder-favorites! {:to name
                                                   :up? (move-up? e)})
                 (reset! up? nil)
                 (reset! dragging-over nil))}
     (page-name name icon)]))

(rum/defc favorites < rum/reactive
  [t]
  (nav-content-item
   [:a.flex.items-center.text-sm.font-medium.rounded-md
    (ui/icon "star mr-1" {:style {:font-size 18}})
    [:span.flex-1.ml-1 {:style {:padding-top 2}}
     (t :left-side-bar/nav-favorites)]]

   {:class "favorites"
    :edit-fn
    (fn [e]
      (rfe/push-state :page {:name "Favorites"})
      (util/stop e))}

   (let [favorites (->> (:favorites (state/sub-graph-config))
                        (remove string/blank?)
                        (filter string?))]
     (when (seq favorites)
       [:ul.favorites.text-sm
        (for [name favorites]
          (when-not (string/blank? name)
            (when-let [entity (db/entity [:block/name (util/safe-page-name-sanity-lc name)])]
              (let [icon (get-page-icon entity)]
                (favorite-item t name icon)))))]))))

(rum/defc recent-pages < rum/reactive db-mixins/query
  [t]
  (nav-content-item
   [:a.flex.items-center.text-sm.font-medium.rounded-md
    (ui/icon "history mr-2" {:style {:font-size 18}})
    [:span.flex-1 {:style {:padding-top 2}}
     (t :left-side-bar/nav-recent-pages)]]

   {:class "recent"}

   (let [pages (->> (db/sub-key-value :recent/pages)
                    (remove string/blank?)
                    (filter string?)
                    (map (fn [page] {:lowercase (util/safe-page-name-sanity-lc page)
                                     :page page}))
                    (util/distinct-by :lowercase)
                    (map :page))]
     [:ul.text-sm
      (for [name pages]
        (when-let [entity (db/entity [:block/name (util/safe-page-name-sanity-lc name)])]
          [:li.recent-item
           {:key name
            :data-ref name}
           (page-name name (get-page-icon entity))]))])))

(rum/defcs flashcards < db-mixins/query rum/reactive
  {:did-mount (fn [state]
                (srs/update-cards-due-count!)
                state)}
  [state]
  (let [num (state/sub :srs/cards-due-count)]
    [:a.item.group.flex.items-center.px-2.py-2.text-sm.font-medium.rounded-md {:on-click #(state/pub-event! [:modal/show-cards])}
     (ui/icon "infinity mr-3" {:style {:font-size 20}})
     [:span.flex-1 (t :right-side-bar/flashcards)]
     (when (and num (not (zero? num)))
       [:span.ml-3.inline-block.py-0.5.px-3.text-xs.font-medium.rounded-full.fade-in num])]))

(defn get-default-home-if-valid
  []
  (when-let [default-home (state/get-default-home)]
    (let [page (:page default-home)
          page (when (and (string? page)
                          (not (string/blank? page)))
                 (db/entity [:block/name (util/safe-page-name-sanity-lc page)]))]
      (if page
        default-home
        (dissoc default-home :page)))))

(defn sidebar-item
  [{on-click-handler :on-click-handler
    class :class
    title :title
    icon :icon
    href :href}]
  [:div
   {:class class}
   [:a.item.group.flex.items-center.px-2.py-2.text-sm.font-medium.rounded-md
    {:on-click on-click-handler
     :href href}
    (ui/icon (str icon " mr-3") {:style {:font-size 20}})
    [:span.flex-1 title]]])

(rum/defc sidebar-nav
  [_route-match close-modal-fn left-sidebar-open?]
  (let [default-home (get-default-home-if-valid)]

    [:div.left-sidebar-inner.flex-1.flex.flex-col.min-h-0
     {:on-click #(when-let [^js target (and (util/sm-breakpoint?) (.-target %))]
                   (when (some (fn [sel] (boolean (.closest target sel)))
                               [".favorites .bd" ".recent .bd" ".dropdown-wrapper" ".nav-header"])
                     (close-modal-fn)))}
     [:div.flex.flex-col.pb-4.wrap
      [:nav.px-2.space-y-1 {:aria-label "Sidebar"}
       (repo/repos-dropdown)

       [:div.nav-header
        (if (:page default-home)
          (sidebar-item
           {:class            "home-nav"
            :title            (:page default-home)
            :on-click-handler route-handler/redirect-to-home!
            :icon             "home"})
          (sidebar-item
           {:class            "journals-nav"
            :title            (t :right-side-bar/journals)
            :on-click-handler route-handler/go-to-journals!
            :icon             "calendar"}))

        [:div.flashcards-nav
         (flashcards)]

        (sidebar-item
         {:class "graph-view-nav"
          :title (t :right-side-bar/graph-view)
          :href  (rfe/href :graph)
          :icon  "hierarchy"})

        (sidebar-item
         {:class "all-pages-nav"
          :title (t :right-side-bar/all-pages)
          :href  (rfe/href :all-pages)
          :icon  "files"})]]

      (favorites t)

      (when left-sidebar-open? (recent-pages t))

      [:nav.px-2 {:aria-label "Sidebar"
                  :class      "new-page"}
       (when-not config/publishing?
         [:a.item.group.flex.items-center.px-2.py-2.text-sm.font-medium.rounded-md
          {:on-click (fn []
                       (and (util/sm-breakpoint?)
                            (state/toggle-left-sidebar!))
                       (state/pub-event! [:go/search]))}
          (ui/icon "circle-plus mr-3" {:style {:font-size 20}})
          [:span.flex-1 (t :right-side-bar/new-page)]])]]]))

(rum/defc left-sidebar < rum/reactive
  [{:keys [left-sidebar-open? route-match]}]
  (let [close-fn #(state/set-left-sidebar-open! false)]
    [:div#left-sidebar.cp__sidebar-left-layout
     {:class (util/classnames [{:is-open left-sidebar-open?}])}

     ;; sidebar contents
     (sidebar-nav route-match close-fn left-sidebar-open?)
     [:span.shade-mask {:on-click close-fn}]]))

(rum/defc main <
  {:did-mount (fn [state]
                (when-let [element (gdom/getElement "main-content-container")]
                  (dnd/subscribe!
                   element
                   :upload-files
                   {:drop (fn [_e files]
                            (when-let [id (state/get-edit-input-id)]
                              (let [format (:block/format (state/get-edit-block))]
                                (editor-handler/upload-asset id files format editor-handler/*asset-uploading? true))))}))
                state)}
  [{:keys [route-match global-graph-pages? route-name indexeddb-support? db-restoring? main-content]}]
  (let [left-sidebar-open? (state/sub :ui/left-sidebar-open?)]
    [:div#main-container.cp__sidebar-main-layout.flex-1.flex
     {:class (util/classnames [{:is-left-sidebar-open left-sidebar-open?}])}

     ;; desktop left sidebar layout
     (left-sidebar {:left-sidebar-open? left-sidebar-open?
                    :route-match route-match})

     [:div#main-content-container.scrollbar-spacing.w-full.flex.justify-center
      [:div.cp__sidebar-main-content
       {:data-is-global-graph-pages global-graph-pages?
        :data-is-full-width         (or global-graph-pages?
                                        (contains? #{:all-files :all-pages :my-publishing} route-name))}

       (when-not (mobile-util/is-native-platform?)
         (widgets/demo-graph-alert))

       (widgets/github-integration-soon-deprecated-alert)

       (cond
         (not indexeddb-support?)
         nil

         db-restoring?
         [:div.mt-20
          [:div.ls-center
           (ui/loading (t :loading))]]

         :else
         [:div {:class (if global-graph-pages? "" (util/hiccup->class "max-w-7xl.mx-auto.pb-24"))
                :style {:margin-bottom (if global-graph-pages? 0 120)
                        :padding-bottom (when (mobile-util/native-iphone?) "7rem")}}
          main-content])]]]))

(rum/defc footer
  []
  (when-let [user-footer (and config/publishing? (get-in (state/get-config) [:publish-common-footer]))]
    [:div.p-6 user-footer]))

(defonce sidebar-inited? (atom false))
;; TODO: simplify logic

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
                                              ["contents" :contents]
                                              [page :page])]
                     (state/sidebar-add-block! current-repo db-id block-type nil)))
                 (reset! sidebar-inited? true))))
           state)}
  []
  (let [cloning? (state/sub :repo/cloning?)
        default-home (get-default-home-if-valid)
        parsing? (state/sub :repo/parsing-files?)
        current-repo (state/sub :git/current-repo)
        loading-files? (when current-repo (state/sub [:repo/loading-files? current-repo]))
        journals-length (state/sub :journals-length)
        latest-journals (db/get-latest-journals (state/get-current-repo) journals-length)
        preferred-format (state/sub [:me :preferred_format])
        logged? (user-handler/logged?)]
    [:div
     (cond
       (and default-home
            (= :home (state/get-current-route))
            (not (state/route-has-p?))
            (:page default-home))
       (route-handler/redirect-to-page! (:page default-home))

       (and config/publishing?
            (not default-home)
            (empty? latest-journals))
       (route-handler/redirect! {:to :all-pages})

       parsing?
       (ui/loading (t :parsing-files))

       loading-files?
       (ui/loading (t :loading-files))

         ;; (and (not logged?) (seq latest-journals))
         ;; (journal/journals latest-journals)

         ;; (and logged? (not preferred-format))
         ;; (widgets/choose-preferred-format)

                         ;; TODO: delay this
         ;; (and logged? (nil? (:email me)))
         ;; (settings/set-email)


       cloning?
       (ui/loading (t :cloning))

       (seq latest-journals)
       (journal/journals latest-journals)

       (or
        (and (mobile-util/is-native-platform?)
             (nil? (state/get-current-repo)))
        logged?)
       (widgets/add-graph)

       ;; FIXME: why will this happen?
       :else
       [:div])]))

(rum/defc custom-context-menu < rum/reactive
  []
  (when (state/sub :custom-context-menu/show?)
    (when-let [links (state/sub :custom-context-menu/links)]
      (ui/css-transition
       {:class-names "fade"
        :timeout {:enter 500
                  :exit 300}}
       links))))

(rum/defc new-block-mode < rum/reactive
  []
  (when (state/sub [:document/mode?])
    (ui/tippy {:html [:div.p-2
                      [:p.mb-2 [:b "Document mode"]]
                      [:ul
                       [:li
                        [:div.inline-block.mr-1 (ui/render-keyboard-shortcut (shortcut-dh/gen-shortcut-seq :editor/new-line))]
                        [:p.inline-block  "to create new block"]]
                       [:li
                        [:p.inline-block.mr-1 "Click `D` or type"]
                        [:div.inline-block.mr-1 (ui/render-keyboard-shortcut (shortcut-dh/gen-shortcut-seq :ui/toggle-document-mode))]
                        [:p.inline-block "to toggle document mode"]]]]}
              [:a.block.px-1.text-sm.font-medium.bg-base-2.rounded-md.mx-2
               {:on-click state/toggle-document-mode!}
               "D"])))

(rum/defc help-button < rum/reactive
  []
  (when-not (state/sub :ui/sidebar-open?)
    [:div.cp__sidebar-help-btn
     {:title (t :help-shortcut-title)
      :on-click (fn []
                  (state/sidebar-add-block! (state/get-current-repo) "help" :help nil))}
     "?"]))

(defn- hide-context-menu-and-clear-selection
  [e]
  (state/hide-custom-context-menu!)
  (when-not (gobj/get e "shiftKey")
    (editor-handler/clear-selection!)))

(rum/defcs ^:large-vars/cleanup-todo sidebar <
  (mixins/modal :modal/show?)
  rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "click" hide-context-menu-and-clear-selection)
     (mixins/listen state js/window "keydown"
                    (fn [e]
                      (when (= 27 (.-keyCode e))
                        (if (and (state/modal-opened?)
                                 (not
                                  (and
                                   ;; FIXME: this does not work on CI tests
                                   util/node-test?
                                   (:editor/editing? @state/state))))
                          (state/close-modal!)
                          (hide-context-menu-and-clear-selection e)))))))
  {:did-mount (fn [state]
                (swipe/setup-listeners!)
                state)}
  [state route-match main-content]
  (let [{:keys [open-fn]} state
        me (state/sub :me)
        current-repo (state/sub :git/current-repo)
        granted? (state/sub [:nfs/user-granted? (state/get-current-repo)])
        theme (state/sub :ui/theme)
        system-theme? (state/sub :ui/system-theme?)
        white? (= "white" (state/sub :ui/theme))
        sidebar-open?  (state/sub :ui/sidebar-open?)
        settings-open? (state/sub :ui/settings-open?)
        left-sidebar-open?  (state/sub :ui/left-sidebar-open?)
        wide-mode? (state/sub :ui/wide-mode?)
        right-sidebar-blocks (state/sub-right-sidebar-blocks)
        route-name (get-in route-match [:data :name])
        global-graph-pages? (= :graph route-name)
        db-restoring? (state/sub :db/restoring?)
        indexeddb-support? (state/sub :indexeddb/support?)
        page? (= :page route-name)
        home? (= :home route-name)
        edit? (:editor/editing? @state/state)
        default-home (get-default-home-if-valid)]
    (theme/container
       {:t             t
        :theme         theme
        :route         route-match
        :current-repo  current-repo
        :edit?         edit?
        :nfs-granted?  granted?
        :db-restoring? db-restoring?
        :sidebar-open? sidebar-open?
        :settings-open? settings-open?
        :sidebar-blocks-len (count right-sidebar-blocks)
        :system-theme? system-theme?
        :on-click      (fn [e]
                         (editor-handler/unhighlight-blocks!)
                         (util/fix-open-external-with-shift! e))}

       [:div.theme-inner
        {:class (util/classnames [{:ls-left-sidebar-open left-sidebar-open?
                                   :ls-right-sidebar-open sidebar-open?
                                   :ls-wide-mode wide-mode?}])}

        [:div.#app-container
         [:div#left-container
          {:class (if (state/sub :ui/sidebar-open?) "overflow-hidden" "w-full")}
          (header/header {:open-fn        open-fn
                          :white?         white?
                          :current-repo   current-repo
                          :page?          page?
                          :route-match    route-match
                          :default-home   default-home
                          :new-block-mode new-block-mode})

          (main {:route-match         route-match
                 :global-graph-pages? global-graph-pages?
                 :home?               home?
                 :route-name          route-name
                 :indexeddb-support?  indexeddb-support?
                 :white?              white?
                 :db-restoring?       db-restoring?
                 :main-content        main-content})

          (footer)]
         (right-sidebar/sidebar)

         [:div#app-single-container]]

        (ui/notification)
        (ui/modal)
        (ui/sub-modal)
        (command-palette/command-palette-modal)
        (custom-context-menu)
        (plugins/custom-js-installer {:t t
                                      :current-repo current-repo
                                      :nfs-granted? granted?
                                      :db-restoring? db-restoring?})
        [:a#download.hidden]
        (when
         (and (not config/mobile?)
              (not config/publishing?))
          (help-button))])))
