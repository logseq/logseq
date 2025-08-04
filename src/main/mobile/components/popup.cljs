(ns mobile.components.popup
  "Mobile popup"
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.silkhq :as silkhq]
            [logseq.shui.ui :as shui]
            [mobile.init :as init]
            [mobile.state :as mobile-state]
            [rum.core :as rum]))

(defonce *last-popup-modal? (atom nil))

(defn wrap-calc-commands-popup-side
  [pos opts]
  (let [[side mh] (let [[_x y _ height] pos
                        vh (.-clientHeight js/document.body)
                        [th bh] [y (- vh (+ y height) 310)]]
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
    (let [opts (wrap-calc-commands-popup-side event opts)
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
    (when content-fn
      (mobile-state/set-popup! {:open? true
                                :content-fn content-fn
                                :opts opts})
      (reset! *last-popup-modal? true))))

(defn popup-hide!
  [& args]
  (cond
    (= :download-rtc-graph (first args))
    (do
      (mobile-state/set-popup! nil)
      (mobile-state/redirect-to-tab! "home"))

    :else
    (if (and @*last-popup-modal? (not (= (first args) :editor.commands/commands)))
      (mobile-state/set-popup! nil)
      (apply shui-popup/hide! args))))

(set! shui/popup-show! popup-show!)
(set! shui/popup-hide! popup-hide!)

(rum/defc popup < rum/reactive
  []
  (let [{:keys [open? content-fn opts]} (rum/react mobile-state/*popup-data)]

    (when open?
      (state/clear-edit!)
      (init/keyboard-hide))

    (silkhq/bottom-sheet
     (merge
      {:presented (boolean open?)
       :onPresentedChange (fn [v?]
                            (cond
                              (false? v?)
                              (do
                                (mobile-state/set-popup! nil)
                                (state/clear-edit!)
                                (state/pub-event! [:mobile/keyboard-will-hide]))
                              (and (true? v?) (= :ls-quick-add (:id opts)))
                              (editor-handler/quick-add-open-last-block!)))}
      (:modal-props opts))
     (silkhq/bottom-sheet-portal
      (silkhq/bottom-sheet-view
       {:class "app-silk-popup-sheet-view"}
       (silkhq/bottom-sheet-backdrop)
       (silkhq/bottom-sheet-content
        {:class "flex flex-col items-center p-2"}
        (silkhq/bottom-sheet-handle)
        [:div.w-full.app-silk-popup-content-inner.p-2
         (when-let [title (:title opts)]
           [:h2.py-2.opacity-40 title])
         (if (fn? content-fn) (content-fn) content-fn)]))))))
