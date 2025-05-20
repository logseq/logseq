(ns capacitor.components.editor
  (:require [rum.core :as rum]
            [capacitor.ionic :as ionic]
            [frontend.handler.notification :as notification]))

(rum/defc editor-aux
  [content {:keys [on-outside!]}]

  (let [*input (rum/use-ref nil)]

    (rum/use-effect!
      (fn []
        (let [timer (js/requestAnimationFrame
                      (fn []
                        (when-let [^js input (some-> (rum/deref *input)
                                               (.querySelector "textarea"))]
                          (.focus input)
                          (let [len (.-length (.-value input))]
                            (.setSelectionRange input len len))
                          ;(.scrollIntoView input #js {:behavior "smooth", :block "start"})
                          )))]
          #(js/clearTimeout timer)))
      [])

    (rum/use-effect!
      (fn []
        (let [handle-outside! (fn [^js e]
                                (when-not (some-> e (.-target) (.closest ".editor-aux-input"))
                                  (on-outside! e)))]
          (js/window.addEventListener "mousedown" handle-outside!)
          #(js/window.removeEventListener "mousedown" handle-outside!)))
      [])

    (ionic/ion-textarea
      {:class "editor-aux-input bg-gray-100 border"
       :ref *input
       :auto-grow true
       :autofocus true
       :value content})))

(rum/defc content-aux
  [content & opts]

  [:p content])