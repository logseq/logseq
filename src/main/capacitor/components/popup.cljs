(ns capacitor.components.popup
  (:require [capacitor.ionic :as ion]
            [capacitor.state :as state]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(defonce *last-popup-modal? (atom nil))

(defn warp-calc-commands-popup-side
  [pos opts]
  (let [[side mh] (let [[_x y _ height] pos
                   vh js/window.innerHeight
                   [th bh] [y (- vh (+ y height) 300)]]
               (case (if (> bh 280) "bottom"
                       (if (> (- th bh) 100)
                         "top" "bottom"))
                 "top" ["top" th]
                 ["bottom" bh]))]
    (-> (assoc opts :auto-side? false)
        (assoc :max-popup-height mh)
        (assoc-in [:content-props :side] side))))

(defn popup-show!
  [event content-fn {:keys [id dropdown-menu?] :as opts}]
  (cond
    (and (keyword? id) (= "editor.commands" (namespace id)))
    (let [opts (warp-calc-commands-popup-side event opts)
          side (some-> opts :content-props :side)
          max-h (some-> opts :max-popup-height (js/parseInt) (- 48))
          _ (when max-h (js/document.documentElement.style.setProperty
                          (str "--" side "-popup-content-max-height") (str max-h "px")))
          pid (shui-popup/show! event content-fn opts)]
      (reset! *last-popup-modal? false) pid)

    dropdown-menu?
    (let [pid (shui-popup/show! event content-fn opts)]
      (reset! *last-popup-modal? false) pid)

    :else
    (when (fn? content-fn)
      (state/set-popup! {:open? true
                         :content-fn content-fn
                         :opts opts})
      (reset! *last-popup-modal? true))))

(defn popup-hide!
  [& args]
  (when-not  @*last-popup-modal?
    (apply shui-popup/hide! args)))

(set! shui/popup-show! popup-show!)
(set! shui/popup-hide! popup-hide!)

(rum/defc popup < rum/reactive
  []
  (let [{:keys [open? content-fn _opts]} (rum/react state/*popup-data)]
    (ion/modal
     {:isOpen (boolean open?)
      :initialBreakpoint 0.75
      :breakpoints #js [0 0.75 1]
      :onDidDismiss (fn [] (state/set-popup! nil))
      :expand "block"}
     (ion/content
      {:class "ion-padding"}
      (when content-fn
        (content-fn))))))
