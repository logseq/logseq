(ns mobile.components.left-sidebar
  "Mobile left sidebar"
  (:require [cljs-bean.core :as bean]
            [dommy.core :as dom]
            [frontend.components.container :as container]
            [frontend.rum :as r]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.silkhq :as silkhq]
            [mobile.state :as mobile-state]
            [rum.core :as rum]))

(rum/defc sidebar-content
  []
  [:div.w-full.app-silk-popup-content-inner.px-2
   [:div.left-sidebar-inner
    [:div.sidebar-contents-container
     {:class "!gap-4"}
     (container/sidebar-favorites)
     (container/sidebar-recent-pages)]]])

(rum/defc left-sidebar-inner
  []
  (let [*ref (hooks/use-ref nil)
        [detent set-detent!] (r/use-atom mobile-state/*left-sidebar-detent)
        [inertOutside setInertOutside!] (r/use-atom mobile-state/*left-sidebar-inert-outside?)]

    (hooks/use-effect!
     (fn []
       (when (zero? detent)
         (set-detent! 1)))
     [])

    (silkhq/persistent-sheet
     {:key "left sidebar"
      :presented true
      :onPresentedChange (fn [_v])
      :activeDetent detent
      :onActiveDetentChange (fn [v]
                              (when v
                                (set-detent! (if (zero? v) 1 v))))}
     (silkhq/persistent-sheet-portal
      (silkhq/persistent-sheet-view
       {:class "app-silk-sidebar-sheet-view"
        :contentPlacement "left"
        :detents ["25px" "min(90vw, 325px)"]
        :onTravel (fn [v]
                    (when (empty? @mobile-state/*modal-blocks)
                      (let [{:keys [range]} (bean/->clj v)
                            {:keys [start end]} range
                            ref (.-current *ref)]
                        (when ref
                          (cond (and (= start 1) (= end 2))
                                (do
                                  (dom/remove-class! ref "Sidebar-hidden")
                                  (setInertOutside! true))

                                (and (<= start 1) (<= end 1))
                                (do
                                  (dom/add-class! ref "Sidebar-hidden")
                                  (setInertOutside! false)))))))
        :onClickOutside (fn []
                          (if (and (> detent 1)
                                   (not (dom/has-class? (.-current *ref) "Sidebar-hidden")))
                            (do
                              (mobile-state/close-left-sidebar!)
                              (bean/->js {:dismiss true}))
                            (bean/->js {:dismiss false
                                        :stopOverlayPropagation​ false})))

        :inertOutside inertOutside}
       (silkhq/persistent-sheet-content
        {:ref *ref
         :class "app-silk-sidebar-sheet-content Sidebar-content Sidebar-hidden"}
        (silkhq/persistent-sheet-expanded-content
         (sidebar-content))))))))

(rum/defc left-sidebar < rum/reactive
  []
  (when (rum/react mobile-state/*left-sidebar-open?)
    (when (empty? (rum/react mobile-state/*modal-blocks))
      (left-sidebar-inner))))
