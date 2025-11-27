(ns frontend.components.onboarding.md-update-popup
  "MD update popup modal - Scenario 1"
  (:require [frontend.state :as state]
            [frontend.rum :as frum]
            [frontend.ui :as ui]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc md-update-popup
  []
  (let [[entry-point _] (frum/use-atom-in state/state [:onboarding/entry-point])]
    (hooks/use-effect!
     (fn []
       (when (= entry-point "md_update_popup")
         (shui/dialog-open!
          (fn []
         [:div.cp__onboarding-md-update-popup.p-6
          {:style {:max-width "600px"}}
          
          [:h2.text-2xl.font-bold.mb-2
           "Logseq DB is here"]
          
          [:p.text-base.opacity-70.mb-6
           "A new way to grow your graph – smarter tags, reusable templates, and collections."]
          
          ;; Placeholder for image/GIF
          [:div.mb-6.rounded-lg.bg-gray-100.dark:bg-gray-800
           {:style {:width "100%"
                    :height "200px"
                    :display "flex"
                    :align-items "center"
                    :justify-content "center"}}
           [:span.text-sm.opacity-50 "Image/GIF placeholder"]]
          
          ;; Bullet list of key features
          [:ul.space-y-3.mb-8
           [:li.flex.items-start
            [:span.mr-3 "•"]
            [:span "Turn tags into reusable templates for people, books, meetings, and more."]]
           [:li.flex.items-start
            [:span.mr-3 "•"]
            [:span "Fill in fields like Author, Status, or Participants without breaking your writing flow."]]
           [:li.flex.items-start
            [:span.mr-3 "•"]
            [:span "Get automatic collections on tag pages instead of manual index pages."]]]
          
          ;; Buttons
          [:div.flex.gap-3.justify-end
           (ui/button
            "Not now"
            :intent "logseq"
            :on-click (fn []
                       (state/reset-onboarding-state!)
                       (shui/dialog-close!)))
           
           (ui/button
            "Get Logseq DB"
            :on-click (fn []
                       (shui/dialog-close!)
                       (state/set-onboarding-entry-point! "db_first_run")
                       (state/set-onboarding-status! "in_progress")
                       (state/set-onboarding-current-step! 0)))]])
       {:id :md-update-popup
        :close-btn? true
         :on-close (fn []
                   (state/reset-onboarding-state!))})))
     [entry-point])
    [:div {:style {:display "none"}}]))
