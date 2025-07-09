(ns mobile.components.demos
  (:require [logseq.shui.ui :as shui]
            [rum.core :as rum]
            [logseq.shui.silkhq :as silkhq]))

(rum/defc silkhq-demos-page
  []
  (silkhq/depth-sheet-stack {:as-child true}
    (silkhq/depth-sheet-scenery-outlets
      [:div.py-4.flex.flex-col.gap-3.px-4.app-silk-index-container
       [:h2.text-lg.font-semibold "Silk sheets demos"]
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

       (silkhq/depth-sheet
         (silkhq/depth-sheet-trigger
           {:class "w-full"}
           (shui/button {:variant :secondary :class "w-full"} "2. Depth Bottom Sheet"))
         (silkhq/depth-sheet-portal
           (silkhq/depth-sheet-view
             (silkhq/depth-sheet-backdrop)
             (silkhq/depth-sheet-content
               {:class "flex flex-col items-center p-2"}
               (silkhq/depth-sheet-handle)
               [:div.py-60.flex
                [:h1.my-4.text-2xl "hello silkhq"]])))
         )
       ]
      )))