(ns frontend.page
  (:require [rum.core :as rum]
            [frontend.state :as state]
            [frontend.components.sidebar :as sidebar]
            [frontend.ui :as ui]))

(rum/defc route-view
  [view route-match]
  (view route-match))

(rum/defc current-page < rum/reactive
  []
  (when-let [route-match (state/sub :route-match)]
    (if-let [view (:view (:data route-match))]
      (sidebar/sidebar
       route-match
       (view route-match))

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
      [:div "404 Page"])))
