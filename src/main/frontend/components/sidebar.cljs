(ns frontend.components.sidebar
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.theme :as theme]
            [frontend.mixins :as mixins]
            [frontend.db-mixins :as db-mixins]
            [frontend.db :as db]
            [frontend.components.widgets :as widgets]
            [frontend.components.journal :as journal]
            [frontend.components.page :as page]
            [frontend.components.settings :as settings]
            [frontend.components.svg :as svg]
            [frontend.components.repo :as repo]
            [frontend.components.commit :as commit]
            [frontend.components.header :as header]
            [frontend.components.right-sidebar :as right-sidebar]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.export :as export]
            [frontend.config :as config]
            [dommy.core :as d]
            [clojure.string :as string]
            [goog.object :as gobj]
            [frontend.context.i18n :as i18n]
            [reitit.frontend.easy :as rfe]
            [goog.dom :as gdom]
            [frontend.handler.web.nfs :as nfs-handler]))

(defn nav-item
  [title href svg-d active? close-modal-fn]
  [:a.mb-1.group.flex.items-center.pl-4.py-2.text-base.leading-6.font-medium.hover:text-gray-200.transition.ease-in-out.duration-150.nav-item
   {:href href
    :on-click close-modal-fn}
   [:svg.mr-4.h-6.w-6.group-hover:text-gray-200.group-focus:text-gray-200.transition.ease-in-out.duration-150
    {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
    [:path
     {:d svg-d
      :stroke-width "2"
      :stroke-linejoin "round"
      :stroke-linecap "round"}]]
   title])

(rum/defc sidebar-nav < rum/reactive
  [route-match close-modal-fn]
  (let [white? (= "white" (state/sub :ui/theme))
        active? (fn [route] (= route (get-in route-match [:data :name])))
        page-active? (fn [page]
                       (= page (get-in route-match [:parameters :path :name])))
        right-sidebar? (state/sub :ui/sidebar-open?)
        left-sidebar? (state/sub :ui/left-sidebar-open?)]
    (when left-sidebar?
      [:nav.flex-1.left-sidebar-inner
       (nav-item "Journals" "#/"
                 "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10M9 21h6"
                 (active? :home)
                 close-modal-fn)
       (nav-item "All Pages" "#/all-pages"
                 "M6 2h9a1 1 0 0 1 .7.3l4 4a1 1 0 0 1 .3.7v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2zm9 2.41V7h2.59L15 4.41zM18 9h-3a2 2 0 0 1-2-2V4H6v16h12V9zm-2 7a1 1 0 0 1-1 1H9a1 1 0 0 1 0-2h6a1 1 0 0 1 1 1zm0-4a1 1 0 0 1-1 1H9a1 1 0 0 1 0-2h6a1 1 0 0 1 1 1zm-5-4a1 1 0 0 1-1 1H9a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1z"
                 (active? :all-pages)
                 close-modal-fn)
       (when-not config/publishing?
         (nav-item "All Files" "#/all-files"
                   "M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z"
                   (active? :all-files)
                   close-modal-fn))
       (when-not right-sidebar?
         [:div.pl-4.pr-4 {:style {:height 1
                                  :background-color (if white? "#f0f8ff" "#073642")
                                  :margin 12}}])
       (right-sidebar/contents)])))

(rum/defc sidebar-mobile-sidebar < rum/reactive
  [{:keys [open? close-fn route-match]}]
  [:div.md:hidden
   [:div.fixed.inset-0.z-30.bg-gray-600.pointer-events-none.ease-linear.duration-300
    {:class (if @open?
              "opacity-75 pointer-events-auto"
              "opacity-0 pointer-events-none")
     :on-click close-fn}]
   [:div#left-bar.fixed.inset-y-0.left-0.flex.flex-col.z-40.w-full.transform.ease-in-out.duration-300
    {:class (if @open?
              "translate-x-0"
              "-translate-x-full")
     :style {:max-width "86vw"}}
    (if @open?
      [:div.absolute.top-0.right-0.p-1
       [:button#close-left-bar.close-panel-btn.flex.items-center.justify-center.h-12.w-12.rounded-full.focus:outline-none.focus:bg-gray-600
        {:on-click close-fn}
        [:svg.h-6.w-6
         {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d "M6 18L18 6M6 6l12 12"
           :stroke-width "2"
           :stroke-linejoin "round"
           :stroke-linecap "round"}]]]])
    [:div.flex-shrink-0.flex.items-center.px-4.h-16.head-wrap
     (repo/repos-dropdown nil)]
    [:div.flex-1.h-0.overflow-y-auto
     (sidebar-nav route-match close-fn)]]])

