(ns frontend.layout
  (:require [frontend.mui :as mui]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [frontend.components.link :as link]
            [frontend.components.file :as file]
            [rum.core :as rum]
            [clojure.string :as string]))

(rum/defc frame < rum/reactive
  [content width link-dialog?]
  (let [state (rum/react state/state)
        {:keys [files drawer? snackbar? snackbar-message]} state
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
                                 (handler/change-page :links))}
          "Links")

        (mui/button {:color "inherit"
                     :on-click (fn []
                                 (handler/change-page :settings))}
          "Settings")

        (mui/icon-button {:color "inherit"
                          :class "addButton"
                          :on-click (fn []
                                      (handler/toggle-link-dialog? true))}
                         (mui/add-icon))))
      content

      (if mobile?
        (mui/drawer {:open drawer?
                     :disableBackdropTransition true
                     :on-open (fn []
                                (handler/toggle-drawer? true))
                     :on-close (fn []
                                 (handler/toggle-drawer? false))}
                    [:div {:style {:width 240}}
                     (file/files-list files)]))

      (link/dialog link-dialog?)

      (mui/snackbar {:open snackbar?
                     :auto-hide-duration 3000
                     :message snackbar-message})])))
