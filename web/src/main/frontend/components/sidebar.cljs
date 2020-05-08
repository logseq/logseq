(ns frontend.components.sidebar
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.mixins :as mixins]
            [frontend.db :as db]
            [frontend.components.widgets :as widgets]
            [frontend.components.journal :as journal]
            [frontend.components.search :as search]
            [frontend.components.settings :as settings]
            [frontend.components.svg :as svg]
            [goog.crypt.base64 :as b64]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.handler :as handler]
            [frontend.config :as config]
            [dommy.core :as d]))

(rum/defc logo-or-repos < rum/reactive
  [current-repo close-modal-fn]
  (if current-repo
    (let [repos (state/sub [:me :repos])
          repos (->> repos
                     (remove #(= (:url %) current-repo))
                     (util/distinct-by :url))]
      [:div.flex.flex-row.align-center
       [:a.mr-4.hover:text-gray-300.text-gray-400
        {:style {:margin-top 3}
         :on-click (fn []
                     (d/add-class! (d/by-id "menu")
                                   "md:block")
                     (d/remove-class! (d/by-id "left-sidebar")
                                      "enter")
                     (d/remove-class! (d/by-id "search")
                                      "sidebar-open")
                     (d/remove-class! (d/by-id "main")
                                      "sidebar-open"))}
        (svg/menu "currentColor")]
       (if (>= (count repos) 1)
         (ui/dropdown-with-links
          (fn [{:keys [toggle-fn]}]
            [:a.hover:text-gray-300.text-gray-400.font-bold {:on-click toggle-fn}
             [:span (db/get-repo-name current-repo)]
             [:span.dropdown-caret.ml-1 {:style {:border-top-color "#6b7280"}}]])
          (mapv
           (fn [{:keys [id url]}]
             {:title (db/get-repo-name url)
              :options {:on-click (fn []
                                    (state/set-current-repo! url))}})
           repos)
          (util/hiccup->class
           "origin-top-right.absolute.left-0.mt-2.w-48.rounded-md.shadow-lg"))
         [:a.hover:text-gray-300.text-gray-400.font-bold
          {:href current-repo
           :target "_blank"}
          (db/get-repo-name current-repo)])])

    [:img.h-8.w-auto
     {:alt "Logseq",
      :src "/static/img/logo.png"}]))

(defn nav-item
  [title href svg-d active? close-modal-fn]
  [:a.mb-1.group.flex.items-center.pl-4.py-2.text-base.leading-6.font-medium.text-gray-400.hover:text-gray-300.hover:bg-black.transition.ease-in-out.duration-150
   {:href href
    :on-click close-modal-fn}
   [:svg.mr-4.h-5.w-5.text-gray-400.group-hover:text-gray-400.group-focus:text-gray-400.transition.ease-in-out.duration-150
    {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
    [:path
     {:d svg-d
      :stroke-width "2",
      :stroke-linejoin "round",
      :stroke-linecap "round"}]]
   title])

(rum/defc starred-pages < rum/reactive
  [page-active? close-modal-fn]
  (let [repo (state/get-current-repo)
        starred (state/sub [:config repo :starred])]
    [:div.cursor-pointer.flex.flex-col.overflow-hidden
     (if (seq starred)
       (for [page starred]
         (let [encoded-page (util/url-encode page)]
           [:a.mt-1.group.flex.items-center.pl-5.py-2.text-base.leading-6.hover:text-gray-300.hover:bg-black.transition.ease-in-out.duration-150
            {:key encoded-page
             :class (if (page-active? encoded-page) "text-gray-300" "text-gray-400")
             :href (str "/page/" encoded-page)
             :on-click close-modal-fn}
            page])))]))

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
     (nav-item "Agenda" "/agenda"
               "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
               (active? :agenda)
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
     ;; shortcuts
     [:div.flex {:class "mt-1 flex items-center px-4 pt-1 text-base leading-6 rounded-md text-gray-200 transition ease-in-out duration-150"}
      (svg/star-solid (util/hiccup->class "mr-4.text-gray-500 transition.ease-in-out.duration-150"))
      [:span.font-bold.text-gray-500
       "Starred"]]
     (starred-pages page-active? close-modal-fn)]))

;; TODO: simplify logic
(rum/defc main-content < rum/reactive
  []
  (let [cloning? (state/sub :repo/cloning?)
        importing-to-db? (state/sub :repo/importing-to-db?)
        loading-files? (state/sub :repo/loading-files?)
        me (state/sub :me)
        journals-length (state/sub :journals-length)
        current-repo (state/sub :git/current-repo)
        latest-journals (db/get-latest-journals (state/get-current-repo) journals-length)]
    [:div.max-w-7xl.mx-auto
     (cond
       cloning?
       [:div "Cloning ..."]

       (seq latest-journals)
       (journal/journals latest-journals)

       importing-to-db?
       [:div "Parsing files ..."]

       loading-files?
       [:div "Loading files ..."]

       (empty? (:repos me))
       (widgets/add-repo)

       (nil? (:email me))
       (settings/set-email))]))

(rum/defc custom-context-menu-content
  []
  [:div#custom-context-menu.w-48.rounded-md.shadow-lg.transition.ease-out.duration-100.transform.opacity-100.scale-100.enter-done.absolute
   [:div.py-1.rounded-md.bg-white.shadow-xs
    (ui/menu-link
     {:key "cut"
      :on-click handler/cut-selection-headings}
     "Cut")
    (ui/menu-link
     {:key "copy"
      :on-click handler/copy-selection-headings}
     "Copy")]])