(rum/defc main
  [{:keys [route-match global-graph-pages? logged? home? route-name indexeddb-support? white? db-restoring? main-content]}]
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div#main-content.cp__sidebar-main-layout.flex-1.flex
     [:div#sidebar-nav-wrapper.flex-col.pt-4.hidden.sm:block
      {:style {:flex (if (state/get-left-sidebar-open?)
                       "0 1 20%"
                       "0 0 0px")
               :border-right (str "1px solid "
                                  (if white? "#f0f8ff" "#073642"))}}
      (when (state/sub :ui/left-sidebar-open?)
        (sidebar-nav route-match nil))]
     [:div#main-content-container.w-full.flex.justify-center
      {:style {:margin-top (if global-graph-pages? 0 "2rem")}}
      [:div.cp__sidebar-main-content
       {:data-is-global-graph-pages global-graph-pages?
        :data-is-full-width (or global-graph-pages?
                                (contains? #{:all-files :all-pages :my-publishing} route-name))}
       (cond
         (not indexeddb-support?)
         nil

         db-restoring?
         [:div.mt-20
          [:div.ls-center
           (ui/loading (t :loading))]]

         :else
         [:div.pb-24 {:class (if global-graph-pages? "" (util/hiccup->class "max-w-7xl.mx-auto"))
                      :style {:margin-bottom (if global-graph-pages? 0 120)}}
          main-content])]]]))

(rum/defc footer
  []
  (when-let [user-footer (and config/publishing? (get-in (state/get-config) [:publish-common-footer]))]
    [:div.p-6 user-footer]))

(defn get-default-home-if-valid
  []
  (when-let [default-home (state/get-default-home)]
    (when-let [page (:page default-home)]
      (when (db/entity [:block/name (string/lower-case page)])
        default-home))))

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
                                     (remove nil?))]
                 (let [blocks (remove nil? pages)]
                   (doseq [page pages]
                     (let [page (string/lower-case page)
                           [db-id block-type] (if (= page "contents")
                                                ["contents" :contents]
                                                [page :page])]
                       (state/sidebar-add-block! current-repo db-id block-type nil))))
                 (reset! sidebar-inited? true))))
           state)}
  []
  (let [today (state/sub :today)
        cloning? (state/sub :repo/cloning?)
        default-home (get-default-home-if-valid)
        importing-to-db? (state/sub :repo/importing-to-db?)
        loading-files? (state/sub :repo/loading-files?)
        me (state/sub :me)
        journals-length (state/sub :journals-length)
        current-repo (state/sub :git/current-repo)
        latest-journals (db/get-latest-journals (state/get-current-repo) journals-length)
        preferred-format (state/sub [:me :preferred_format])
        logged? (:name me)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div
       (cond
         (and default-home
              (= :home (state/get-current-route))
              (not (state/route-has-p?)))
         (route-handler/redirect! {:to :page
                                   :path-params {:name (:page default-home)}})

         (and config/publishing?
              (not default-home)
              (empty? latest-journals))
         (route-handler/redirect! {:to :all-pages})

         importing-to-db?
         (ui/loading (t :parsing-files))

         loading-files?
         (ui/loading (t :loading-files))

         (and (not logged?) (seq latest-journals))
         (journal/journals latest-journals)

         (and logged? (not preferred-format))
         (widgets/choose-preferred-format)

         ;; TODO: delay this
         (and logged? (nil? (:email me)))
         (settings/set-email)

         cloning?
         (ui/loading (t :cloning))

         (seq latest-journals)
         (journal/journals latest-journals)

         (and logged? (empty? (:repos me)))
         (widgets/add-graph)

         ;; FIXME: why will this happen?
         :else
         [:div])])))

(rum/defc custom-context-menu < rum/reactive
  []
  (when (state/sub :custom-context-menu/show?)
    (when-let [links (state/sub :custom-context-menu/links)]
      (ui/css-transition
       {:class-names "fade"
        :timeout {:enter 500
                  :exit 300}}
       links
       ;; (custom-context-menu-content)
))))

