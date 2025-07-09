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
            [:div.app-silk-index-container
             [:h2.text-lg.font-semibold "Silk sheets demos"]

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
             ]))))))