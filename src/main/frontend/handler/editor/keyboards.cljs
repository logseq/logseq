(ns ^:no-doc frontend.handler.editor.keyboards
  (:require [frontend.handler.editor :as editor-handler]
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
       (cond
         (contains?
          #{:commands :block-commands
            :page-search :page-search-hashtag :block-search :template-search
            :property-search :property-value-search
            :datepicker}
          (state/get-editor-action))
         (state/clear-editor-action!) ;; FIXME: This should probably be handled as a keydown handler in editor, but this handler intercepts Esc first

         ;; editor/input component handles Escape directly, so just prevent handling it here
         (= :input (state/get-editor-action))
         nil

         (some-> (.-target e)
                 (.closest ".ls-keep-editing-when-outside-click"))
         nil

         :else
         (let [{:keys [on-hide value]} (editor-handler/get-state)]
           (when on-hide
             (on-hide value event))
           (when (contains? #{:esc :visibilitychange :click} event)
             (state/clear-edit!)))))
     :node (gdom/getElement id)
    ;; :visibilitychange? true
)))
