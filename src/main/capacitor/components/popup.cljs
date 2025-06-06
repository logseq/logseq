(ns capacitor.components.popup
  (:require [capacitor.ionic :as ion]
            [capacitor.state :as state]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(defonce *last-popup-modal? (atom nil))

(defn popup-show!
  [event content-fn {:keys [id dropdown-menu?] :as opts}]
  (cond
    (and (keyword? id) (= "editor.commands" (namespace id)))
    ;; FIXME: Editing a block at bottom will scroll to top
    (do
      (shui-popup/show! [0 86] content-fn opts)
      (reset! *last-popup-modal? false))

    dropdown-menu?
    (do
      (shui-popup/show! event content-fn opts)
      (reset! *last-popup-modal? false))

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
