(ns frontend.components.header
  (:require [rum.core :as rum]
            [reitit.frontend.easy :as rfe]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.handler.user :as user-handler]
            [frontend.handler.export :as export]
            [frontend.components.svg :as svg]
            [frontend.components.repo :as repo]
            [frontend.components.page :as page]
            [frontend.components.search :as search]))

(rum/defc logo < rum/reactive
  [{:keys [white?]}]
  [:a.opacity-70.hover:opacity-100.absolute.hidden.md:block
   {:href "/"
    :on-click (fn []
                (util/scroll-to-top)
                (state/set-journals-length! 1))
    :style {:position "absolute"
            :top 12
            :left 16
            :z-index 111}}
   (if-let [logo (and config/publishing?
                      (get-in (state/get-config) [:project :logo]))]
     [:img {:src logo
            :width 24
            :height 24}]
     (svg/logo (not white?)))])

(rum/defc header
  [{:keys [open-fn current-repo white? logged? page? route-match me default-home new-block-mode]}]
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div.relative.z-10.flex-shrink-0.flex.sm:bg-transparent.shadow.sm:shadow-none.h-16.sm:h-12#head
     [:button#left-menu.px-4.focus:outline-none.md:hidden.menu
      {:on-click (fn []
                   (open-fn)
                   (state/set-left-sidebar-open! true))}
      [:svg.h-6.w-6
       {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
       [:path
        {:d "M4 6h16M4 12h16M4 18h7"
         :stroke-width "2"
         :stroke-linejoin "round"
         :stroke-linecap "round"}]]]
     (logo {:white? white?})
     [:div.flex-1.px-4.flex.justify-between
      (if current-repo
        (search/search)
        [:div.flex.md:ml-0])
      [:div.ml-4.flex.items-center.md:ml-6
       (new-block-mode)

       (when (and (not logged?)
                  (not config/publishing?))
         [:a.text-sm.font-medium.login.opacity-70.hover:opacity-100
          {:href "/login/github"
           :on-click (fn []
                       (storage/remove :git/current-repo))}
          (t :login-github)])

       (repo/sync-status)

       [:div.repos.hidden.md:block
        (repo/repos-dropdown true)]

       (when-let [project (and current-repo (state/get-current-project))]
         [:a.opacity-70.hover:opacity-100.ml-4
          {:title (str (t :go-to) "/" project)
           :href (str config/website "/" project)
           :target "_blank"}
          svg/external-link])

       (when (and page? current-repo (not config/mobile?))
         (let [page (get-in route-match [:path-params :name])
               page (string/lower-case (util/url-decode page))
               page (db/entity [:page/name page])]
           (page/presentation current-repo page (:journal? page))))

       (if config/publishing?
         [:a.text-sm.font-medium.ml-3 {:href (rfe/href :graph)}
          (t :graph)]

         (ui/dropdown-with-links
          (fn [{:keys [toggle-fn]}]
            [:button.max-w-xs.flex.items-center.text-sm.rounded-full.focus:outline-none.focus:shadow-outline.h-7.w-7.ml-2
             {:on-click toggle-fn}
             (if-let [avatar (:avatar me)]
               [:img.h-7.w-7.rounded-full
                {:src avatar}]
               [:div.h-7.w-7.rounded-full.bg-base-2.opacity-70.hover:opacity-100 {:style {:padding 1.5}}
                [:a svg/user]])])
          (let [logged? (:name me)]
            (->>
             [(when current-repo
                {:title (t :graph)
                 :options {:href (rfe/href :graph)}
                 :icon svg/graph-sm})
              (when (and logged? current-repo)
                {:title (t :publishing)
                 :options {:on-click (fn []
                                       (export/export-repo-as-html! current-repo))}
                 :icon nil})
              (when logged?
                {:title (t :all-repos)
                 :options {:href (rfe/href :repos)}
                 :icon svg/repos-sm})
              (when current-repo
                {:title (t :all-pages)
                 :options {:href (rfe/href :all-pages)}
                 :icon svg/pages-sm})
              (when current-repo
                {:title (t :all-files)
                 :options {:href (rfe/href :all-files)}
                 :icon svg/folder-sm})
              (when (and default-home current-repo)
                {:title (t :all-journals)
                 :options {:href (rfe/href :all-journals)}
                 :icon svg/calendar-sm})
              {:title (t :excalidraw-title)
               :options {:href (rfe/href :draw)}
               :icon (svg/excalidraw-logo)}
              {:title (t :settings)
               :options {:href (rfe/href :settings)}
               :icon svg/settings-sm}
              (when current-repo
                {:title (t :import)
                 :options {:href (rfe/href :import)}
                 :icon svg/import-sm})
              {:title [:div.flex-row.flex.justify-between.items-center
                       [:span (t :join-community)]]
               :options {:href "https://discord.gg/KpN4eHY"
                         :title (t :discord-title)
                         :target "_blank"}
               :icon svg/discord}
              (when logged?
                {:title (t :sign-out)
                 :options {:on-click user-handler/sign-out!}
                 :icon svg/logout-sm})]
             (remove nil?)))
          {}))

       [:a#download-as-html.hidden]

       [:a.opacity-70.hover:opacity-100.ml-3.hidden.md:block
        {:on-click (fn []
                     (state/toggle-sidebar-open?!))}
        (svg/menu)]]]]))


