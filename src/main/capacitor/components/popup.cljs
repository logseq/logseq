(ns capacitor.components.popup
  (:require [capacitor.ionic :as ion]
            [capacitor.state :as state]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(defn popup-show!
  [event content-fn {:keys [id dropdown-menu?] :as opts}]
  (cond
    (and (keyword? id) (= "editor.commands" (namespace id)))
    ;; FIXME: Editing a block at bottom will scroll to top
    (shui-popup/show! [0 86] content-fn opts)

    dropdown-menu?
    (shui-popup/show! event content-fn opts)

    :else
    (when (fn? content-fn)
      (state/set-popup! {:open? true
                         :content-fn content-fn
                         :opts opts}))))

(set! shui/popup-show! popup-show!)

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
