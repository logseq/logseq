(ns frontend.components.sidebar
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.mixins :as mixins]
            [frontend.db :as db]
            [frontend.components.widgets :as widgets]
            [frontend.components.journal :as journal]
            [frontend.components.search :as search]
            [frontend.components.settings :as settings]
            [goog.crypt.base64 :as b64]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.handler :as handler]
            ))

(defonce active-button :a.group.flex.items-center.px-2.py-2.text-base.leading-6.font-medium.rounded-md.text-white.bg-gray-900.focus:outline-none.focus:bg-gray-700.transition.ease-in-out.duration-150)
(defonce inactive-button :a.mt-1.group.flex.items-center.px-2.py-2.text-base.leading-6.font-medium.rounded-md.text-gray-300.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150)

(rum/defc logo-or-repos
  [current-repo]
  (if current-repo
    [:div.flex-1
     [:div.flex.justify-between.text-gray-500.font-bold
      [:a.hover:text-gray-300 {:href current-repo
           :target "_blank"}
       (db/get-repo-path current-repo)]
      [:a.hover:text-gray-300 {:href "/repo/add"}
       "+"]]]

    [:img.h-8.w-auto
     {:alt "Logseq",
      :src "/static/img/logo.png"}]))

(defn nav-item
  ([title href svg-d]
   (nav-item title href svg-d false))
  ([title href svg-d active?]
   (let [a (if active? active-button inactive-button)]
     [a {:href href}
      [:svg.mr-4.h-6.w-6.text-gray-400.group-hover:text-gray-300.group-focus:text-gray-300.transition.ease-in-out.duration-150
       {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
       [:path
        {:d svg-d
         :stroke-width "2",
         :stroke-linejoin "round",
         :stroke-linecap "round"}]]
      title])))

;; (rum/defc files-list
;;   [file-active?]
;;   (let [files (db/get-files)]
;;     [:div.cursor-pointer.my-1.flex.flex-col.ml-2
;;      (if (seq files)
;;        (for [file files]
;;          (let [encoded-path (b64/encodeString file)]
;;            [:a {:key file
;;                 :class (util/hiccup->class "mt-1.group.flex.items-center.px-2.py-1.text-base.leading-6.font-medium.rounded-md.text-gray-500.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150")
;;                 :style {:color (if (file-active? encoded-path) "#FFF")}
;;                 :href (str "/file/" encoded-path)}
;;             file])))]))

(rum/defc sidebar-nav < rum/reactive
  []
  (let [route-match (state/sub :route-match)
        active? (fn [route] (= route (get-in route-match [:data :name])))
        ;; file-active? (fn [path]
        ;;                (= path (get-in route-match [:parameters :path :path])))
        ]
    [:nav.flex-1.px-2.py-4.bg-gray-800
     (nav-item "Journals" "/"
               "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10M9 21h6"
               (active? :home))
     (nav-item "Agenda" "/agenda"
               "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
               (active? :agenda))
     (nav-item "All Pages" "/all-pages"
               "M6 2h9a1 1 0 0 1 .7.3l4 4a1 1 0 0 1 .3.7v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2zm9 2.41V7h2.59L15 4.41zM18 9h-3a2 2 0 0 1-2-2V4H6v16h12V9zm-2 7a1 1 0 0 1-1 1H9a1 1 0 0 1 0-2h6a1 1 0 0 1 1 1zm0-4a1 1 0 0 1-1 1H9a1 1 0 0 1 0-2h6a1 1 0 0 1 1 1zm-5-4a1 1 0 0 1-1 1H9a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1z"
               (active? :all-pages))
     [:div {:style {:height 1
                    :background-color "rgb(57, 75, 89)"
                    :margin 12}}]
     ;; shortcuts
     [:div.flex {:class "mt-1 flex items-center px-2 py-2 text-base leading-6 rounded-md text-gray-200 transition ease-in-out duration-150"}
      [:svg.ml-1.h-4.w-4.text-gray-500.transition.ease-in-out.duration-150
       {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"
        :style {:margin-right 20}}
       [:path
        {:d "M6.1 21.98a1 1 0 0 1-1.45-1.06l1.03-6.03-4.38-4.26a1 1 0 0 1 .56-1.71l6.05-.88 2.7-5.48a1 1 0 0 1 1.8 0l2.7 5.48 6.06.88a1 1 0 0 1 .55 1.7l-4.38 4.27 1.04 6.03a1 1 0 0 1-1.46 1.06l-5.4-2.85-5.42 2.85zm4.95-4.87a1 1 0 0 1 .93 0l4.08 2.15-.78-4.55a1 1 0 0 1 .29-.88l3.3-3.22-4.56-.67a1 1 0 0 1-.76-.54l-2.04-4.14L9.47 9.4a1 1 0 0 1-.75.54l-4.57.67 3.3 3.22a1 1 0 0 1 .3.88l-.79 4.55 4.09-2.15z"
         :stroke-width "2",
         :stroke-linejoin "round",
         :stroke-linecap "round"}]]
      [:span.font-bold.text-gray-500
       "Favorites"]]
     ;; (files-list file-active?)
     ]))

;; TODO: simplify logic
(rum/defc main-content < rum/reactive
  []
  (let [cloning? (state/sub :cloning?)
        importing-to-db? (state/sub :importing-to-db?)
        loading-files? (state/sub :loading-files?)
        me (state/sub :me)
        journals-length (state/sub :journals-length)
        current-repo (state/sub :git/current-repo)
        latest-journals (db/get-latest-journals (state/get-current-repo) journals-length)]
    [:div.max-w-7xl.mx-auto
     (cond
       (empty? (:repos me))
       (widgets/add-repo)

       cloning?
       [:div "Cloning ..."]

       importing-to-db?
       [:div "Parsing files ..."]

       loading-files?
       [:div "Loading files ..."]

       (nil? (:email me))
       (settings/set-email)

       (seq latest-journals)
       (journal/journals latest-journals))]))

(rum/defcs sidebar < (mixins/modal)
  rum/reactive
  [state main-content]
  (let [{:keys [open? close-fn open-fn]} state
        status (state/sub :git/status)
        current-repo (state/sub :git/current-repo)
        pulling? (= :pulling status)]
    [:div.h-screen.flex.overflow-hidden.bg-gray-100
     [:div.md:hidden
      [:div.fixed.inset-0.z-30.bg-gray-600.opacity-0.pointer-events-none.transition-opacity.ease-linear.duration-300
       {:class (if @open?
                 "opacity-75 pointer-events-auto"
                 "opacity-0 pointer-events-none")
        :on-click close-fn}]
      [:div.fixed.inset-y-0.left-0.flex.flex-col.z-40.max-w-xs.w-full.bg-gray-800.transform.ease-in-out.duration-300
       {:class (if @open?
                 "translate-x-0"
                 "-translate-x-full")}
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
       [:div.flex-shrink-0.flex.items-center.h-16.px-4.bg-gray-900
        (logo-or-repos current-repo)]
       [:div.flex-1.h-0.overflow-y-auto
        (sidebar-nav)]]]
     [:div.hidden.md:flex.md:flex-shrink-0
      [:div.flex.flex-col.w-64
       [:div.flex.items-center.h-16.flex-shrink-0.px-4.bg-gray-900
        (logo-or-repos current-repo)]
       [:div.h-0.flex-1.flex.flex-col.overflow-y-auto
        (sidebar-nav)]]]
     [:div.flex.flex-col.w-0.flex-1.overflow-hidden
      [:div.relative.z-10.flex-shrink-0.flex.h-16.bg-white.shadow
       [:button.px-4.border-r.border-gray-200.text-gray-500.focus:outline-none.focus:bg-gray-100.focus:text-gray-600.md:hidden
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
          [:button.p-1.text-gray-400.rounded-full.hover:bg-gray-100.hover:text-gray-500.focus:outline-none.focus:shadow-outline.focus:text-gray-500
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
          [{:title "Your Profile"
            :options {:href "/me"}}
           {:title "Settings"
            :options {:href "/settings"}}
           {:title "Sign out"
            :options {:href "/logout"
                      :on-click handler/sign-out!}}])]]]
      [:main.flex-1.relative.z-0.overflow-y-auto.py-6.focus:outline-none
       {:tabIndex "0"}
       [:div.flex.justify-center
        [:div.flex-1.m-6 {:style {:position "relative"
                                  :max-width 800}}
         main-content]]]

      (ui/notification)]]))
