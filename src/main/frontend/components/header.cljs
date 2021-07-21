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
            [frontend.handler.plugin :as plugin-handler]
            [frontend.components.svg :as svg]
            [frontend.components.repo :as repo]
            [frontend.components.search :as search]
            [frontend.components.export :as export]
            [frontend.components.plugins :as plugins]
            [frontend.components.right-sidebar :as sidebar]
            [frontend.handler.page :as page-handler]
            [frontend.handler.web.nfs :as nfs]
            [frontend.mixins :as mixins]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.handler.migrate :as migrate]))

(rum/defc logo < rum/reactive
  [{:keys [white? electron-mac?]}]
  [:a.cp__header-logo
   {:class (when electron-mac? "button")
    :href     (rfe/href :home)
    :on-click (fn []
                (util/scroll-to-top)
                (state/set-journals-length! 2))}
   (if electron-mac?
     svg/home
     (if-let [logo (and config/publishing?
                       (get-in (state/get-config) [:project :logo]))]
      [:img.cp__header-logo-img {:src logo}]
      (svg/logo (not white?))))])

(rum/defc login
  [logged?]
  (rum/with-context [[t] i18n/*tongue-context*]
    (when (and (not logged?)
               (not config/publishing?))

      (ui/dropdown-with-links
       (fn [{:keys [toggle-fn]}]
         [:a.fade-link.block.p-2 {:on-click toggle-fn}
          [:span (t :login)]])
       (let [list [
                   ;; {:title (t :login-google)
                   ;;  :url (str config/website "/login/google")}
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
        developer-mode? (state/sub [:ui/developer-mode?])
        logged? (state/logged?)]
    (ui/dropdown-with-links
     (fn [{:keys [toggle-fn]}]
       [:a.cp__right-menu-button.button
        {:on-click toggle-fn}
        (svg/horizontal-dots nil)])
     (->>
      [(when-not (util/mobile?)
         {:title (t :shortcut.ui/toggle-right-sidebar)
          :options {:on-click state/toggle-sidebar-open?!}})

       (when current-repo
         {:title (t :cards-view)
          :options {:on-click #(state/pub-event! [:modal/show-cards])}})

       (when current-repo
         {:title (t :graph-view)
          :options {:href (rfe/href :graph)}
          :icon svg/graph-sm})

       (when current-repo
         {:title (t :all-pages)
          :options {:href (rfe/href :all-pages)}
          :icon svg/pages-sm})

       (when (and current-repo (not config/publishing?))
         {:title (t :all-files)
          :options {:href (rfe/href :all-files)}
          :icon svg/folder-sm})

       (when (and default-home current-repo)
         {:title (t :all-journals)
          :options {:href (rfe/href :all-journals)}
          :icon svg/calendar-sm})

       (when-not (state/publishing-enable-editing?)
         {:title (t :settings)
          :options {:on-click state/open-settings!}
          :icon svg/settings-sm})

       (when developer-mode?
         {:title (t :plugins)
          :options {:href (rfe/href :plugins)}})

       (when developer-mode?
         {:title (t :themes)
          :options {:on-click #(plugins/open-select-theme!)}})

       (when current-repo
         {:title (t :export)
          :options {:on-click #(state/set-modal! export/export)}
          :icon nil})

       (when current-repo
         {:title (t :import)
          :options {:href (rfe/href :import)}
          :icon svg/import-sm})

       (when (and current-repo
                  (not (:markdown/version (state/get-config))))
         {:title "Convert to more standard Markdown"
          :options {:on-click (fn [] (migrate/show-convert-notification! current-repo))}
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

(rum/defc back-and-forward
  [electron-mac?]
  [:div.flex.flex-row
   [:a.it.navigation.nav-left.button
    {:title "Go Back" :on-click #(js/window.history.back)}
    svg/arrow-narrow-left]
   [:a.it.navigation.nav-right.button
    {:title "Go Forward" :on-click #(js/window.history.forward)}
    svg/arrow-narrow-right]])

(rum/defc header < rum/reactive
  [{:keys [open-fn current-repo white? logged? page? route-match me default-home new-block-mode]}]
  (let [local-repo? (= current-repo config/local-repo)
        repos (->> (state/sub [:me :repos])
                   (remove #(= (:url %) config/local-repo)))
        electron-mac? (and util/mac? (util/electron?))
        electron-not-mac? (and (util/electron?) (not electron-mac?))]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.cp__header#head
       {:class (when electron-mac? "electron-mac")
        :on-double-click (fn [^js e]
                           (when-let [target (.-target e)]
                             (when (and (util/electron?)
                                        (or (.. target -classList (contains "cp__header"))))
                               (js/window.apis.toggleMaxOrMinActiveWindow))))}
       (left-menu-button {:on-click (fn []
                                      (open-fn)
                                      (state/set-left-sidebar-open! true))})

       (when-not electron-mac?
         (logo {:white? white?}))

       (when electron-not-mac? (back-and-forward))

       (if current-repo
         (search/search)
         [:div.flex-1])

       (when electron-mac?
         (logo {:white? white?
                :electron-mac? true}))

       (when electron-mac? (back-and-forward true))

       (new-block-mode)

       (when-not (util/electron?)
         (login logged?))

       (when plugin-handler/lsp-enabled?
         (plugins/hook-ui-items :toolbar))

       (repo/sync-status current-repo)

       [:div.repos
        (repo/repos-dropdown nil)]

       (when (and (nfs/supported?) (empty? repos)
                  (not config/publishing?))
         [:a.text-sm.font-medium.button
          {:on-click (fn []
                       (page-handler/ls-dir-files!))}
          [:div.flex.flex-row.text-center.open-button__inner.items-center
           [:span.inline-block.open-button__icon-wrapper svg/folder-add]
           (when-not config/mobile?
             [:span.ml-1 {:style {:margin-top (if electron-mac? 0 2)}}
              (t :open)])]])

       (if config/publishing?
         [:a.text-sm.font-medium.button {:href (rfe/href :graph)}
          (t :graph)])

       (dropdown-menu {:me me
                       :t t
                       :current-repo current-repo
                       :default-home default-home})

       (when (not (state/sub :ui/sidebar-open?)) (sidebar/toggle))])))
