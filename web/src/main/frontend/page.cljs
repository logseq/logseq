(ns frontend.page
  (:require [rum.core :as rum]
            [frontend.state :as state]
            [frontend.components.sidebar :as sidebar]
            [frontend.ui :as ui]
            [frontend.handler.notification :as notification]
            [frontend.storage :as storage]))

(rum/defc route-view
  [view route-match]
  (view route-match))

(rum/defc current-page < rum/reactive
  {:did-mount (fn [state]
                (state/set-root-component! (:rum/react-component state))
                (when (and (not= (state/get-journal-basis) "daily")
                           (not= (storage/get "migration-notified") "true"))
                    (notification/show! 
                     [:p
                      "Logseq is moving towards a daily basis for storing journal entries and the current monthly journal files is deprecated and would be made read-only in a later time. To begin your migration, go to Settings."
                      [:br]
                      (ui/button "Go to Settings"
                                 :href "/settings" 
                                 :on-click (fn [e] (notification/clear! e) (storage/set "migration-notified" "true")))]
                     :warning
                     false))
                state)}
  []
  (when-let [route-match (state/sub :route-match)]
    (let [route-name (get-in route-match [:data :name])]
      (if-let [view (:view (:data route-match))]
        (if (= :draw route-name)
          (view route-match)
          (sidebar/sidebar
           route-match
           (view route-match)))

        ;; FIXME: disable for now
        ;; (let [route-name (get-in route-match [:data :name])
        ;;       no-animate? (contains? #{:repos :repo-add :file}
        ;;                              route-name)]
        ;;   (when-let [view (:view (:data route-match))]
        ;;     (sidebar/sidebar
        ;;      route-match
        ;;      (if no-animate?
        ;;        (route-view view route-match)
        ;;        (ui/transition-group
        ;;         {:class-name "router-wrapper"}
        ;;         (ui/css-transition
        ;;          {:class-names "pageChange"
        ;;           :key route-name
        ;;           :timeout {:enter 300
        ;;                     :exit 200}}
        ;;          (route-view view route-match)))))))
        [:div "404 Page"]))))
