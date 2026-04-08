(ns frontend.page
  "Provides root component for both Logseq app and publishing build"
  (:require [frontend.components.container :as container]
            [frontend.components.plugins :as plugin]
            [frontend.config :as config]
            [frontend.context.i18n :refer [interpolate-sentence t]]
            [frontend.handler.export :as export]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.search :as search-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(defn- setup-fns!
  []
  (try
    (comp
     (ui/setup-active-keystroke!)
     (ui/setup-viewport-listeners!))
    (catch :default _e
      nil)))

(rum/defc helpful-default-error-screen
  "This screen is displayed when the UI has crashed hard. It provides the user
  with basic troubleshooting steps to get them back to a working state. This
  component is purposefully stupid simple as it needs to render under any number
  of broken conditions"
  []
  ;; This layout emulates most of container/sidebar
  (let [current-repo (state/get-current-repo)]
    [:div#main-container.cp__sidebar-main-layout.flex-1.flex
     [:div.#app-container
      [:div#left-container
       [:div#main-container.cp__sidebar-main-layout.flex-1.flex
        [:div#main-content-container.scrollbar-spacing.w-full.flex.justify-center
         [:div.cp__sidebar-main-content
          [:div.ls-center
           [:div.icon-box.p-1.rounded.mb-3 (ui/icon "bug" {:style {:font-size ui/icon-size}})]
           [:div.text-xl.font-bold
            (t :page/something-went-wrong)]
           [:div.mt-2.mb-2 (t :page/logseq-is-having-a-problem)]
           [:div
          ;; TODO: Enable once multi-window case doesn't result in possible data loss
            #_[:div.flex.flex-row.justify-between.align-items.mb-2
              [:div.flex.flex-col.items-start
               [:div.text-2xs.uppercase (t :page/step "1")]
               [:div [:span.font-bold (t :plugin/reload)] (str " " (t :page/the-app))]]
               [:div (ui/icon "command") (ui/icon "letter-r")]]
            [:div.flex.flex-row.justify-between.align-items.mb-2.items-center.py-4
             [:div.flex.flex-col.items-start
              [:div.text-2xs.font-bold.uppercase.toned-down (t :page/step "1")]
              [:div [:span.highlighted.font-bold (t :page/rebuild)] [:span.toned-down (str " " (t :page/search-index))]]]
             [:div
              (ui/button (t :page/try)
                         :small? true
                         :on-click (fn []
                                     (search-handler/rebuild-indices! true)))]]
            [:div.flex.flex-row.justify-between.align-items.mb-2.items-center.separator-top.py-4
             [:div.flex.flex-col.items-start
              [:div.text-2xs.font-bold.uppercase.toned-down (t :page/step "2")]
              [:div [:span.highlighted.font-bold (t :page/relaunch)] [:span.toned-down (str " " (t :page/the-app))]]]
              [:div.text-xs.toned-down (t :page/relaunch-desc)]]
             [:div (shui/shortcut ["cmd" (if (util/electron?) "q" "r")])]]
            [:div.flex.flex-row.justify-between.align-items.mb-4.items-center.separator-top.py-4
             [:div.flex.flex-col.items-start.mr-2
              [:div.text-2xs.font-bold.uppercase.toned-down (t :page/step "3")]
              [:div [:span.highlighted.font-bold (t :ui/export)] [:span.toned-down (str " " (t :page/current-graph-as-sqlite-db))]]
              [:div.text-xs.toned-down (t :page/send-db-for-debugging)]
              [:a#download-as-sqlite-db.hidden]]
             [:div
              (ui/button (t :export/graph)
                         :small? true
                         :on-click #(export/export-repo-as-sqlite-db! current-repo))]]

            [:div.flex.flex-row.justify-between.align-items.mb-4.items-center.separator-top.py-4
             [:div.flex.flex-col.items-start
              [:div.text-2xs.font-bold.uppercase.toned-down (t :page/step "4")]
              [:div [:span.highlighted.font-bold (t :page/clear)] [:span.toned-down (str " " (t :page/local-storage))]]
              [:div.text-xs.toned-down (t :page/clear-local-storage-desc)]]
             [:div
              (ui/button (t :page/try)
                         :small? true
                         :on-click (fn []
                                     (.clear js/localStorage)
                                     (notification/show! (t :page/cleared) :success)))]]]
           [:div
            [:p
             (interpolate-sentence
              (t :page/open-all-graphs-desc)
              :links
              [{:on-click (fn []
                            (set! (.-href js/window.location) (rfe/href :graphs))
                            (.reload js/window.location))}])]
            [:p
             (interpolate-sentence
              (t :page/open-issue-desc)
              :links
              [{:href "https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml"}])]]]]]]]
     (ui/notification)]))

(rum/defc not-found
  []
  [:div {:class "flex flex-col items-center justify-center min-h-screen bg-background"}
   [:h1 {:class "text-6xl font-bold text-gray-12 mb-4"} "404"]
   [:h2 {:class "text-2xl font-semibold text-gray-10 mb-6"} (t :page/not-found-title)]
   [:p {:class "text-gray-500 mb-8"} (t :page/not-found-desc)]
   (shui/button {:on-click #(rfe/push-state :home)
                 :variant :outline}
                (shui/tabler-icon "home") (t :page/go-back-home))])

(rum/defc current-page < rum/reactive
  {:did-mount    (fn [state]
                   (state/set-root-component! (:rum/react-component state))
                   (state/setup-electron-updater!)
                   (state/load-app-user-cfgs)
                   (ui/inject-document-devices-envs!)
                   (ui/inject-dynamic-style-node!)
                   (plugin-handler/host-mounted!)
                   (assoc state ::teardown (setup-fns!)))
   :will-unmount (fn [state]
                   (when-let [teardown (::teardown state)]
                     (teardown)))}
  []
  (if-let [route-match (state/sub :route-match)]
    (when-let [view (:view (:data route-match))]
      (ui/catch-error-and-notify
       (helpful-default-error-screen)
       [:<>
        (container/root-container
         route-match
         (view route-match))
        (when config/lsp-enabled?
          (plugin/hook-daemon-renderers))]))
    (not-found)))
