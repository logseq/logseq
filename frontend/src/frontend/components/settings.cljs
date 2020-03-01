(ns frontend.components.settings
  (:require [rum.core :as rum]
            [frontend.mui :as mui]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.handler :as handler]
            [clojure.string :as string]))

(defn settings-form
  [github-token github-repo]
  [:form {:style {:min-width 300}}
        (mui/grid
         {:container true
          :direction "column"}
         (mui/text-field {:id "standard-basic"
                          :style {:margin-bottom 12}
                          :label "Github repo"
                          :on-change (fn [event]
                                       (let [v (util/evalue event)]
                                         (swap! state/state assoc :github-repo v)))
                          :value github-repo
                          })
         (mui/button {:variant "contained"
                      :color "primary"
                      :on-click (fn []
                                  (when (and github-token github-repo)
                                    (handler/clone github-token github-repo)))}
           "Sync"))])

(rum/defc settings < rum/reactive
  []
  ;; Change repo and basic token
  (let [state (rum/react state/state)
        {:keys [github-token github-repo]} state]
    (mui/container
     {:id "root-container"
      :style {:display "flex"
              :justify-content "center"
              :margin-top 64}}

     [:div

      (settings-form github-token github-repo)

      (mui/divider {:style {:margin "24px 0"}})

      ;; clear storage
      (mui/button {:on-click handler/clear-storage
                   :color "primary"}
        "Clear storage and clone")])))
