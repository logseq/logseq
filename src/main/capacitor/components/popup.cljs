(ns capacitor.components.popup
  (:require [capacitor.ionic :as ion]
            [capacitor.state :as state]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(defonce *last-popup-modal? (atom nil))

(defn warp-calc-commands-popup-side
  [pos opts]
  (let [side (let [[_x y _ height] pos
                   vh js/window.innerHeight
                   [th bh] [y (- vh (+ y height) 300)]]
               (if (> bh 200) "bottom"
                 (if (> (- th bh) 100)
                   "top" "bottom")))]
    (-> (assoc opts :auto-side? false)
      (assoc-in [:content-props :side] side))))

(defn popup-show!
  [event content-fn {:keys [id dropdown-menu?] :as opts}]
  (cond
    (and (keyword? id) (= "editor.commands" (namespace id)))
    ;; FIXME: Editing a block at bottom will scroll to top
    (let [opts (warp-calc-commands-popup-side event opts)
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
  (if @*last-popup-modal?
    (state/set-popup! nil)
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
