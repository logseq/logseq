(ns frontend.components.onboarding.root
  "Central controller for DB onboarding flows"
  (:require [clojure.string :as string]
            [frontend.components.onboarding.db-onboarding-demo :as demo]
            [frontend.components.onboarding.shared :as shared]
            [frontend.rum :as frum]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

;; Reactive carousel content component that reads current-step from state
(rum/defc carousel-content-component
  [{:keys [entry-point]}]
  (let [[current-step _] (frum/use-atom-in state/state [:onboarding/current-step])
        [prev-step set-prev-step!] (hooks/use-state current-step)
        [direction set-direction!] (hooks/use-state :forward)
        [is-transitioning set-is-transitioning!] (hooks/use-state false)
        slide-id (if (< current-step 1) 1 current-step)
        prev-slide-id (if (< prev-step 1) 1 prev-step)
        total-slides (shared/get-total-slides)
        is-first? (shared/is-first-slide? slide-id)
        is-last? (shared/is-last-slide? slide-id)]
    
    ;; Track direction and previous step when current-step changes
    (hooks/use-effect!
     (fn []
       (if (= current-step prev-step)
         ;; Initial mount - no direction change
         (do
           (set-direction! :forward)
           (set-is-transitioning! false))
         ;; Calculate direction based on step change
         (let [new-direction (if (> current-step prev-step) :forward :backward)]
           (set-direction! new-direction)
           (set-is-transitioning! true)
           ;; After animation completes, update prev-step
           (js/setTimeout
            (fn []
              (set-prev-step! current-step)
              (set-is-transitioning! false))
            500))))
     [current-step])
    
    ;; Handle Enter key to advance to next slide
    (hooks/use-effect!
     (fn []
       (let [handle-keydown (fn [e]
                              (when (and (= (.-key e) "Enter")
                                         (not (util/input? (.-target e))))
                                (if is-last?
                                  (do
                                    (shui/dialog-close!)
                                    (state/set-onboarding-current-step! 6))
                                  (state/set-onboarding-current-step! (inc slide-id)))
                                (.preventDefault e)
                                (.stopPropagation e)))]
         (.addEventListener js/window "keydown" handle-keydown)
         (fn []
           (.removeEventListener js/window "keydown" handle-keydown))))
     [slide-id is-last?])
    
    [:div.cp__onboarding-carousel
     {:style {:width "100%"
              :padding "0"
              :overflow "hidden"
              :box-sizing "border-box"}}

     ;; Progress indicator (dots) - fixed position (with padding)
     [:div.flex.justify-center.gap-2.mb-6
      {:style {:padding-top "1.5rem"
               :padding-left "1.5rem"
               :padding-right "1.5rem"}}
      (for [i (range 1 (inc total-slides))]
        [:div.w-2.h-2.rounded-full
         {:key i
          :class (if (= i slide-id) "bg-primary" "bg-gray-300 dark:bg-gray-700")
          :style {:cursor "pointer"}
          :on-click (fn []
                      (state/set-onboarding-current-step! i))}])]

     ;; Animated slide content area - carousel track with all slides
     [:div.carousel-content-wrapper
      {:style {:position "relative"
               :overflow "hidden"
               :min-height "400px"
               :background-color "rgba(255, 0, 0, 0.1)"}}  ;; DEBUG: Red tint for wrapper
      [:div.carousel-track
       {:class (str "carousel-track-" (name direction))
        :style {:display "flex"
                :width (str (* 100 total-slides) "%")
                :transform (str "translateX(" (* -1 (dec slide-id) (/ 100 total-slides)) "%)")
                :transition "transform 0.5s ease-in-out"
                :background-color "rgba(0, 255, 0, 0.1)"}}  ;; DEBUG: Green tint for track
       (for [i (range 1 (inc total-slides))]
         (let [slide-data (shared/get-slide-by-id i)
               is-active? (= i slide-id)
               is-leaving? (and is-transitioning (= i prev-slide-id))
               is-entering? (and is-transitioning (= i slide-id))]
           [:div.carousel-slide-content
            {:key i
             :class (cond
                      is-leaving? (str "carousel-slide-leaving-" (name direction))
                      is-entering? (str "carousel-slide-entering-" (name direction))
                      is-active? "carousel-slide-active"
                      :else "carousel-slide-inactive")
             :style {:width (str (/ 100 total-slides) "%")
                     :flex-shrink 0
                     :padding "1.5rem"
                     :box-sizing "border-box"
                     :max-width "100%"
                     :background-color (cond
                                         is-active? "rgba(0, 0, 255, 0.1)"  ;; DEBUG: Blue for active
                                         is-leaving? "rgba(255, 165, 0, 0.2)"  ;; DEBUG: Orange for leaving
                                         is-entering? "rgba(255, 0, 255, 0.2)"  ;; DEBUG: Magenta for entering
                                         :else "rgba(128, 128, 128, 0.05)")}}  ;; DEBUG: Gray for inactive
            (when slide-data
              [:div.carousel-slide-inner
               [:h2.text-2xl.font-bold.mb-4.flex.items-center.gap-2
                (:title slide-data)
                (when (:has-pro-pill? slide-data)
                  [:span.inline-flex.items-center.px-2.py-0.5.rounded-full.text-xs.font-medium
                   {:style {:background-color "var(--lx-gray-03, var(--rx-gray-03))"
                            :color "var(--lx-gray-11, var(--rx-gray-11))"}}
                   "Pro"])]

               ;; Render description as multiple paragraphs (split by newlines)
               [:div.text-base.opacity-70.mb-6
                (for [para (string/split (:description slide-data) #"\n\n")]
                  [:p.mb-3 {:key para} para])]

               [:div.mb-6
                (demo/carousel-demo-window {:slide i})]

               (when (:secondary-cta slide-data)
                 [:div.mb-4.flex.justify-center
                  (ui/button
                   (:secondary-cta slide-data)
                   :variant :secondary
                   :on-click (fn [] ;; No-op for now
                              nil))])

               [:p.text-sm.opacity-60.mb-8
                (:example-text slide-data)]])]))]]

     ;; Fixed navigation buttons at bottom (with padding)
     [:div.flex.justify-between.items-center.mt-6
      {:style {:position "relative"
               :padding-bottom "1.5rem"
               :padding-left "1.5rem"
               :padding-right "1.5rem"}}
      (if is-first?
        [:div]
        ;; Secondary button for Back on slides 2-5
        (ui/button
         "Back"
         :variant :secondary
         :on-click (fn []
                     (state/set-onboarding-current-step! (dec slide-id)))))

      (if is-last?
        [:div.flex.gap-3.items-center
         ;; Secondary button for Skip
         (ui/button
          "Skip for now"
          :variant :secondary
          :on-click (fn []
                      (shui/dialog-close!)
                      (state/set-onboarding-status! "skipped")
                      (state/reset-onboarding-state!)))

         ;; Primary button for Set up
         (ui/button
          "Set up my DB graph"
          :on-click (fn []
                      (shui/dialog-close!)
                      (state/set-onboarding-current-step! 6)))]
        ;; Primary button for Next on slides 1-4 with Enter shortcut
        (ui/button
         [:span.flex.items-center.gap-2
          "Next"
          (shui/shortcut "Enter" {:size :xs :interactive? false})]
         :on-click (fn []
                     (state/set-onboarding-current-step! (inc slide-id)))))]

     ;; Footer note for replay tour (with padding)
     (when (= entry-point "db_replay_tour")
       [:div.mt-4.text-center.text-sm.opacity-50
        {:style {:padding-left "1.5rem"
                 :padding-right "1.5rem"
                 :padding-bottom "1.5rem"}}
        "You can also open the setup wizard to configure your graph."])]))

(rum/defc onboarding-root
  []
  (let [[entry-point _] (frum/use-atom-in state/state [:onboarding/entry-point])
        [status _] (frum/use-atom-in state/state [:onboarding/status])
        [current-step _] (frum/use-atom-in state/state [:onboarding/current-step])]

    ;; Separate effect for opening modals (doesn't depend on current-step)
    (hooks/use-effect!
     (fn []
       (when (and entry-point
                  status
                  (not= entry-point "none")
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
                "Turn your notes into a flexible database – without changing how you write."]

               [:div.mb-6
                (demo/md-update-visual)]

               [:ul.space-y-3.mb-8
                [:li.flex.items-start
                 [:span.mr-3 "•"]
                 [:span "Keep typing in bullets and pages, just like today."]]
                [:li.flex.items-start
                 [:span.mr-3 "•"]
                 [:span "Add simple fields like Author, Status, or Participants when you need them."]]
                [:li.flex.items-start
                 [:span.mr-3 "•"]
                 [:span "See all your books, people, or meetings in tidy lists that stay up to date."]]]

               [:div.flex.gap-3.justify-end
                ;; Secondary button - quiet style
                (ui/button
                 "Not now"
                 :variant :secondary
                 :on-click (fn []
                             (state/reset-onboarding-state!)
                             (shui/dialog-close!)))

                ;; Primary button - blue
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

                 [:div.mb-8
                  (demo/welcome-visual)]

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

             (and (> current-step 0) (< current-step 6))
             ;; Open carousel modal once - it will stay open and content will update reactively
             (when-not (shui/dialog-get :carousel)
               (shui/dialog-open!
                (fn []
                  (carousel-content-component {:entry-point entry-point}))
                {:id :carousel
                 :close-btn? true
                 :content-props {:class "!p-0"
                                 :style {:padding "0"}}
                 :on-close (fn []
                             (state/reset-onboarding-state!))}))

             (>= current-step 6)
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
           ;; Open carousel modal once - it will stay open and content will update reactively
           (when (and (> current-step 0) (< current-step 6))
             (when-not (shui/dialog-get :carousel)
               (shui/dialog-open!
                (fn []
                  (carousel-content-component {:entry-point entry-point}))
                {:id :carousel
                 :close-btn? true
                 :content-props {:class "!p-0"
                                 :style {:padding "0"}}
                 :on-close (fn []
                             (state/reset-onboarding-state!))}))))))
     [entry-point status])

    [:div {:style {:display "none"}}]))
