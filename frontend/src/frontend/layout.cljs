(ns frontend.layout
  (:require [frontend.mui :as mui]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [frontend.components.file :as file]
            [frontend.components.repo :as repo]
            [rum.core :as rum]
            [clojure.string :as string]))

(rum/defc frame < rum/reactive
  [content width]
  (let [state (rum/react state/state)
        {:keys [files drawer? snackbar? snackbar-message current-repo]} state
        mobile? (and width (<= width 600))]
    (mui/theme-provider
     {:theme (mui/custom-theme)}
     [:div {:class "root"
            :style {:padding-bottom 100}}
      (mui/css-baseline)
      (mui/app-bar
       {:position "static"}
       (mui/tool-bar
        {}
        (if mobile?
          (mui/icon-button {:edge "start"
                            :class "menuButton"
                            :color "inherit"
                            :on-click (fn []
                                        (handler/toggle-drawer? true))}
                           (mui/menu-icon)))
        (mui/typography {:class "grow"
                         :variant "h6"
                         :color "inherit"
                         :no-wrap true
                         :on-click (fn []
                                     (handler/change-page :home)
                                     (handler/reset-current-file))}
                        "Gitnotes")

        (mui/button {:color "inherit"
                     :on-click (fn []
                                 (handler/sync))}
          "Sync")

        (mui/button {:color "inherit"
                     :on-click (fn []
                                 (handler/change-page :settings))}
          "Settings")))

      (repo/repos (:repos state))

      content

      (if mobile?
        (mui/drawer {:open drawer?
                     :disableBackdropTransition true
                     :on-open (fn []
                                (handler/toggle-drawer? true))
                     :on-close (fn []
                                 (handler/toggle-drawer? false))}
                    [:div {:style {:width 240}}
                     (file/files-list current-repo files)]))

      (mui/snackbar {:open snackbar?
                     :auto-hide-duration 3000
                     :message snackbar-message})])))
