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
            [frontend.components.search :as search]
            [frontend.handler.project :as project-handler]
            [frontend.handler.web.nfs :as nfs]))

(rum/defc logo < rum/reactive
  [{:keys [white?]}]
  [:a.cp__header-logo
   {:href "/"
    :on-click (fn []
                (util/scroll-to-top)
                (state/set-journals-length! 1))}
   (if-let [logo (and config/publishing?
                      (get-in (state/get-config) [:project :logo]))]
     [:img.cp__header-logo-img {:src logo}]
     (svg/logo (not white?)))])

(rum/defc left-menu-button < rum/reactive
  [{:keys [on-click]}]
  [:button#left-menu.cp__header-left-menu
   {:on-click on-click}
   [:svg.h-6.w-6
    {:viewBox "0 0 24 24", :fill "none", :stroke "currentColor"}
    [:path
     {:d "M4 6h16M4 12h16M4 18h7"
      :stroke-width "2"
      :stroke-linejoin "round"
      :stroke-linecap "round"}]]])

(rum/defc dropdown-menu < rum/reactive
  [{:keys [me current-repo t default-home]}]
  (let [projects (state/sub [:me :projects])]
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
          (when (or logged? (and (nfs/supported?) current-repo))
            {:title (t :all-graphs)
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

          (when (project-handler/get-current-project current-repo projects)
            {:title (t :my-publishing)
             :options {:href (rfe/href :my-publishing)}})

          (when current-repo
            {:title (t :my-publishing)
             :options {:href (rfe/href :my-publishing)}})
          {:title (t :excalidraw-title)
           :options {:href (rfe/href :draw)}
           :icon (svg/excalidraw-logo)}
          {:title (t :settings)
           :options {:href (rfe/href :settings)}
           :icon svg/settings-sm}
          (when-let [project (and current-repo (state/get-current-project))]
            (let [link (str config/website "/" project)]
              {:title (str (t :go-to) "/" project)
               :options {:href link
                         :target "_blank"}
               :icon svg/external-link}))
          (when (and logged? current-repo)
            {:title (t :export)
             :options {:on-click (fn []
                                   (export/export-repo-as-html! current-repo))}
             :icon nil})
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
     {})))

(rum/defc right-menu-button < rum/reactive
  []
  [:a.cp__right-menu-button
   {:on-click state/toggle-sidebar-open?!}
   (svg/menu)])

(rum/defc header
  < rum/reactive
  [{:keys [open-fn current-repo white? logged? page? route-match me default-home new-block-mode]}]
  (let [local-repo? (= current-repo config/local-repo)
        repos (->> (state/sub [:me :repos])
                   (remove #(= (:url %) config/local-repo)))]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.cp__header#head
       (left-menu-button {:on-click (fn []
                                      (open-fn)
                                      (state/set-left-sidebar-open! true))})

       (logo {:white? white?})

       (if current-repo
         (search/search)
         [:div.flex-1])

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

       (let [projects (state/sub [:me :projects])]
         (when-let [project (project-handler/get-current-project current-repo projects)]
           [:a.opacity-70.hover:opacity-100.ml-4
            {:title (str (t :go-to) "/" project)
             :href (str config/website "/" project)
             :target "_blank"}
            svg/external-link]))

       (when (and (nfs/supported?) (empty? repos))
         (ui/tooltip
          "Warning: this is an experimental feature, please only use it for testing purpose."
          [:a.text-sm.font-medium.opacity-70.hover:opacity-100.ml-3.block
           {:on-click (fn []
                        (nfs/ls-dir-files))}
           [:div.flex.flex-row.text-center
            [:span.inline-block svg/folder-add]
            (when-not config/mobile?
              [:span.ml-1 {:style {:margin-top 2}}
               (t :open)])]]
          {:label-style {:width 200}}))

       (if config/publishing?
         [:a.text-sm.font-medium.ml-3 {:href (rfe/href :graph)}
          (t :graph)]

         (dropdown-menu {:me me
                         :t t
                         :current-repo current-repo
                         :default-home default-home}))

       [:a#download-as-html.hidden]
       [:a#download-as-zip.hidden]

       (right-menu-button)])))
