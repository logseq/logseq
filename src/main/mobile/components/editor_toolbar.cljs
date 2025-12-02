(ns mobile.components.editor-toolbar
  "Mobile editor toolbar"
  (:require [frontend.colors :as colors]
            [frontend.commands :as commands]
            [frontend.components.svg :as svg]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.camera :as mobile-camera]
            [frontend.mobile.haptics :as haptics]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.shui.hooks :as hooks]
            [mobile.components.recorder :as recorder]
            [mobile.init :as mobile-init]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- blur-if-compositing
  "Call blur on the textarea if it is in composition mode so IME can commit composing text."
  []
  (when-let [edit-input-id (and (state/editor-in-composition?)
                                (state/get-edit-input-id))]
    (some-> (gdom/getElement edit-input-id)
            (.blur))))

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

(defn- insert-page-ref!
  []
  (let [{:keys [block]} (editor-handler/get-state)]
    (when block
      (let [input (state/get-input)]
        (state/clear-editor-action!)
        (let [selection (editor-handler/get-selection-and-format)
              {:keys [selection-start selection-end selection]} selection]
          (if selection
            (do
              (editor-handler/delete-and-update input selection-start selection-end)
              (editor-handler/insert (page-ref/->page-ref selection)))
            (insert-text page-ref/left-and-right-brackets
                         {:backward-pos 2
                          :check-fn (fn [_ _ _]
                                      (let [input (state/get-input)
                                            new-pos (cursor/get-caret-pos input)]
                                        (state/set-editor-action-data! {:pos new-pos})
                                        (commands/handle-step [:editor/search-page])))})))))))

(defn- indent-outdent-action
  [indent?]
  {:id (if indent? "indent" "outdent")
   :title (if indent? "Indent" "Outdent")
   :system-icon (if indent? "arrow.right" "arrow.left")
   :icon (if indent? "arrow-right-to-arc" "arrow-left-to-arc")
   :handler (fn []
              (blur-if-compositing)
              (editor-handler/indent-outdent indent?))})

(defn- todo-action
  []
  {:id "todo"
   :title "Todo"
   :system-icon "checkmark.square"
   :icon "checkbox"
   :event? true
   :handler (fn []
              (blur-if-compositing)
              (editor-handler/cycle-todo!))})

(defn- tag-action
  []
  {:id "tag"
   :title "Tag"
   :system-icon "number"
   :icon "hash"
   :event? true
   :handler #(insert-text "#" {})})

(defn- page-ref-action
  []
  {:id "page-ref"
   :title "Reference"
   ;; TODO: create sf symbol for brackets
   :system-icon "parentheses"
   :icon "brackets"
   :event? true
   :handler insert-page-ref!})

(defn- slash-action
  []
  {:id "slash"
   :title "Slash"
   :system-icon "command"
   :icon "command"
   :event? true
   :handler #(insert-text "/" {})})

(defn- camera-action
  []
  {:id "camera"
   :title "Photo"
   :system-icon "camera"
   :icon "camera"
   :event? true
   :handler #(when-let [parent-id (state/get-edit-input-id)]
               (mobile-camera/embed-photo parent-id))})

(defn- audio-action
  []
  {:id "audio"
   :title "Audio"
   :system-icon "waveform"
   :icon (svg/audio-lines 20)
   :handler #(recorder/record!)})

(defn- keyboard-action
  []
  {:id "keyboard"
   :title "Hide"
   :system-icon "keyboard.chevron.compact.down"
   :icon "keyboard-show"
   :handler #(p/do!
              (editor-handler/save-current-block!)
              (state/clear-edit!)
              (mobile-init/keyboard-hide))})

(defn- toolbar-actions
  [quick-add?]
  (let [audio (audio-action)
        keyboard (keyboard-action)
        main-actions (cond-> [(todo-action)
                              (indent-outdent-action false)
                              (indent-outdent-action true)
                              (tag-action)
                              (camera-action)
                              (page-ref-action)
                              (slash-action)]
                       (not quick-add?) (conj audio))]
    {:main main-actions
     :trailing (if quick-add? audio keyboard)}))

(defn- action->native
  [{:keys [id title system-icon]}]
  {:id id
   :title (or title id)
   :systemIcon system-icon})

(defn- action-handlers
  [main trailing]
  (into {} (map (juxt :id :handler) (concat main (when trailing [trailing])))))

(rum/defc native-toolbar
  [show? {:keys [main trailing]}]
  (let [handlers-ref (hooks/use-ref nil)
        native-actions (mapv action->native main)
        trailing-native (some-> trailing action->native)
        plugin ^js mobile-util/native-editor-toolbar
        should-show? (and show? (mobile-util/native-ios?) (some? plugin))]
    (set! (.-current handlers-ref) (action-handlers main trailing))

    (hooks/use-effect!
     (fn []
       (when (and (mobile-util/native-ios?) plugin)
         (let [listener (.addListener plugin "action"
                                      (fn [^js e]
                                        (when-let [id (.-id e)]
                                          (when-let [handler (get (.-current handlers-ref) id)]
                                            (haptics/haptics)
                                            (handler)))))]
           (fn []
             (cond
               (and listener (.-remove listener)) ((.-remove listener))
               listener (.then listener (fn [^js handle] (.remove handle))))))))
     [])

    (hooks/use-effect!
     (fn []
       (when (mobile-util/native-ios?)
         (if should-show?
           (.present plugin (clj->js {:actions native-actions
                                      :trailingAction trailing-native
                                      :tintColor (colors/get-accent-color)}))
           (.dismiss plugin)))
       #(when (mobile-util/native-ios?)
          (.dismiss plugin)))
     [should-show? native-actions trailing-native])

    [:<>]))

(rum/defc mobile-bar < rum/reactive
  []
  (let [editing? (state/sub :editor/editing?)
        code-block? (state/sub :editor/code-block-context)
        quick-add? (mobile-state/quick-add-open?)
        keep-open? (= "app-keep-keyboard-open-input"
                      (some-> js/document.activeElement (.-id)))
        show? (and (util/mobile?)
                   (not code-block?)
                   (or editing? keep-open?))
        actions (toolbar-actions quick-add?)]
    (when (mobile-util/native-ios?)
      (native-toolbar show? actions))))
