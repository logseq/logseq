(ns mobile.components.left-sidebar
  "Mobile left sidebar"
  (:require [cljs-bean.core :as bean]
            [dommy.core :as dom]
            [frontend.components.container :as container]
            [frontend.rum :as r]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.silkhq :as silkhq]
            [mobile.state :as mobile-state]
            [rum.core :as rum]))

(rum/defc sidebar-content
  []
  [:div.w-full.app-silk-popup-content-inner.px-2
   [:div.left-sidebar-inner
    [:div.sidebar-contents-container
     {:class "!gap-4"
      :on-pointer-down
      (fn [^js e]
        (when (some-> (.-target e) (.closest ".link-item"))
          (mobile-state/close-left-sidebar!)))}
     (container/sidebar-favorites)
     (container/sidebar-recent-pages)]]])

(rum/defc left-sidebar
  []
  (let [*ref (hooks/use-ref nil)
        [detent set-detent!] (r/use-atom mobile-state/*left-sidebar-detent)
        [{:keys [open? _block]}] (mobile-state/use-singleton-modal)
        [inertOutside setInertOutside!] (r/use-atom mobile-state/*left-sidebar-inert-outside?)]

    (hooks/use-effect!
     (fn []
       (when (zero? detent)
         (set-detent! 1)))
     [])

    (when-not open?
      (silkhq/persistent-sheet
       {:presented true
        :onPresentedChange (fn [_v])
        :activeDetent detent
        :onActiveDetentChange (fn [v]
                                (when (and v (not= v detent))
                                  (set-detent! v)))}
       (silkhq/persistent-sheet-portal
        (silkhq/persistent-sheet-view
         {:class "app-silk-sidebar-sheet-view"
          :contentPlacement "left"
          :detents ["25px" "min(90vw, 325px)"]
          :onTravel (fn [v]
                      (when-not open?
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
          :onClickOutside (fn [e]
                            (util/stop e)
                            (bean/->js {:dismiss false}))

          :inertOutside inertOutside}
         (silkhq/persistent-sheet-content
          {:ref *ref
           :class "app-silk-sidebar-sheet-content Sidebar-content Sidebar-hidden"}
          (silkhq/persistent-sheet-expanded-content
           (sidebar-content)))))))))
