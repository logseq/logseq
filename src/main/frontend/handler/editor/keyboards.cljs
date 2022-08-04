(ns frontend.handler.editor.keyboards
  (:require [dommy.core :as d]
            [frontend.handler.editor :as editor-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [goog.dom :as gdom]))

;; TODO: don't depend on handler.editor

(defn esc-save! [state]
  (let [id (nth (:rum/args state) 1)]
    (mixins/hide-when-esc-or-outside
     state
     :on-hide
     (fn [_state e event]
       (let [target (.-target e)]
         (cond
           (state/get-editor-action)
           (state/clear-editor-action!) ;; FIXME: This should probably be handled as a keydown handler in editor, but this handler intercepts Esc first

           (d/has-class? target "bottom-action") ;; FIXME: not particular case
           (.preventDefault e)

           :else
           (let [{:keys [on-hide value]} (editor-handler/get-state)]
             (when on-hide
               (on-hide value event))
             (when (contains? #{:esc :visibilitychange :click} event)
               (state/clear-edit!))))))
     :node (gdom/getElement id)
    ;; :visibilitychange? true
)))
