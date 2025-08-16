(ns mobile.components.left-sidebar
  "Mobile left sidebar"
  (:require [cljs-bean.core :as bean]
            [dommy.core :as dom]
            [frontend.components.container :as container]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.silkhq :as silkhq]
            [mobile.state :as mobile-state]
            [rum.core :as rum]))

(rum/defc sidebar-content
  []
  [:div.w-full.app-silk-popup-content-inner.p-2
   [:div.left-sidebar-inner
    [:div.sidebar-contents-container.mt-8
     {:on-pointer-down
      (fn [^js e]
        (when (some-> (.-target e) (.closest ".link-item"))
          (mobile-state/close-left-sidebar!)))}
     (container/sidebar-favorites)
     (container/sidebar-recent-pages)]]])

(rum/defc left-sidebar
  []
  (let [*ref (hooks/use-ref nil)
        [detent set-detent!] (mobile-state/use-left-sidebar-detent)
        [inertOutside setInertOutside!] (hooks/use-state false)]
    (hooks/use-effect!
     (fn []
       (set-detent! 1))
     [])
    (silkhq/persistent-sheet
     {:presented true
      :onPresentedChange (fn [_v])
      :activeDetent (if (= detent 0) 1 detent)
      :onActiveDetentChange (fn [_v])}
     (silkhq/persistent-sheet-portal
      (silkhq/persistent-sheet-view
       {:class "app-silk-sidebar-sheet-view"
        :contentPlacement "left"
        :detents ["25px" "min(90vw, 325px)"]
        :onTravel (fn [v]
                    (let [{:keys [range]} (bean/->clj v)
                          {:keys [start end]} range
                          ref (.-current *ref)]
                      (cond (and (= start 1) (= end 2))
                            (do
                              (dom/remove-class! ref "Sidebar-hidden")
                              (setInertOutside! true))

                            (and (= start 1) (= end 1))
                            (do
                              (dom/add-class! ref "Sidebar-hidden")
                              (setInertOutside! false)))))
        :inertOutside inertOutside}
       (silkhq/persistent-sheet-content
        {:ref *ref
         :class "app-silk-sidebar-sheet-content Sidebar-content Sidebar-hidden"}
        (silkhq/persistent-sheet-expanded-content
         (sidebar-content))))))))