(rum/defc new-block-mode < rum/reactive
  []
  (when (state/sub [:editor/new-block-toggle?])
    [:a.px-1.text-sm.font-medium.bg-base-2.mr-4.rounded-md
     {:title "Click to switch to \"Enter\" for creating new block"
      :on-click state/toggle-new-block-shortcut!}
     "A"]))

(rum/defc help-button < rum/reactive
  []
  (when-not (state/sub :ui/sidebar-open?)
    ;; TODO: remove with-context usage
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.cp__sidebar-help-btn
       {:title (t :help-shortcut-title)
        :on-click (fn []
                    (state/sidebar-add-block! (state/get-current-repo) "help" :help nil))}
       "?"])))

(rum/defc settings-modal
  [settings-open?]
  (rum/use-effect!
   (fn []
     (if settings-open?
       (state/set-modal!
        (fn [close-fn]
          (gobj/set close-fn "user-close" #(ui-handler/toggle-settings-modal!))
          [:div.settings-modal (settings/settings)]))
       (state/set-modal! nil))

     (util/lock-global-scroll settings-open?)
     #())
   [settings-open?]) nil)

(rum/defcs sidebar <
  (mixins/modal :modal/show?)
  rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "click"
                    (fn [e]
                      ;; hide context menu
                      (state/hide-custom-context-menu!)
                      (editor-handler/clear-selection! e)))))
  [state route-match main-content]
  (let [{:keys [open? close-fn open-fn]} state
        close-fn (fn []
                   (close-fn)
                   (state/set-left-sidebar-open! false))
        me (state/sub :me)
        current-repo (state/sub :git/current-repo)
        granted? (state/sub [:nfs/user-granted? (state/get-current-repo)])
        theme (state/sub :ui/theme)
        system-theme? (state/sub :ui/system-theme?)
        white? (= "white" (state/sub :ui/theme))
        settings-open? (state/sub :ui/settings-open?)
        sidebar-open?  (state/sub :ui/sidebar-open?)
        route-name (get-in route-match [:data :name])
        global-graph-pages? (= :graph route-name)
        logged? (:name me)
        db-restoring? (state/sub :db/restoring?)
        indexeddb-support? (state/sub :indexeddb/support?)
        page? (= :page route-name)
        home? (= :home route-name)
        default-home (get-default-home-if-valid)]
    (rum/with-context [[t] i18n/*tongue-context*]
      (theme/container
       {:theme         theme
        :route         route-match
        :current-repo  current-repo
        :nfs-granted?  granted?
        :db-restoring? db-restoring?
        :sidebar-open? sidebar-open?
        :system-theme? system-theme?
        :on-click      #(do
                          (editor-handler/unhighlight-blocks!)
                          (util/fix-open-external-with-shift! %))}

       [:div.theme-inner
        (sidebar-mobile-sidebar
         {:open?       open?
          :close-fn    close-fn
          :route-match route-match})
        [:div.#app-container.h-screen.flex
         [:div.flex-1.h-full.flex.flex-col.overflow-y-auto#left-container.relative
          [:div.scrollbar-spacing#main-container
           (header/header {:open-fn        open-fn
                           :white?         white?
                           :current-repo   current-repo
                           :logged?        logged?
                           :page?          page?
                           :route-match    route-match
                           :me             me
                           :default-home   default-home
                           :new-block-mode new-block-mode})

           (main {:route-match         route-match
                  :global-graph-pages? global-graph-pages?
                  :logged?             logged?
                  :home?               home?
                  :route-name          route-name
                  :indexeddb-support?  indexeddb-support?
                  :white?              white?
                  :db-restoring?       db-restoring?
                  :main-content        main-content})

           (footer)]]
         (right-sidebar/sidebar)]

        (ui/notification)
        (ui/modal)
        (settings-modal settings-open?)
        (custom-context-menu)
        [:a#download.hidden]
        (when
         (and (not config/mobile?)
              (not config/publishing?))
          (help-button)
         ;; [:div.font-bold.absolute.bottom-4.bg-base-2.rounded-full.h-8.w-8.flex.items-center.justify-center.font-bold.cursor.opacity-70.hover:opacity-100
         ;;  {:style {:left 24}
         ;;   :title "Click to show/hide sidebar"
         ;;   :on-click (fn []
         ;;               (state/set-left-sidebar-open! (not (state/get-left-sidebar-open?))))}
         ;;  (if (state/sub :ui/left-sidebar-open?) "<" ">")]
)]))))
