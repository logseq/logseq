(ns frontend.components.widgets
  (:require [clojure.string :as string]
            [frontend.context.i18n :as i18n]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.web.nfs :as nfs]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]
            [frontend.config :as config]
            [frontend.mobile.util :as mobile-util]))

(rum/defc choose-preferred-format
  []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div
     [:h1.title {:style {:margin-bottom "0.25rem"}}
      (t :format/preferred-mode)]

     [:div.mt-4.ml-1
      (ui/button
       "Markdown"
       :on-click
       #(user-handler/set-preferred-format! :markdown))

      [:span.ml-2.mr-2 "-OR-"]

      (ui/button
       "Org Mode"
       :on-click
       #(user-handler/set-preferred-format! :org))]]))

(rum/defcs add-github-repo <
  (rum/local "" ::repo)
  (rum/local "" ::branch)
  [state]
  (let [repo (get state ::repo)
        branch (get state ::branch)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div.flex.flex-col
       [:div.w-full.mx-auto
        [:div
         [:div
          [:h1.title
           (t :git/add-repo-prompt)]
          [:div.mt-4.mb-4.relative.rounded-md.shadow-sm.max-w-xs
           [:input#repo.form-input.block.w-full.sm:text-sm.sm:leading-5
            {:autoFocus true
             :placeholder "https://github.com/username/repo"
             :on-change (fn [e]
                          (reset! repo (util/evalue e)))}]]
          [:label.font-medium "Default Branch (make sure it's matched with your setting on GitHub): "]
          [:div.mt-2.mb-4.relative.rounded-md.shadow-sm.max-w-xs
           [:input#branch.form-input.block.w-full.sm:text-sm.sm:leading-5
            {:value @branch
             :placeholder "e.g. main"
             :on-change (fn [e]
                          (reset! branch (util/evalue e)))}]]]]

        (ui/button
         (t :git/add-repo-prompt-confirm)
         :on-click
         (fn []
           (let [branch (string/trim @branch)]
             (if (string/blank? branch)
               (notification/show!
                [:p.text-gray-700.dark:text-gray-300 "Please input a branch, make sure it's matched with your setting on GitHub."]
                :error
                false)
               (let [repo (util/lowercase-first @repo)]
                 (if (util/starts-with? repo "https://github.com/")
                   (let [repo (string/replace repo ".git" "")]
                     (repo-handler/create-repo! repo branch))

                   (notification/show!
                    [:p.text-gray-700.dark:text-gray-300 "Please input a valid repo url, e.g. https://github.com/username/repo"]
                    :error
                    false)))))))]])))

(rum/defc add-local-directory
  []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div.flex.flex-col
     [:h1.title (t :on-boarding/add-graph)]
     (let [nfs-supported? (or (nfs/supported?) (mobile-util/is-native-platform?))]
       (if (mobile-util/is-native-platform?)
         [:div.text-sm
          (ui/button "Open a local directory"
            :on-click #(page-handler/ls-dir-files! shortcut/refresh!))
          [:hr]
          [:ol
           [:li
            [:div.font-bold.mb-2 "How to sync my notes?"]
            (if (mobile-util/native-android?)
              [:div
               [:p "We're developing our built-in paid Logseq Sync, but you can use any third-party sync service to keep your notes sync with other devices."]
               [:p "If you prefer to use Dropbox to sync your notes, you can use "
                [:a {:href "https://play.google.com/store/apps/details?id=com.ttxapps.dropsync"
                     :target "_blank"}
                 "Dropsync"]
                ". Or you can use "
                [:a {:href "https://play.google.com/store/apps/details?id=dk.tacit.android.foldersync.lite"
                     :target "_blank"}
                 "FolderSync"]
                "."]]
              [:div
               [:p "You can sync your graphs by using iCloud. Please choose an existing graph or create a new graph in your iCloud Drive's Logseq directory."]
               [:p "We're developing our built-in paid Logseq Sync. Stay tuned."]])]

           [:li.mt-8
            [:div.font-bold.mb-2 "I need some help"]
            [:p "👋 Join our discord group to chat with the makers and our helpful community members."]
            (ui/button "Join the community"
                       :href "https://discord.gg/KpN4eHY"
                       :target "_blank")]]]
         [:div.cp__widgets-open-local-directory
          [:div.select-file-wrap.cursor
           (when nfs-supported?
             {:on-click #(page-handler/ls-dir-files! shortcut/refresh!)})
           [:div
            [:h1.title (t :on-boarding/open-local-dir)]
            [:p (t :on-boarding/new-graph-desc-1)]
            [:p (t :on-boarding/new-graph-desc-2)]
            [:ul
             [:li (t :on-boarding/new-graph-desc-3)]
             [:li (t :on-boarding/new-graph-desc-4)]
             [:li (t :on-boarding/new-graph-desc-5)]]
            (when-not nfs-supported?
              (ui/admonition :warning
                             [:p "It seems that your browser doesn't support the "
                              [:a {:href   "https://web.dev/file-system-access/"
                                   :target "_blank"}
                               "new native filesystem API"]
                              [:span ", please use any Chromium 86+ based browser like Chrome, Vivaldi, Edge, etc. Notice that the API doesn't support mobile browsers at the moment."]]))]]]))]))

(rum/defc android-permission-alert
  []
  (when (mobile-util/native-android?)
    (rum/with-context [[_t] i18n/*tongue-context*]
      [:div.flex.flex-col
       [:h1.title "Storage access permission"]
       [:div.text-sm
        [:div
         [:p "Logseq needs the permission to access your device storage. Read "
          [:a {:href "https://developer.android.com/about/versions/11/privacy/storage#all-files-access"
               :target "_blank"}
           "more"]
          "."]
         [:div
          (ui/button "Grant Permission"
                     :on-click #(page-handler/ls-dir-files! shortcut/refresh!))]
         [:p.mb-1 "Note:"]
         [:ol
          [:li "We will never access files outside of your graph folders you choose."]
          [:li "If you have granted the permission, you don't need to do it again."]]]
        [:hr]]])))

(rum/defcs add-graph <
  [state & {:keys [graph-types]
            :or {graph-types [:local :github]}}]
  (let [github-authed? (state/github-authed?)
        generate-f (fn [x]
                     (case x
                       :github
                       (when (and github-authed? (not (util/electron?)))
                         (rum/with-key (add-github-repo)
                           "add-github-repo"))

                       :local
                       [(rum/with-key (android-permission-alert)
                          "andoird-permission-alert")
                        (rum/with-key (add-local-directory)
                          "add-local-directory")]

                       nil))
        available-graph (->> (set graph-types)
                             (keep generate-f)
                             (vec)
                             (interpose [:b.mt-10.mb-5.opacity-50 "OR"]))]
    (rum/with-context [[_t] i18n/*tongue-context*]
      [:div.p-8.flex.flex-col available-graph])))

(rum/defc demo-graph-alert
  []
  (when (and (config/demo-graph?)
             (not config/publishing?))
    (rum/with-context [[t] i18n/*tongue-context*]
      (ui/admonition
        :warning
        [:p (t :on-boarding/demo-graph)]))))

(rum/defc github-integration-soon-deprecated-alert
  []
  (when-let [repo (state/get-current-repo)]
    (when (string/starts-with? repo "https://github.com")
      [:div.github-alert
       (ui/admonition
        :warning
        [:p "We're going to deprecate the GitHub integration when the mobile app is out, you can switch to the latest "
         [:a {:href "https://github.com/logseq/logseq/releases"
              :target "_blank"}
          "desktop app"]
         [:span ", see more details at "]
         [:a {:href "https://discord.com/channels/725182569297215569/735735090784632913/861656585578086400"
              :target "_blank"}
          "here"]
         [:span "."]])])))
