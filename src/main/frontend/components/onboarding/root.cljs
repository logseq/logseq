(ns frontend.components.onboarding.root
  "Central controller for DB onboarding flows"
  (:require [frontend.components.onboarding.shared :as shared]
            [frontend.state :as state]
            [frontend.rum :as frum]
            [frontend.ui :as ui]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc onboarding-root
  []
  (let [[entry-point _] (frum/use-atom-in state/state [:onboarding/entry-point])
        [status _] (frum/use-atom-in state/state [:onboarding/status])
        [current-step _] (frum/use-atom-in state/state [:onboarding/current-step])]
    
    ;; Single use-effect to handle all onboarding flows
    (hooks/use-effect!
     (fn []
       (when (and (not= entry-point "none")
                  (not= status "completed"))
         (case entry-point
           
           "md_update_popup"
           (shui/dialog-open!
            (fn []
              [:div.cp__onboarding-md-update-popup.p-6
               {:style {:max-width "600px"}}
               
               [:h2.text-2xl.font-bold.mb-2
                "Logseq DB is here"]
               
               [:p.text-base.opacity-70.mb-6
                "A new way to grow your graph – smarter tags, reusable templates, and collections."]
               
               [:div.mb-6.rounded-lg.bg-gray-100.dark:bg-gray-800
                {:style {:width "100%"
                         :height "200px"
                         :display "flex"
                         :align-items "center"
                         :justify-content "center"}}
                [:span.text-sm.opacity-50 "Image/GIF placeholder"]]
               
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
                        (state/reset-onboarding-state!))})
           
           "db_first_run"
           (cond
             (= current-step 0)
             (shui/dialog-open!
              (fn []
                [:div.cp__onboarding-welcome.p-8
                 {:style {:max-width "700px" :text-align "center"}}
                 
                 [:h1.text-3xl.font-bold.mb-4
                  "Welcome to Logseq DB"]
                 
                 [:p.text-lg.opacity-70.mb-8
                  "Your writing stays the same. Your graph gets smarter."]
                 
                 [:div.mb-8.rounded-lg.bg-gray-100.dark:bg-gray-800
                  {:style {:width "100%"
                           :height "300px"
                           :display "flex"
                           :align-items "center"
                           :justify-content "center"
                           :margin "0 auto"}}
                  [:span.text-sm.opacity-50 "Welcome illustration placeholder"]]
                 
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
                          (state/reset-onboarding-state!))})
             
             (and (> current-step 0) (< current-step 5))
             (let [slide-id current-step
                   slide (shared/get-slide-by-id slide-id)
                   total-slides (shared/get-total-slides)
                   is-first? (shared/is-first-slide? slide-id)
                   is-last? (shared/is-last-slide? slide-id)]
               (shui/dialog-open!
                (fn []
                  [:div.cp__onboarding-carousel.p-6
                   {:style {:max-width "800px"}}
                   
                   [:div.flex.justify-center.gap-2.mb-6
                    (for [i (range 1 (inc total-slides))]
                      [:div.w-2.h-2.rounded-full
                       {:key i
                        :class (if (= i slide-id) "bg-primary" "bg-gray-300 dark:bg-gray-700")
                        :style {:cursor "pointer"}
                        :on-click (fn []
                                   (state/set-onboarding-current-step! i))}])]
                   
                   (when slide
                     [:div.carousel-slide
                      [:h2.text-2xl.font-bold.mb-4
                       (:title slide)]
                      
                      [:p.text-base.opacity-70.mb-6
                       (:description slide)]
                      
                      [:div.mb-6.rounded-lg.bg-gray-100.dark:bg-gray-800
                       {:style {:width "100%"
                                :height "250px"
                                :display "flex"
                                :align-items "center"
                                :justify-content "center"}}
                       [:span.text-sm.opacity-50 "Slide visual placeholder"]]
                      
                      [:p.text-sm.opacity-60.mb-8
                       (:example-text slide)]])
                   
                   [:div.flex.justify-between.items-center
                    (if is-first?
                      [:div]
                      (ui/button
                       "Previous"
                       :intent "logseq"
                       :on-click (fn []
                                  (state/set-onboarding-current-step! (dec slide-id)))))
                    
                    (if is-last?
                      [:div.flex.gap-3
                       (ui/button
                        "Skip for now"
                        :intent "logseq"
                        :on-click (fn []
                                   (shui/dialog-close!)
                                   (state/set-onboarding-status! "skipped")
                                   (state/reset-onboarding-state!)))
                       
                       (ui/button
                        "Set up my DB graph"
                        :on-click (fn []
                                   (shui/dialog-close!)
                                   (state/set-onboarding-current-step! 5)))]
                      (ui/button
                       "Next"
                       :on-click (fn []
                                  (state/set-onboarding-current-step! (inc slide-id)))))]])
                {:id :carousel
                 :close-btn? true
                 :on-close (fn []
                            (state/reset-onboarding-state!))}))
             
             (>= current-step 5)
             (shui/dialog-open!
              (fn []
                [:div.cp__onboarding-setup-wizard.p-6
                 {:style {:max-width "600px"}}
                 
                 [:h2.text-2xl.font-bold.mb-4
                  "Setup Wizard"]
                 
                 [:p.text-base.opacity-70.mb-6
                  "The full setup wizard will be implemented here."]
                 
                 [:div.flex.justify-end
                  (ui/button
                   "Close"
                   :on-click (fn []
                              (state/set-onboarding-status! "completed")
                              (state/reset-onboarding-state!)
                              (shui/dialog-close!)))]])
              {:id :setup-wizard
               :close-btn? true
               :on-close (fn []
                          (state/reset-onboarding-state!))}))
           
           "db_replay_tour"
           (when (and (> current-step 0) (< current-step 5))
             (let [slide-id current-step
                   slide (shared/get-slide-by-id slide-id)
                   total-slides (shared/get-total-slides)
                   is-first? (shared/is-first-slide? slide-id)
                   is-last? (shared/is-last-slide? slide-id)]
               (shui/dialog-open!
                (fn []
                  [:div.cp__onboarding-carousel.p-6
                   {:style {:max-width "800px"}}
                   
                   [:div.flex.justify-center.gap-2.mb-6
                    (for [i (range 1 (inc total-slides))]
                      [:div.w-2.h-2.rounded-full
                       {:key i
                        :class (if (= i slide-id) "bg-primary" "bg-gray-300 dark:bg-gray-700")
                        :style {:cursor "pointer"}
                        :on-click (fn []
                                   (state/set-onboarding-current-step! i))}])]
                   
                   (when slide
                     [:div.carousel-slide
                      [:h2.text-2xl.font-bold.mb-4
                       (:title slide)]
                      
                      [:p.text-base.opacity-70.mb-6
                       (:description slide)]
                      
                      [:div.mb-6.rounded-lg.bg-gray-100.dark:bg-gray-800
                       {:style {:width "100%"
                                :height "250px"
                                :display "flex"
                                :align-items "center"
                                :justify-content "center"}}
                       [:span.text-sm.opacity-50 "Slide visual placeholder"]]
                      
                      [:p.text-sm.opacity-60.mb-8
                       (:example-text slide)]])
                   
                   [:div.flex.justify-between.items-center
                    (if is-first?
                      [:div]
                      (ui/button
                       "Previous"
                       :intent "logseq"
                       :on-click (fn []
                                  (state/set-onboarding-current-step! (dec slide-id)))))
                    
                    (if is-last?
                      [:div.flex.gap-3
                       (ui/button
                        "Skip for now"
                        :intent "logseq"
                        :on-click (fn []
                                   (shui/dialog-close!)
                                   (state/set-onboarding-status! "skipped")
                                   (state/reset-onboarding-state!)))
                       
                       (ui/button
                        "Set up my DB graph"
                        :on-click (fn []
                                   (shui/dialog-close!)
                                   (state/set-onboarding-current-step! 5)))]
                      (ui/button
                       "Next"
                       :on-click (fn []
                                  (state/set-onboarding-current-step! (inc slide-id)))))]
                   
                   [:div.mt-4.text-center.text-sm.opacity-50
                    "You can also open the setup wizard to configure your graph."]])
                {:id :carousel
                 :close-btn? true
                 :on-close (fn []
                            (state/reset-onboarding-state!))}))))))
     [entry-point status current-step])
    
    [:div {:style {:display "none"}}]))
