(ns mobile.components.demos
  (:require [logseq.shui.ui :as shui]
            [rum.core :as rum]
            [mobile.components.ui-silk :as ui-silk]
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
             (shui/input)
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

(rum/defc page-view-example
  []
  (silkhq/page-portal
    (silkhq/page-view
      (silkhq/page-backdrop)
      (silkhq/page-content
        (silkhq/scroll {:as-child true}
          (silkhq/scroll-view
            {:class "h-full"}
            (silkhq/scroll-content {:as-child true}
              [:article.p-6
               (for [_ (range 80)]
                 [:h2.text-lg.font-medium.my-4.bg-green-100
                  "inner page"])])))))))

(rum/defc demos-inner []
  [:div.app-silk-index-container
   [:h2.text-xl.font-semibold.pt-2 "Silk sheets demos"]
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
   (silkhq/page
     (silkhq/page-trigger
       {:class "w-full"}
       (shui/button {:variant :secondary :class "w-full"} "4. Single page"))
     (page-view-example))])

(rum/defc silkhq-demos-page
  []
  (silkhq/depth-sheet-stack {:as-child true}
    (silkhq/depth-sheet-scenery-outlets
      (silkhq/scroll {:as-child true}
        (silkhq/scroll-view
          {:safeArea "none"
           :pageScroll true
           :nativePageScrollReplacement true}
          (silkhq/scroll-content {:class "app-silk-index-scroll-content"}
            (demos-inner))))

      ;; app topbar
      (ui-silk/app-silk-topbar
        {:title "Silk Demos "
         :left-render (shui/button {:variant :icon :size :sm}
                        (shui/tabler-icon "chevron-left" {:size 22}))
         :right-render [:<>
                        (shui/button {:variant :icon :size :sm}
                          (shui/tabler-icon "plus" {:size 22}))
                        (shui/button {:variant :icon :size :sm}
                          (shui/tabler-icon "dots" {:size 22}))]})
      ;; app tabs
      (ui-silk/app-silk-tabs)
      )))