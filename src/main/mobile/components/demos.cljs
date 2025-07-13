(ns mobile.components.demos
  (:require [logseq.shui.ui :as shui]
            [rum.core :as rum]
            [logseq.shui.silkhq :as silkhq]))

(rum/defc depth-view-example
  [{:keys [nested?]}]
  (silkhq/depth-sheet-view
    (silkhq/depth-sheet-backdrop)
    (silkhq/depth-sheet-content
      {:class "flex flex-col items-center"}
      (silkhq/scroll {:as-child true}
        (silkhq/scroll-view
          {:class "app-silk-scroll-view"
           :scrollGestureTrap {:yEnd true}}
          (silkhq/scroll-content
            {:class "app-silk-scroll-content"}
            [:div.app-silk-scroll-content-inner
             [:h1.my-4.text-3xl.font-semibold "hello silk depth view"]
             (when (not nested?)
               (silkhq/depth-sheet
                 (silkhq/depth-sheet-trigger
                   (shui/button {:class "primary-green text-lg"} "Open: nested depth sheet view")
                   (silkhq/depth-sheet-portal
                     (depth-view-example {:nested? true})))))
             [:ul
              (for [_ (range 60)]
                [:li "hello world list item!"])]
             ]))))))

(rum/defc stacking-view-example
  [{:keys [nested?]}]
  (silkhq/stacking-sheet-view
    (silkhq/stacking-sheet-backdrop)
    (silkhq/stacking-sheet-content
      (silkhq/stacking-sheet-handle)
      [:div.flex.justify-center.py-10.flex-col.gap-3.items-center
       [:h2.text-2xl.text-semibold.py-40 "Hello stacking bottom sheet..."]
       (when (not nested?)
         (silkhq/stacking-sheet
           (silkhq/stacking-sheet-trigger
             (shui/button "open: nested stacking sheet"))
           (silkhq/stacking-sheet-portal
             (stacking-view-example {:nested? false}))))])))

(rum/defc parallax-page-view-example
  []
  (silkhq/parallax-page-view-portal
    (silkhq/parallax-page-view
      (silkhq/parallax-page-backdrop)
      (silkhq/parallax-page-content
        [:h2.text-lg.font-medium.my-4.bg-green-100 "parallax page"])
      (silkhq/parallax-page-topbar-portal
        (silkhq/parallax-page-topbar-title "New page title"))
      )))

(rum/defc silkhq-demos-page
  []
  (silkhq/depth-sheet-stack {:as-child true}
    (silkhq/depth-sheet-scenery-outlets
      ;; as root page
      (silkhq/parallax-page-stack {:as-child true}
        (silkhq/parallax-page-stack-scenery-outlet {:as-child true}
          (silkhq/scroll {:as-child true}
            (silkhq/scroll-view
              {:safeArea "none"
               :pageScroll true
               :nativePageScrollReplacement true}
              (silkhq/scroll-content {:class "app-silk-index-scroll-content"}
                [:div.app-silk-index-container
                 [:h2.text-xl.font-semibold.pt-4 "Silk sheets demos"]

                 ;; Bottom Sheet case
                 (silkhq/bottom-sheet
                   (silkhq/bottom-sheet-trigger
                     {:class "w-full"}
                     (shui/button {:variant :secondary :class "w-full"} "0. Static Bottom Sheet"))
                   (silkhq/bottom-sheet-portal
                     (silkhq/bottom-sheet-view
                       (silkhq/bottom-sheet-backdrop)
                       (silkhq/bottom-sheet-content
                         {:class "flex flex-col items-center p-2"}
                         (silkhq/bottom-sheet-handle)
                         [:div.py-60.flex
                          [:h1.my-4.text-2xl "hello silkhq"]]))))

                 ;; Detent Sheet case
                 (silkhq/detent-sheet
                   (silkhq/detent-sheet-trigger
                     {:class "w-full"}
                     (shui/button {:variant :secondary :class "w-full"} "1. Detent Bottom Sheet"))
                   (silkhq/detent-sheet-portal
                     (silkhq/detent-sheet-view
                       (silkhq/detent-sheet-backdrop)
                       (silkhq/detent-sheet-content
                         {:class "flex flex-col items-center p-2"}
                         (silkhq/detent-sheet-handle)
                         [:div.py-60.flex
                          [:h1.my-4.text-2xl "hello silkhq"]]))))

                 ;; Depth Sheet case
                 (silkhq/depth-sheet
                   (silkhq/depth-sheet-trigger
                     {:class "w-full"}
                     (shui/button {:variant :secondary :class "w-full"} "2. Depth Bottom Sheet"))
                   (silkhq/depth-sheet-portal
                     (depth-view-example {:nested? false})))

                 ;; Stacking depth sheet case
                 (silkhq/stacking-sheet-stack
                   {:as-child true}
                   (silkhq/stacking-sheet
                     (silkhq/stacking-sheet-trigger
                       {:class "w-full"}
                       (shui/button {:variant :secondary :class "w-full"} "3. Stacking Bottom Sheet"))

                     (silkhq/stacking-sheet-portal
                       (stacking-view-example {:nested? false}))))

                 ;; parallax page
                 (silkhq/parallax-page
                   (silkhq/parallax-page-trigger
                     {:class "w-full"}
                     (shui/button {:variant :secondary :class "w-full"} "4. Parallax page"))
                   (parallax-page-view-example))
                 ]))))

        ;; top bar
        ;(silkhq/parallax-page-stack-island {:as-child true}
          ;(silkhq/fixed
          ;  (silkhq/parallax-page-stack-island-content
          ;    (silkhq/fixed-content {:as-child true :class "flex justify-center items-center"}
          ;      [:div.app-silk-topbar-title.text-semibold
          ;       (silkhq/parallax-page-stack-topbar-title-outlet "Silk demos")
          ;       (silkhq/parallax-page-stack-topbar-title-container)
          ;       ])))
          ;)
        ))))