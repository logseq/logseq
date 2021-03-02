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
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.export :as export]
            [frontend.components.svg :as svg]
            [frontend.components.repo :as repo]
            [frontend.components.search :as search]
            [frontend.handler.project :as project-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.web.nfs :as nfs]
            [goog.dom :as gdom]
            [goog.object :as gobj]))

(rum/defc logo < rum/reactive
  [{:keys [white?]}]
  [:a.cp__header-logo
   {:href     (rfe/href :home)
    :on-click (fn []
                (util/scroll-to-top)
                (state/set-journals-length! 1))}
   (if-let [logo (and config/publishing?
                      (get-in (state/get-config) [:project :logo]))]
     [:img.cp__header-logo-img {:src logo}]
     (svg/logo (not white?)))])

(rum/defc login
  [logged?]
  (rum/with-context [[t] i18n/*tongue-context*]
    (when (and (not logged?)
               (not config/publishing?))

      (ui/dropdown-with-links
       (fn [{:keys [toggle-fn]}]
         [:a.fade-link {:on-click toggle-fn}
          [:span.ml-1 (t :login)]])
       (let [list [{:title (t :login-google)
                    :url (str config/website "/login/google")}
                   {:title (t :login-github)
                    :url (str config/website "/login/github")}]]
         (mapv
          (fn [{:keys [title url]}]
            {:title title
             :options
             {:on-click
              (fn [_] (set! (.-href js/window.location) url))}})
          list))
       nil))))

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
  (let [projects (state/sub [:me :projects])
        logged? (state/logged?)]
    (ui/dropdown-with-links
     (fn [{:keys [toggle-fn]}]
       [:a.cp__right-menu-button
        {:on-click toggle-fn}
        (svg/horizontal-dots nil)])
     (->>
      [(when-not (util/mobile?)
         {:title (t :help/toggle-right-sidebar)
          :options {:on-click state/toggle-sidebar-open?!}})

       (when current-repo
         {:title (t :graph-view)
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

       (when-let [project (and current-repo
                               (project-handler/get-current-project current-repo projects))]
         (let [link (str config/website "/" project)]
           {:title (str (t :go-to) "/" project)
            :options {:href link
                      :target "_blank"}
            :icon svg/external-link}))

       (when current-repo
         {:title (t :settings)
          :options {:on-click #(ui-handler/toggle-settings-modal!)}
          :icon svg/settings-sm})

       (when current-repo
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
      (remove nil?))
     ;; {:links-footer (when (and (util/electron?) (not logged?))
     ;;                  [:div.px-2.py-2 (login logged?)])}
)))

(rum/defc header
  < rum/reactive
  [{:keys [open-fn current-repo white? logged? page? route-match me default-home new-block-mode]}]
  (let [local-repo? (= current-repo config/local-repo)
        repos (->> (state/sub [:me :repos])
                   (remove #(= (:url %) config/local-repo)))]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.cp__header#head
       {:on-double-click (fn [^js e]
                           (when-let [target (.-target e)]
                             (when (and (util/electron?)
                                        (or (.. target -classList (contains "cp__header"))
                                            (. target (closest "#search"))))
                               (js/window.apis.toggleMaxOrMinActiveWindow))))}
       (left-menu-button {:on-click (fn []
                                      (open-fn)
                                      (state/set-left-sidebar-open! true))})

       (logo {:white? white?})

       (when (util/electron?)
         [:a.mr-1.opacity-30.hover:opacity-100.it.navigation
          {:style {:margin-left -10}
           :title "Go Back" :on-click #(js/window.history.back)} (svg/arrow-left)])

       (when (util/electron?)
         [:a.opacity-30.hover:opacity-100.it.navigation
          {:style {:margin-right 15}
           :title "Go Forward" :on-click #(js/window.history.forward)} (svg/arrow-right)])

       (if current-repo
         (search/search)
         [:div.flex-1])

       (new-block-mode)

       (when-not (util/electron?)
         (login logged?))

       (repo/sync-status current-repo)

       [:div.repos.hidden.md:block
        (repo/repos-dropdown true nil)]

       (when (and (nfs/supported?) (empty? repos)
                  (not config/publishing?))
         [:a.text-sm.font-medium.opacity-70.hover:opacity-100.ml-3.block
          {:on-click (fn []
                       (page-handler/ls-dir-files!))}
          [:div.flex.flex-row.text-center
           [:span.inline-block svg/folder-add]
           (when-not config/mobile?
             [:span.ml-1 {:style {:margin-top 2}}
              (t :open)])]])

       (if config/publishing?
         [:a.text-sm.font-medium.ml-3 {:href (rfe/href :graph)}
          (t :graph)])

       (dropdown-menu {:me me
                       :t t
                       :current-repo current-repo
                       :default-home default-home})

       [:a#download-as-html.hidden]
       [:a#download-as-zip.hidden]])))
