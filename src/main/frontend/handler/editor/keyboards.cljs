(ns frontend.handler.editor.keyboards
  (:require [frontend.state :as state]
            [frontend.util :as util]
            [frontend.handler.editor :as editor-handler]
            [dommy.core :as d]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.mixins :as mixins]))

;; TODO: don't depend on handler.editor

(defn esc-save! [state]
  (let [id (nth (:rum/args state) 1)]
    (mixins/hide-when-esc-or-outside
     state
     :on-hide
     (fn [state e event]
       (let [target (.-target e)]
         (if (d/has-class? target "bottom-action") ;; FIXME: not particular case
           (.preventDefault e)
           (let [{:keys [on-hide format value block id repo dummy?]} (editor-handler/get-state)]
             (when on-hide
               (on-hide value event))
             (when
              (or (= event :esc)
                  (= event :visibilitychange)
                  (and (= event :click)
                       (not (editor-handler/auto-complete?))))
               (state/clear-edit!))))))
     :node (gdom/getElement id)
    ;; :visibilitychange? true
)))
