(ns frontend.components.onboarding.carousel
  "Carousel component for 'What's new' slides"
  (:require [frontend.components.onboarding.shared :as shared]
            [frontend.state :as state]
            [frontend.rum :as frum]
            [frontend.ui :as ui]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc carousel
  [{:keys [show-welcome? entry-point]}]
  (let [[entry-point-state _] (frum/use-atom-in state/state [:onboarding/entry-point])
        [current-step _] (frum/use-atom-in state/state [:onboarding/current-step])
        slide-id (if (< current-step 1) 1 current-step)
        slide (shared/get-slide-by-id slide-id)
        total-slides (shared/get-total-slides)
        is-first? (shared/is-first-slide? slide-id)
        is-last? (shared/is-last-slide? slide-id)]
    
    (hooks/use-effect!
     (fn []
       (when (and (not= entry-point-state "none")
                  (> current-step 0)
                  (< current-step 5))
         (shui/dialog-open!
          (fn []
         [:div.cp__onboarding-carousel.p-6
          {:style {:max-width "800px"}}
          
          ;; Progress indicator (dots)
          [:div.flex.justify-center.gap-2.mb-6
           (for [i (range 1 (inc total-slides))]
             [:div.w-2.h-2.rounded-full
              {:key i
               :class (if (= i slide-id) "bg-primary" "bg-gray-300 dark:bg-gray-700")
               :style {:cursor "pointer"}
               :on-click (fn []
                          (state/set-onboarding-current-step! i))}])]
          
          ;; Slide content
          (when slide
            [:div.carousel-slide
             [:h2.text-2xl.font-bold.mb-4
              (:title slide)]
             
             [:p.text-base.opacity-70.mb-6
              (:description slide)]
             
             ;; Placeholder for visual
             [:div.mb-6.rounded-lg.bg-gray-100.dark:bg-gray-800
              {:style {:width "100%"
                       :height "250px"
                       :display "flex"
                       :align-items "center"
                       :justify-content "center"}}
              [:span.text-sm.opacity-50 "Slide visual placeholder"]]
             
             [:p.text-sm.opacity-60.mb-8
              (:example-text slide)]])
          
          ;; Navigation buttons
          [:div.flex.justify-between.items-center
           ;; Previous button
           (if is-first?
             [:div] ; Empty div for spacing
             (ui/button
              "Previous"
              :intent "logseq"
              :on-click (fn []
                         (state/set-onboarding-current-step! (dec slide-id)))))
           
           ;; Next/Finish buttons
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
                         (state/set-onboarding-current-step! (inc slide-id)))))])
         
         ;; Footer note for replay tour
         (when (= entry-point "db_replay_tour")
           [:div.mt-4.text-center.text-sm.opacity-50
            "You can also open the setup wizard to configure your graph."])])
       {:id :carousel
        :close-btn? true
        :on-close (fn []
                   (when (= entry-point "db_replay_tour")
                     (state/reset-onboarding-state!)))})))
     [entry-point-state current-step])
    [:div {:style {:display "none"}}]))
