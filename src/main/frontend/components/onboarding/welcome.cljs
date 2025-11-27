(ns frontend.components.onboarding.welcome
  "Welcome screen for DB first run - Scenario 2"
  (:require [frontend.state :as state]
            [frontend.rum :as frum]
            [frontend.ui :as ui]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc welcome-screen
  []
  (let [[entry-point _] (frum/use-atom-in state/state [:onboarding/entry-point])
        [current-step _] (frum/use-atom-in state/state [:onboarding/current-step])]
    (hooks/use-effect!
     (fn []
       (when (and (= entry-point "db_first_run")
                  (= current-step 0))
         (shui/dialog-open!
          (fn []
         [:div.cp__onboarding-welcome.p-8
          {:style {:max-width "700px" :text-align "center"}}
          
          [:h1.text-3xl.font-bold.mb-4
           "Welcome to Logseq DB"]
          
          [:p.text-lg.opacity-70.mb-8
           "Your writing stays the same. Your graph gets smarter."]
          
          ;; Placeholder for visual/illustration
          [:div.mb-8.rounded-lg.bg-gray-100.dark:bg-gray-800
           {:style {:width "100%"
                    :height "300px"
                    :display "flex"
                    :align-items "center"
                    :justify-content "center"
                    :margin "0 auto"}}
           [:span.text-sm.opacity-50 "Welcome illustration placeholder"]]
          
          ;; Primary button
          [:div.flex.justify-center
           (ui/button
            "See what's new"
            :size "lg"
            :on-click (fn []
                       (shui/dialog-close!)
                       (state/set-onboarding-current-step! 1)))]])
       {:id :welcome-screen
        :close-btn? false
        :on-close (fn []
                   (state/reset-onboarding-state!))})))
     [entry-point current-step])
    [:div {:style {:display "none"}}]))
