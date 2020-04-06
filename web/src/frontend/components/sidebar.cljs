(ns frontend.components.sidebar
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.mixins :as mixins]
            [frontend.db :as db]
            [frontend.components.repo :as repo]
            [frontend.components.journal :as journal]
            [goog.crypt.base64 :as b64]
            [frontend.util :as util]
            [frontend.state :as state]))

(defonce active-button :a.group.flex.items-center.px-2.py-2.text-base.leading-6.font-medium.rounded-md.text-white.bg-gray-900.focus:outline-none.focus:bg-gray-700.transition.ease-in-out.duration-150)
(defonce inactive-button :a.mt-1.group.flex.items-center.px-2.py-2.text-base.leading-6.font-medium.rounded-md.text-gray-300.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150)

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

(rum/defc files-list
  [file-active?]
  (let [files (db/get-files)]
    [:div.cursor-pointer.my-1.flex.flex-col.ml-2
     (if (seq files)
       (for [file files]
         (let [encoded-path (b64/encodeString file)]
           [:a {:key file
                :class (util/hiccup->class "mt-1.group.flex.items-center.px-2.py-1.text-base.leading-6.font-medium.rounded-md.text-gray-500.hover:text-white.hover:bg-gray-700.focus:outline-none.focus:text-white.focus:bg-gray-700.transition.ease-in-out.duration-150")
                :style {:color (if (file-active? encoded-path) "#FFF")}
                :href (str "/file/" encoded-path)}
            file])))]))

(rum/defc sidebar-nav < rum/reactive
  []
  (let [{:keys [:route-match]} (rum/react state/state)
        active? (fn [route] (= route (get-in route-match [:data :name])))
        file-active? (fn [path]
                       (= path (get-in route-match [:parameters :path :path])))]
    [:nav.flex-1.px-2.py-4.bg-gray-800
     (nav-item "Daily notes" "/"
               "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10M9 21h6"
               (active? :home))
     (nav-item "Agenda" "/agenda"
               "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
               (active? :agenda))
     (files-list file-active?)]))

(rum/defc main-content
  []
  (let [repos (db/get-repos)]
    [:div.max-w-7xl.mx-auto.px-4.sm:px-6.md:px-8
    (if (seq repos)
      (journal/journals)
      (repo/add-repo))]))

(rum/defcs sidebar < (mixins/modal)
  [state main-content]
  (let [{:keys [open? close-fn open-fn]} state]
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
        [:img.h-8.w-auto
         {:alt "Gitnotes",
          :src "https://tailwindui.com/img/logos/workflow-logo-on-dark.svg"}]]
       [:div.flex-1.h-0.overflow-y-auto
        (sidebar-nav)]
       ]]
     [:div.hidden.md:flex.md:flex-shrink-0
      [:div.flex.flex-col.w-64
       [:div.flex.items-center.h-16.flex-shrink-0.px-4.bg-gray-900
        [:img.h-8.w-auto
         {:alt "Gitnotes",
          :src "https://tailwindui.com/img/logos/workflow-logo-on-dark.svg"}]]
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
        [:div.flex-1.flex
         [:div.w-full.flex.md:ml-0
          [:label.sr-only {:for "search_field"} "Search"]
          [:div.relative.w-full.text-gray-400.focus-within:text-gray-600
           [:div.absolute.inset-y-0.left-0.flex.items-center.pointer-events-none
            [:svg.h-5.w-5
             {:viewBox "0 0 20 20", :fill "currentColor"}
             [:path
              {:d
               "M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z",
               :clip-rule "evenodd",
               :fill-rule "evenodd"}]]]
           [:input#search_field.block.w-full.h-full.pl-8.pr-3.py-2.rounded-md.text-gray-900.placeholder-gray-500.focus:outline-none.focus:placeholder-gray-400.sm:text-sm
            {:placeholder "Search"}]]]]
        [:div.ml-4.flex.items-center.md:ml-6
         [:button.p-1.text-gray-400.rounded-full.hover:bg-gray-100.hover:text-gray-500.focus:outline-none.focus:shadow-outline.focus:text-gray-500
          [:svg.h-6.w-6
           {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
           [:path
            {:d
             "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
             :stroke-width "2",
             :stroke-linejoin "round",
             :stroke-linecap "round"}]]]
         (ui/dropdown-with-links
          [{:title "Your Profile"
            :options {:href "#"}}
           {:title "Settings"
            :options {:href "#"}}
           {:title "Sign out"
            :options {:href "#"}}])]]]
      [:main.flex-1.relative.z-0.overflow-y-auto.py-6.focus:outline-none
       ;; {:x-init "$el.focus()", :x-data "x-data", :tabindex "0"}
       {:tabIndex "0"}
       [:div.flex.justify-center
        [:div.flex-1.m-6 {:style {:position "relative"
                                  :max-width 800}}
         main-content]]]

      (ui/notification)]]))
