(ns mobile.components.editor-toolbar
  "Mobile editor toolbar"
  (:require [frontend.commands :as commands]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.camera :as mobile-camera]
            [frontend.mobile.haptics :as haptics]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [logseq.common.util.page-ref :as page-ref]
            [mobile.init :as init]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- blur-if-compositing
  "Call blur on the textarea if it is in composition mode, let the IME commit the composing text"
  []
  (when-let [edit-input-id (and (state/editor-in-composition?)
                                (state/get-edit-input-id))]
    (let [textarea-el (gdom/getElement edit-input-id)]
      (.blur textarea-el))))

(rum/defc indent-outdent [indent? icon]
  [:div
   [:button.bottom-action
    {:on-pointer-down (fn [e]
                        (util/stop e)
                        (haptics/haptics)
                        (blur-if-compositing)
                        (editor-handler/indent-outdent indent?))}
    (ui/icon icon {:size ui/icon-size})]])

(rum/defc command
  [command-handler {:keys [icon class]} & [event?]]
  [:div
   [:button.bottom-action
    {:on-pointer-down (fn [e]
                        (util/stop e)
                        (haptics/haptics)
                        (if event?
                          (command-handler e)
                          (command-handler)))}
    (ui/icon icon {:size ui/icon-size :class class})]])

(defn- insert-text
  [text opts]
  (when-let [parent-id (state/get-edit-input-id)]
    (let [input (gdom/getElement parent-id)
          pos (cursor/pos input)
          c (when (> pos 0)
              (str (nth (.-value input) (dec pos))))
          text' (if (and c (not= c " "))
                  (str " " text)
                  text)]
      (commands/simple-insert! parent-id text' opts))))

(defn commands
  []
  [(command #(insert-text "#" {}) {:icon "hash"} true)
   (command #(insert-text page-ref/left-and-right-brackets
                          {:backward-pos 2
                           :check-fn (fn [_ _ _]
                                       (let [input (state/get-input)
                                             new-pos (cursor/get-caret-pos input)]
                                         (state/set-editor-action-data! {:pos new-pos})
                                         (commands/handle-step [:editor/search-page])))})

            {:icon "brackets"} true)
   (command #(insert-text "/" {}) {:icon "command"} true)])

(rum/defc mobile-bar < rum/reactive
  []
  (when (and (util/mobile?)
             (or (state/sub :editor/editing?)
                 (= "app-keep-keyboard-open-input" (some-> js/document.activeElement (.-id)))))
    (let [commands' (commands)]
      [:div#mobile-editor-toolbar
       [:div.toolbar-commands
        ;; (command (editor-handler/move-up-down true) {:icon "arrow-bar-to-up"})
        ;; (command (editor-handler/move-up-down false) {:icon "arrow-bar-to-down"})
        (command #(do
                    (blur-if-compositing)
                    (editor-handler/cycle-todo!))
                 {:icon "checkbox"} true)
        (indent-outdent false "arrow-left-to-arc")
        (indent-outdent true "arrow-right-to-arc")
        ;; (command history/undo! {:icon "rotate" :class "rotate-180"} true)
        ;; (command history/redo! {:icon "rotate-clockwise" :class "rotate-180"} true)
        ;; (timestamp-submenu parent-id)
        (for [command' commands']
          command')
        (command #(let [parent-id (state/get-edit-input-id)]
                    (mobile-camera/embed-photo parent-id)) {:icon "camera"} true)]
       [:div.toolbar-hide-keyboard
        (command #(p/do!
                   (editor-handler/save-current-block!)
                   (state/clear-edit!)
                   (init/keyboard-hide)) {:icon "keyboard-show"})]])))
