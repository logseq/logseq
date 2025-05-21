(ns capacitor.components.editor
  (:require [rum.core :as rum]
            [capacitor.components.ui :as ui]
            [capacitor.ionic :as ionic]
            [frontend.util.cursor :as cursor]
            [frontend.util :as util]
            [frontend.handler.notification :as notification]))

(rum/defc editor-aux
  [content {:keys [on-outside! on-save!]}]

  (let [*input (rum/use-ref nil)]

    (rum/use-layout-effect!
      (fn []
        (js/requestAnimationFrame
          (fn []
            (when-let [^js input (some-> (rum/deref *input))]
              (.focus input)
              (let [len (.-length (.-value input))]
                (.setSelectionRange input len len))
              ;(.scrollIntoView input #js {:behavior "smooth", :block "start"})
              )))
        #())
      [])

    (rum/use-effect!
      (fn []
        (let [handle-outside! (fn [^js e]
                                (when-not (some-> e (.-target) (.closest ".editor-aux-input"))
                                  (on-outside! e)))]
          (js/window.addEventListener "pointerdown" handle-outside!)
          #(js/window.removeEventListener "pointerdown" handle-outside!)))
      [])

    (let [save-content!
          (fn [opts]
            (let [content (.-value (rum/deref *input))]
              (when on-save!
                (prn :debug "save block content:" content opts)
                (on-save! content opts))))
          debounce-save-content! (util/debounce save-content! 500)]
      (ui/textarea
        {:class "editor-aux-input bg-gray-200 border-none"
         :ref *input
         :on-key-down (fn [^js e]
                        (let [ekey (.-key e)
                              target (.-target e)
                              enter? (= ekey "Enter")]

                          (cond
                            (and enter? (cursor/end? target))
                            (do (save-content! {:enter? true})
                              (util/stop e))
                            :else (debounce-save-content!)
                            )))
         :default-value content}))))

(rum/defc content-aux
  [content & opts]

  [:div.content-aux-container content])