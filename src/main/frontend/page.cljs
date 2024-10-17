(ns frontend.page
  "Provides root component for both Logseq app and publishing build"
  (:require [rum.core :as rum]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.ui :as ui]
            [frontend.components.container :as container]
            [frontend.handler.search :as search-handler]
            [frontend.handler.notification :as notification]
            [frontend.components.onboarding.quick-tour :as quick-tour]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.components.plugins :as plugin]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.export :as export]
            [frontend.util :as util]
            [reitit.frontend.easy :as rfe]))

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
  (let [current-repo (state/get-current-repo)
        db-based? (config/db-based-graph? current-repo)]
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
                [:div [:span.font-bold "Reload"] " the app"]]
               [:div (ui/icon "command") (ui/icon "letter-r")]]
            [:div.flex.flex-row.justify-between.align-items.mb-2.items-center.py-4
             [:div.flex.flex-col.items-start
              [:div.text-2xs.font-bold.uppercase.toned-down (t :page/step "1")]
              [:div [:span.highlighted.font-bold "Rebuild"] [:span.toned-down " search index"]]]
             [:div
              (ui/button (t :page/try)
                         :small? true
                         :on-click (fn []
                                     (search-handler/rebuild-indices! true)))]]
            [:div.flex.flex-row.justify-between.align-items.mb-2.items-center.separator-top.py-4
             [:div.flex.flex-col.items-start
              [:div.text-2xs.font-bold.uppercase.toned-down (t :page/step "2")]
              [:div [:span.highlighted.font-bold "Relaunch"] [:span.toned-down " the app"]]
              [:div.text-xs.toned-down "Quit the app and then reopen it."]]
             [:div (ui/icon "command" {:class "rounded-md p-1 mr-2 bg-quaternary"})
              (ui/icon (if (util/electron?) "letter-q" "letter-r") {:class "rounded-md p-1 bg-quaternary"})]]
            (when db-based?
              [:div.flex.flex-row.justify-between.align-items.mb-4.items-center.separator-top.py-4
               [:div.flex.flex-col.items-start.mr-2
                [:div.text-2xs.font-bold.uppercase.toned-down (t :page/step "3")]
                [:div [:span.highlighted.font-bold "Export "] [:span.toned-down " current graph as SQLite db"]]
                [:div.text-xs.toned-down "You can send it to help@logseq.com for debugging."]
                [:a#download-as-sqlite-db.hidden]]
               [:div
                (ui/button "Export graph"
                           :small? true
                           :on-click #(export/export-repo-as-sqlite-db! current-repo))]])

            [:div.flex.flex-row.justify-between.align-items.mb-4.items-center.separator-top.py-4
             [:div.flex.flex-col.items-start
              [:div.text-2xs.font-bold.uppercase.toned-down (t :page/step (if db-based? "4" "3"))]
              [:div [:span.highlighted.font-bold "Clear"] [:span.toned-down " local storage"]]
              [:div.text-xs.toned-down "This does delete minor preferences like dark/light theme preference."]]
             [:div
              (ui/button (t :page/try)
                         :small? true
                         :on-click (fn []
                                     (.clear js/localStorage)
                                     (notification/show! "Cleared!" :success)))]]]
           [:div
            (when-not db-based?
              [:p "If you think you have experienced data loss, check for backup files under
          the folder logseq/bak/."])
            (when db-based?
              [:p "You can also go to "
               [:a {:title "All graphs"
                    :on-click (fn []
                                (set! (.-href js/window.location) (rfe/href :graphs))
                                (.reload js/window.location))}
                "All graphs"]
               " to switch to another graph."])
            [:p "If these troubleshooting steps have not solved your problem, please "
             [:a.underline
              {:href "https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml"}
              "open an issue."]]]]]]]]]
     (ui/notification)]))

(rum/defc current-page < rum/reactive
  {:did-mount    (fn [state]
                   (state/set-root-component! (:rum/react-component state))
                   (state/setup-electron-updater!)
                   (state/load-app-user-cfgs)
                   (ui/inject-document-devices-envs!)
                   (ui/inject-dynamic-style-node!)
                   (quick-tour/init)
                   (plugin-handler/host-mounted!)
                   (assoc state ::teardown (setup-fns!)))
   :will-unmount (fn [state]
                   (when-let [teardown (::teardown state)]
                     (teardown)))}
  []
  (when-let [route-match (state/sub :route-match)]
    (let [route-name (get-in route-match [:data :name])]
      (when-let [view (:view (:data route-match))]
        (ui/catch-error-and-notify
          (helpful-default-error-screen)
          [:<>
           (if (= :draw route-name)
             (view route-match)
             (container/root-container
               route-match
               (view route-match)))
           (when config/lsp-enabled?
             (plugin/hook-daemon-renderers))])))))
