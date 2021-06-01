(ns frontend.handler.migrate
  (:require [frontend.handler.export :as export]
            [frontend.handler.file :as file]
            [frontend.handler.repo :as repo]
            [frontend.handler.config :as config-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.web.nfs :as nfs-handler]
            [frontend.handler.user :as user-handler]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [promesa.core :as p]
            [clojure.string :as string]))

(defn convert-md-files!
  [repo]
  (when repo
    (let [files (export/get-md-file-contents repo)]
      (when (seq files)
        (-> (p/all (for [[path content] files]
                     (file/alter-file repo path content {:add-history? false
                                                         :reset? false})))
            (p/then (fn []
                      (config-handler/set-config! :markdown/version 2)

                      (p/let [_ (repo/push repo {:commit-message "Converted to new Markdown syntax!"})]
                        (repo/re-index! nfs-handler/rebuild-index!)

                        (notification/show!
                         [:div
                          [:p "All markdown files have been converted to the new Markdown syntax successfully!"]]
                         :success
                         false))))
            (p/catch (fn [e]
                       (throw e))))))))

(defn show-convert-notification!
  [repo]
  (notification/show!
   [:div
    [:h1 (str "Graph: " repo)]

    [:p "Previously Logseq uses `#` Markdown heading as outliner bullets, since beta, we've changed to use more standard `-` unordered list as outliner bullets."]

    [:div
     [:p.mt-2 "If you've converted this graph before, click on this button so that you won't see this notification again."]
     (ui/button "Yes, it's already converted!"
       :on-click (fn []
                   (notification/clear-all!)
                   (config-handler/set-config! :markdown/version 2)))]

    [:hr]

    [:p "Let's make a backup first."]
    [:p
     (ui/button "Download this graph"
       :on-click (fn []
                   (export/export-repo-as-zip! repo)))]

    [:div
     [:b "Make sure you've downloaded this graph! Now let's convert the Markdown files."]
     [:p
      (ui/button "Start to convert!"
        :on-click (fn []
                    (notification/clear-all!)
                    (convert-md-files! repo)))]]]
   :warning
   false))

(defn show-migrated-notification!
  [repo]
  (notification/show!
   [:div
    [:h1 (str "Graph: " repo)]

    [:p "Previously Logseq uses `#` Markdown heading as outliner bullets, since beta, we've changed to use more standard `-` unordered list as outliner bullets."]

    [:hr]

    [:p "1. Let's make a backup first."]
    [:p
     (ui/button "Download this graph"
       :on-click (fn [] (export/export-git-repo-as-zip! repo)))]

    [:div
     [:p [:b "2. Make sure you've downloaded this graph! Now click this button to logout and login again."]]
     (ui/button "Logout"
       :on-click user-handler/sign-out!)]]
   :warning
   false))
