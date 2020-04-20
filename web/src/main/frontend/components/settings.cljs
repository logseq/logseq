(ns frontend.components.settings
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.handler :as handler]
            [frontend.util :as util]
            [clojure.string :as string]))

(rum/defcs set-email < (rum/local "" ::email)
  [state]
  (let [email (get state ::email)]
    [:div.p-8.flex.items-center.justify-center.bg-white
    [:div.w-full.max-w-xs.mx-auto
     [:div
      [:div
       [:h2 "Your email:" ]
       [:span.text-gray-500.text-sm.pl-1 "(Git commit requires)"]
       [:div.mt-2.mb-2.relative.rounded-md.shadow-sm
        [:input#.form-input.block.w-full.pl-2.sm:text-sm.sm:leading-5
         {:autoFocus true
          :on-change (fn [e]
                       (reset! email (util/evalue e)))}]]]]
     (ui/button
       "Submit"
       (fn []
         (handler/set-email! @email)))]]))

;; (defn settings-form
;;   [github-token github-repo]
;;   [:form {:style {:min-width 300}}
;;         (mui/grid
;;          {:container true
;;           :direction "column"}
;;          (mui/text-field {:id "standard-basic"
;;                           :style {:margin-bottom 12}
;;                           :label "Github repo"
;;                           :on-change (fn [event]
;;                                        (let [v (util/evalue event)]
;;                                          (swap! state/state assoc :github-repo v)))
;;                           :value github-repo
;;                           })
;;          (mui/button {:variant "contained"
;;                       :color "primary"
;;                       :on-click (fn []
;;                                   (when (and github-token github-repo)
;;                                     (handler/clone github-token github-repo)))}
;;            "Sync"))])

;; (rum/defc settings < rum/reactive
;;   []
;;   ;; Change repo and basic token
;;   (let [state (rum/react state/state)
;;         {:keys [github-token github-repo]} state]
;;     (mui/container
;;      {:id "root-container"
;;       :style {:display "flex"
;;               :justify-content "center"
;;               :margin-top 64}}

;;      [:div

;;       (settings-form github-token github-repo)

;;       (mui/divider {:style {:margin "24px 0"}})

;;       ;; clear storage
;;       (mui/button {:on-click handler/clear-storage
;;                    :color "primary"}
;;         "Clear storage and clone")])))
