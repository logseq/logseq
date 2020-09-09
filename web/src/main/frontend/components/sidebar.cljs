(ns frontend.components.sidebar
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.mixins :as mixins]
            [frontend.db :as db]
            [frontend.components.widgets :as widgets]
            [frontend.components.journal :as journal]
            [frontend.components.search :as search]
            [frontend.components.page :as page]
            [frontend.components.settings :as settings]
            [frontend.components.svg :as svg]
            [frontend.components.project :as project]
            [frontend.components.commit :as commit]
            [frontend.components.right-sidebar :as right-sidebar]
            [frontend.storage :as storage]
            [goog.crypt.base64 :as b64]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.handler :as handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.config :as config]
            [frontend.keyboards :as keyboards]
            [dommy.core :as d]
            [clojure.string :as string]
            [goog.object :as gobj]))

(defn nav-item
  [title href svg-d active? close-modal-fn]
  [:a.mb-1.group.flex.items-center.pl-4.py-2.text-base.leading-6.font-medium.text-gray-500.hover:text-gray-200.transition.ease-in-out.duration-150.nav-item
   {:href href
    :on-click close-modal-fn}
   [:svg.mr-4.h-6.w-6.group-hover:text-gray-200.group-focus:text-gray-200.transition.ease-in-out.duration-150
    {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
    [:path
     {:d svg-d
      :stroke-width "2",
      :stroke-linejoin "round",
      :stroke-linecap "round"}]]
   title])

(rum/defc sidebar-nav
  [route-match close-modal-fn]
  (let [active? (fn [route] (= route (get-in route-match [:data :name])))
        page-active? (fn [page]
                       (= page (get-in route-match [:parameters :path :name])))]
    [:nav.flex-1
     (nav-item "Journals" "/"
               "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10M9 21h6"
               (active? :home)
               close-modal-fn)
     (nav-item "All Pages" "/all-pages"
               "M6 2h9a1 1 0 0 1 .7.3l4 4a1 1 0 0 1 .3.7v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2zm9 2.41V7h2.59L15 4.41zM18 9h-3a2 2 0 0 1-2-2V4H6v16h12V9zm-2 7a1 1 0 0 1-1 1H9a1 1 0 0 1 0-2h6a1 1 0 0 1 1 1zm0-4a1 1 0 0 1-1 1H9a1 1 0 0 1 0-2h6a1 1 0 0 1 1 1zm-5-4a1 1 0 0 1-1 1H9a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1z"
               (active? :all-pages)
               close-modal-fn)
     (nav-item "All Files" "/all-files"
               "M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z"
               (active? :all-files)
               close-modal-fn)
     [:div.pl-4.pr-4 {:style {:height 1
                              :background-color "rgb(57, 75, 89)"
                              :margin 12}}]
     (when config/mobile?
       (right-sidebar/contents))]))

;; TODO: simplify logic
(rum/defc main-content < rum/reactive
  []
  (let [today (state/sub :today)
        cloning? (state/sub :repo/cloning?)
        importing-to-db? (state/sub :repo/importing-to-db?)
        loading-files? (state/sub :repo/loading-files?)
        me (state/sub :me)
        journals-length (state/sub :journals-length)
        current-repo (state/sub :git/current-repo)
        latest-journals (db/get-latest-journals (state/get-current-repo) journals-length)
        preferred-format (state/sub [:me :preferred_format])
        logged? (:name me)
        token (state/sub :encrypt/token)
        ;; TODO: remove this
        daily-migrating? (state/sub [:daily/migrating?])]
    [:div.max-w-7xl.mx-auto
     (cond
       daily-migrating?
       (ui/loading "Migrating to daily notes")

       (and (not logged?) (seq latest-journals))
       (journal/journals latest-journals)

       (and logged? (not preferred-format))
       (widgets/choose-preferred-format)

       ;; TODO: delay this
       (and logged? (nil? (:email me)))
       (settings/set-email)

       cloning?
       (ui/loading "Cloning")

       (seq latest-journals)
       (journal/journals latest-journals)

       importing-to-db?
       (ui/loading "Parsing files")

       loading-files?
       (ui/loading "Loading files")

       (and logged? (empty? (:repos me)))
       (widgets/add-repo)

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
       links
       ;; (custom-context-menu-content)
       ))))

(rum/defcs sidebar <
  (mixins/modal :modal/show?)
  rum/reactive
  ;; TODO: move this to keyboards
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "click"
                    (fn [e]
                      ;; hide context menu
                      (state/hide-custom-context-menu!)

                      ;; enable scroll
                      (let [main (d/by-id "main-content")]
                        (d/remove-class! main "overflow-hidden")
                        (d/add-class! main "overflow-y-auto"))
                      (if-not (state/get-selection-start-block)
                        (editor-handler/clear-selection! e)
                        (state/set-selection-start-block! nil))))

     (mixins/on-key-down
      state
      {
       ;; esc
       27 (fn [_state e]
            (editor-handler/clear-selection! e))

       ;; shift+up
       38 (fn [state e]
            (editor-handler/on-select-block state e true))

       ;; shift+down
       40 (fn [state e]
            (editor-handler/on-select-block state e false))

       ;; ?
       191 (fn [state e]
             (when-not (util/input? (gobj/get e "target"))
               (state/sidebar-add-block! (state/get-current-repo) "help" :help nil)))
       ;; c
       67 (fn [state e]
            (when (and (not (util/input? (gobj/get e "target")))
                       (not (gobj/get e "shiftKey"))
                       (not (gobj/get e "ctrlKey"))
                       (not (gobj/get e "altKey")))
              (when-let [repo-url (state/get-current-repo)]
                (if (and
                     (not (state/get-edit-input-id))
                     (seq (state/get-changed-files repo-url)))
                  (do
                    (util/stop e)
                    (state/set-modal! commit/add-commit-message))
                  (notification/show! "No changed files yet!" :warning)))))}
      (fn [e key-code]
        nil))))
  {:did-mount (fn [state]
                (handler/set-save-before-unload!)
                state)}
  (mixins/keyboards-mixin keyboards/keyboards)
  [state route-match main-content]
  (let [{:keys [open? close-fn open-fn]} state
        me (state/sub :me)
        current-repo (state/sub :git/current-repo)
        theme (state/sub :ui/theme)
        white? (= "white" (state/sub :ui/theme))
        route-name (get-in route-match [:data :name])
        global-graph-pages? (= :graph route-name)
        logged? (:name me)
        db-restoring? (state/sub :db/restoring?)
        indexeddb-support? (state/sub :indexeddb/support?)
        page? (= :page route-name)
        home? (= :home route-name)]
    [:div {:class (if white? "white-theme" "dark-theme")
           :on-click (fn []
                       (editor-handler/unhighlight-block!))}
     [:div.h-screen.flex.overflow-hidden.bg-base-3
      [:div.md:hidden
       [:div.fixed.inset-0.z-30.bg-gray-600.opacity-0.pointer-events-none.transition-opacity.ease-linear.duration-300
        {:class (if @open?
                  "opacity-75 pointer-events-auto"
                  "opacity-0 pointer-events-none")
         :on-click close-fn}]
       [:div.fixed.inset-y-0.left-0.flex.flex-col.z-40.max-w-xs.w-full.transform.ease-in-out.duration-300
        {:class (if @open?
                  "translate-x-0"
                  "-translate-x-full")
         :style {:background-color "#002b36"}}
        (if @open?
          [:div.absolute.top-0.right-0.-mr-14.p-1
           [:button.flex.items-center.justify-center.h-12.w-12.rounded-full.focus:outline-none.focus:bg-gray-600
            {:on-click close-fn}
            [:svg.h-6.w-6.text-white
             {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
             [:path
              {:d "M6 18L18 6M6 6l12 12",
               :stroke-width "2",
               :stroke-linejoin "round",
               :stroke-linecap "round"}]]]])
        [:div.flex-shrink-0.flex.items-center.px-4.h-16 {:style {:background-color "#002b36"}}
         (widgets/repos false)]
        [:div.flex-1.h-0.overflow-y-auto
         (sidebar-nav route-match close-fn)]]]
      [:div.flex.flex-col.w-0.flex-1.overflow-hidden
       [:div.relative.z-10.flex-shrink-0.flex.bg-base-3.sm:bg-transparent.shadow.sm:shadow-none.h-16.sm:h-12#head
        [:button.px-4.focus:outline-none.md:hidden.menu
         {:on-click open-fn}
         [:svg.h-6.w-6
          {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
          [:path
           {:d "M4 6h16M4 12h16M4 18h7",
            :stroke-width "2",
            :stroke-linejoin "round",
            :stroke-linecap "round"}]]]
        [:div.flex-1.px-4.flex.justify-between
         (if current-repo
           (search/search)
           [:div.flex.md:ml-0])
         [:div.ml-4.flex.items-center.md:ml-6
          (when-not logged?
            [:a.text-sm.font-medium.login
             {:href "/login/github"
              :on-click (fn []
                          (storage/remove :git/current-repo))}
             "Login with GitHub"])

          (widgets/sync-status)

          [:div.repos.hidden.md:block
           (widgets/repos true)]

          (when-let [project (and current-repo (state/get-current-project))]
            [:a.opacity-50.hover:opacity-100.ml-4
             {:title (str "Go to /" project)
              :href (str config/website "/" project)
              :target "_blank"}
             svg/external-link])

          (when (and page? current-repo (not config/mobile?))
            (let [page (get-in route-match [:path-params :name])
                  page (string/lower-case (util/url-decode page))
                  page (db/entity [:page/name page])]
              (page/presentation current-repo page (:journal? page))))

          [:a {:title "Draw with Excalidraw"
               :href "/draw"
               :style {:margin-left 8
                       :margin-right 4}}
           [:button.p-1.rounded-full.focus:outline-none.focus:shadow-outline.pull
            (svg/excalidraw-logo)]]
          (ui/dropdown-with-links
           (fn [{:keys [toggle-fn]}]
             [:button.max-w-xs.flex.items-center.text-sm.rounded-full.focus:outline-none.focus:shadow-outline.h-7.w-7
              {:on-click toggle-fn}
              (if-let [avatar (:avatar me)]
                [:img.h-7.w-7.rounded-full
                 {:src avatar}]
                [:div.h-7.w-7.rounded-full.bg-base-2 {:style {:padding 1.5}}
                 [:a svg/user]])])
           (let [logged? (:name me)]
             (->>
              [(when current-repo
                 {:title "New page"
                  :options {:href "/new-page"}})
               (when current-repo
                 {:title "Graph"
                  :options {:href "/graph"}})
               (when logged?
                 {:title "All repos"
                  :options {:href "/repos"}})
               (when current-repo
                 {:title "All pages"
                  :options {:href "/all-pages"}})
               (when current-repo
                 {:title "All files"
                  :options {:href "/all-files"}})
               (when logged?
                 {:title "Settings"
                  :options {:href "/settings"}})
               (when current-repo
                 {:title "Import"
                  :options {:href "/import"}})
               {:title [:div.flex-row.flex.justify-between.items-center
                        [:span "Join the community"]
                        svg/discord]
                :options {:href "https://discord.gg/KpN4eHY"
                          :title "Our discord group!"
                          :target "_blank"}}
               (when logged?
                 {:title "Sign out"
                  :options {:on-click user-handler/sign-out!}})]
              (remove nil?)))
           {})

          [:a.hover:text-gray-900.text-gray-500.ml-3.hidden.md:block
           {:on-click (fn []
                        (state/toggle-sidebar-open?!))}
           (svg/menu)]]]]
       [:div#main-content.flex.wrapper.overflow-y-auto {:style {:height "100vh"}}
        [:div.flex.#main-content-container.justify-center
         {:class (if global-graph-pages?
                   "initial"
                   (util/hiccup->class ".mx-6.my-12"))
          :style {:position "relative"
                  :flex "1 1 65%"
                  :width "100vw"}}
         [:div.flex-1
          {:style (cond->
                      {:max-width 640}
                    (or global-graph-pages?
                        (and (not logged?)
                             home?)
                        (contains? #{:all-files :all-pages} route-name))
                    (dissoc :max-width))}
          (cond
            (not indexeddb-support?)
            nil

            db-restoring?
            [:div.mt-20
             [:div.ls-center
              (ui/loading "Loading")]]

            :else
            [:div {:style {:margin-bottom (if global-graph-pages? 0 120)}}
             main-content])]]
        (when-not config/mobile?
          (right-sidebar/sidebar))]
       [:a.opacity-70.hover:opacity-100.absolute.hidden.md:block
        {:href "/"
         :on-click (fn []
                     (util/scroll-to-top)
                     (state/set-journals-length! 1))
         :style {:position "absolute"
                 :top 12
                 :left 16
                 :z-index 111}}
        (svg/logo (not white?))]
       (ui/notification)
       (ui/modal)
       (custom-context-menu)
       [:a#download.hidden]
       (when-not config/mobile?
         [:div#help.font-bold.absolute.bottom-4.bg-base-2.rounded-full.h-8.w-8.flex.items-center.justify-center.font-bold.cursor.opacity-70.hover:opacity-100
          {:style {:right 24}
           :title "Click to check shortcuts and other tips"
           :on-click (fn []
                       (state/sidebar-add-block! (state/get-current-repo) "help" :help nil))}
          "?"])]]]))