;; TODO: content could be changed
;; Also, keyboard bindings should only be activated after
;; headings were already selected.
(defn cut-headings-and-clear-selections!
  []
  (handler/cut-selection-headings)
  (handler/clear-selection!))
(rum/defc custom-context-menu < rum/reactive
  (mixins/keyboard-mixin "ctrl+c"
                         (fn []
                           (handler/copy-selection-headings)
                           (handler/clear-selection!)))
  (mixins/keyboard-mixin "ctrl+x" cut-headings-and-clear-selections!)
  (mixins/keyboard-mixin "backspace" cut-headings-and-clear-selections!)
  (mixins/keyboard-mixin "delete" handler/cut-selection-headings)
  []
  (when (state/sub :custom-context-menu/show?)
    (ui/css-transition
     {:class-names "fade"
      :timeout {:enter 500
                :exit 300}}
     (custom-context-menu-content))))

(rum/defc left-sidebar < rum/reactive
  [current-repo route-match close-fn]
  [:div#left-sidebar.flex.flex-col.w-64.sidebar.enter
   [:div.flex.items-center.flex-shrink-0.px-4.h-16 {:class (if current-repo
                                                             "sm:h-10"
                                                             "sm:h-16")}
    (logo-or-repos current-repo)]
   [:div.h-0.flex-1.flex.flex-col.overflow-y-auto
    (sidebar-nav route-match close-fn)]])

(rum/defcs sidebar < (mixins/modal)
  rum/reactive
  [state route-match main-content]
  (let [{:keys [open? close-fn open-fn]} state
        me (state/sub :me)
        current-repo (state/sub :git/current-repo)
        status (db/sub-key-value :git/status)
        pulling? (= :pulling status)]
    [:div.h-screen.flex.overflow-hidden.bg-gray-100
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
        :style {:background-color "#202225"}}
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
       [:div.flex-shrink-0.flex.items-center.px-4.h-16 {:style {:background-color "#202225"}}
        (logo-or-repos current-repo close-fn)]
       [:div.flex-1.h-0.overflow-y-auto
        (sidebar-nav route-match close-fn)]]]
     [:div.hidden.md:flex.md:flex-shrink-0
      (left-sidebar current-repo route-match close-fn)]
     [:div.flex.flex-col.w-0.flex-1.overflow-hidden
      [:div.relative.z-10.flex-shrink-0.flex.bg-white.sm:bg-transparent.shadow.sm:shadow-none.h-16.sm:h-10
       [:button.px-4.border-r.border-gray-200.text-gray-400.focus:outline-none.focus:bg-gray-100.focus:text-gray-400.md:hidden
        {:on-click open-fn}
        [:svg.h-6.w-6
         {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
         [:path
          {:d "M4 6h16M4 12h16M4 18h7",
           :stroke-width "2",
           :stroke-linejoin "round",
           :stroke-linecap "round"}]]]
       [:div.flex-1.px-4.flex.justify-between
        (search/search)
        [:div.ml-4.flex.items-center.md:ml-6
         [:div {:class (if pulling? "loader")}
          [:button.p-1.m-2.text-gray-400.rounded-full.hover:bg-gray-100.focus:outline-none.focus:shadow-outline.focus:text-gray-400
           {:on-click handler/pull-current-repo}
           [:svg.h-6.w-6
            {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
            [:path
             {:d
              "M6 18.7V21a1 1 0 0 1-2 0v-5a1 1 0 0 1 1-1h5a1 1 0 1 1 0 2H7.1A7 7 0 0 0 19 12a1 1 0 1 1 2 0 9 9 0 0 1-15 6.7zM18 5.3V3a1 1 0 0 1 2 0v5a1 1 0 0 1-1 1h-5a1 1 0 0 1 0-2h2.9A7 7 0 0 0 5 12a1 1 0 1 1-2 0 9 9 0 0 1 15-6.7z"
              :stroke-width "1",
              :stroke-linejoin "round",
              :stroke-linecap "round"}]]]]
         (ui/dropdown-with-links
          (fn [{:keys [toggle-fn]}]
            [:button.max-w-xs.flex.items-center.text-sm.rounded-full.focus:outline-none.focus:shadow-outline
             {:on-click toggle-fn}
             [:img.h-7.w-7.rounded-full
              {:src (:avatar me)}]])
          [{:title "Your repos"
            :options {:href "/repos"}}
           {:title "Add another repo"
            :options {:href "/repo/add"}}
           {:title "Settings"
            :options {:href (str "/file/" (util/url-encode config/config-file))}}
           {:title "Sign out"
            :options {:on-click handler/sign-out!}}])]]]
      [:main#main.flex-1.relative.z-0.overflow-y-scroll.py-6.focus:outline-none.sidebar-open
       {:tabIndex "0"}
       [:div.flex.justify-center
        [:div.flex-1.m-6 {:style {:position "relative"
                                  :max-width 700
                                  :margin-bottom 500}}
         main-content]]]
      [:a#menu.mr-4.hover:text-gray-700.text-gray-500.absolute.hidden
       {:style {:position "absolute"
                :top 10
                :left 16
                :z-index 111}
        :on-click (fn []
                    (d/remove-class! (d/by-id "menu")
                                     "md:block")
                    (d/add-class! (d/by-id "left-sidebar")
                                  "enter")
                    (d/add-class! (d/by-id "search")
                                  "sidebar-open")
                    (d/add-class! (d/by-id "main")
                                  "sidebar-open"))}
       (svg/menu "currentColor")]
      (ui/notification)
      (custom-context-menu)]]))
