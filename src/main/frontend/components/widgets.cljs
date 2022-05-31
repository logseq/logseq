(ns frontend.components.widgets
  (:require [frontend.context.i18n :refer [t]]
            [frontend.handler.page :as page-handler]
            [frontend.handler.web.nfs :as nfs]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.ui :as ui]
            [rum.core :as rum]
            [frontend.config :as config]
            [frontend.mobile.util :as mobile-util]))

(rum/defc add-local-directory
  []
  [:div.flex.flex-col
   [:h1.title (t :on-boarding/add-graph)]
   (let [nfs-supported? (or (nfs/supported?) (mobile-util/native-platform?))]
     (if (mobile-util/native-platform?)
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
                            [:span ", please use any Chromium 86+ based browser like Chrome, Vivaldi, Edge, etc. Notice that the API doesn't support mobile browsers at the moment."]]))]]]))])

(rum/defc android-permission-alert
  []
  (when (mobile-util/native-android?)
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
      [:hr]]]))

(rum/defcs add-graph <
  [state & {:keys [graph-types]
            :or {graph-types [:local]}}]
  (let [generate-f (fn [x]
                     (case x
                       :local
                       [(rum/with-key (android-permission-alert)
                          "android-permission-alert")
                        (rum/with-key (add-local-directory)
                          "add-local-directory")]

                       nil))
        available-graph (->> (set graph-types)
                             (keep generate-f)
                             (vec)
                             (interpose [:b.mt-10.mb-5.opacity-50 "OR"]))]
    [:div.p-8.flex.flex-col available-graph]))

(rum/defc demo-graph-alert
  []
  ;; (when (and (config/demo-graph?)
  ;;            (not config/publishing?))
  ;;   (ui/admonition
  ;;    :warning
  ;;    [:p (t :on-boarding/demo-graph)]))
  )
