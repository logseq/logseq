(ns frontend.extensions.code.editor
  (:require [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.extensions.calc :as calc]
            [frontend.extensions.code :as code-editor]
            [frontend.handler.code :as code-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.plugin :refer [hook-extensions-enhancers-by-key]]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- extra-codemirror-options []
  (get (state/get-config)
       :editor/extra-codemirror-options {}))

(defn- save-editor!
  [config]
  (p/do!
   (code-handler/save-code-editor!)
   (when-let [block (or (:code-block config) (:block config))]
     (let [block (db/entity [:block/uuid (:block/uuid block)])]
       (state/set-state! :editor/raw-mode-block block)
       (editor-handler/edit-block! block :max {:save-code-editor? false})))))

(defn- update-cursor-state!
  [context *cursor-prev *cursor-curr]
  (let [range (code-editor/selection-range context)]
    (if (not @*cursor-prev)
      (vreset! *cursor-prev range)
      (vreset! *cursor-prev @*cursor-curr))
    (vreset! *cursor-curr range)))

(defn- cursor-at-start?
  [range]
  (and (zero? (:line (:start range)))
       (zero? (:ch (:start range)))))

(defn- cursor-at-end?
  [context range]
  (let [{:keys [line ch]} (:end range)]
    (and (= line (code-editor/last-line context))
         (= ch (count (code-editor/line-text context line))))))

(defn- boundary?
  [context range direction]
  (case direction
    :left (cursor-at-start? range)
    :up (cursor-at-start? range)
    :right (cursor-at-end? context range)
    :down (cursor-at-end? context range)
    false))

(defn- install-event-handlers!
  [context config state edit-block code-block *update-cursor!]
  (let [^js view (:view context)
        ^js editor-dom (.-dom view)
        ^js editor-root (or (.closest editor-dom ".ui-fenced-code-editor")
                            editor-dom)
        ^js owner-document (.-ownerDocument editor-dom)
        *esc-pressed? (volatile! false)
        *cursor-prev (volatile! nil)
        *cursor-curr (volatile! nil)
        update-cursor! #(update-cursor-state! context *cursor-prev *cursor-curr)
        current-context? #(identical? context (:editor (:editor/code-block-context @state/state)))
        leave-editor! (fn [esc?]
                        (when (current-context?)
                          (when (or (= :file (state/get-current-route))
                                    (not esc?))
                            (code-handler/save-code-editor!))
                          (state/set-block-component-editing-mode! false)
                          (state/set-state! :editor/code-block-context nil)
                          (when (and (not esc?)
                                     (= (:db/id (state/get-edit-block))
                                        (:db/id edit-block)))
                            (state/clear-edit!))
                          (some-> (.-contentDOM view) .blur)
                          (vreset! *cursor-curr nil)
                          (vreset! *cursor-prev nil)
                          (vreset! *esc-pressed? false)))]
    (reset! *update-cursor! update-cursor!)
    (.addEventListener editor-dom "focusin"
                       (fn [_e]
                         (when (and
                                (:block/uuid (state/get-edit-block))
                                (contains? #{:code} (:logseq.property.node/display-type code-block))
                                (not= (:block/uuid edit-block) (:block/uuid (state/get-edit-block))))
                           (editor-handler/edit-block! (or code-block edit-block) :max {:container-id (:container-id config)}))
                         (state/set-block-component-editing-mode! true)
                         (state/set-state! :editor/code-block-context
                                           {:editor context
                                            :config config
                                            :state state})
                         (update-cursor!)))
    (.addEventListener editor-dom "focusout"
                       (fn [e]
                         (let [related-target (some-> e .-relatedTarget)]
                           (when-not (and related-target
                                          (.contains editor-root related-target))
                             (leave-editor! @*esc-pressed?)))))
    (.addEventListener editor-dom "keydown"
                       (fn [e]
                         (let [key-code (.-code e)
                               meta-or-ctrl-pressed? (or (.-ctrlKey e) (.-metaKey e))
                               shifted? (.-shiftKey e)]
                           (cond
                             (= "Escape" key-code)
                             (do
                               (vreset! *esc-pressed? true)
                               (save-editor! config))

                             (contains? #{"ArrowLeft" "ArrowRight"} key-code)
                             (let [direction (if (= "ArrowLeft" key-code) :left :right)]
                               (when (and (= @*cursor-prev @*cursor-curr)
                                          (or (nil? @*cursor-curr)
                                              (boundary? context @*cursor-curr direction)))
                                 (editor-handler/move-to-block-when-cross-boundary direction {}))
                               (update-cursor!))

                             (contains? #{"ArrowUp" "ArrowDown"} key-code)
                             (let [direction (if (= "ArrowUp" key-code) :up :down)]
                               (when (and (= @*cursor-prev @*cursor-curr)
                                          (or (nil? @*cursor-curr)
                                              (boundary? context @*cursor-curr direction)))
                                 (editor-handler/move-cross-boundary-up-down
                                  direction {:pos [direction 0]}))
                               (update-cursor!))

                             meta-or-ctrl-pressed?
                             (case key-code
                               "BracketLeft" (util/stop e)
                               "BracketRight" (util/stop e)
                               nil)

                             shifted?
                             (case key-code
                               "Enter"
                               (do
                                 (util/stop e)
                                 (when-let [blockid (some-> (.-target e) (.closest "[blockid]") (.getAttribute "blockid"))]
                                   (code-handler/save-code-editor!)
                                   (util/schedule #(editor-handler/api-insert-new-block! ""
                                                                                         {:block-uuid (uuid blockid)
                                                                                          :sibling? true}))))
                               nil)))))
    (.addEventListener editor-dom "pointerdown"
                       (fn [e]
                         (.stopPropagation e)
                         (state/clear-selection!)))
    (.addEventListener editor-dom "touchstart"
                       (fn [e]
                         (.stopPropagation e)))
    (let [on-document-pointerdown (fn [e]
                                    (let [target (.-target e)]
                                      (when-not (and target
                                                     (.contains editor-root target))
                                        (leave-editor! @*esc-pressed?))))]
      (.addEventListener owner-document "pointerdown" on-document-pointerdown true)
      (swap! (:*state context) update :dispose-fns conj
             #(.removeEventListener owner-document "pointerdown" on-document-pointerdown true)))
    context))

(defn render!
  [state]
  (let [[config id attr code _theme _user-options] (:rum/args state)
        edit-block (:block config)
        code-block (:code-block config)
        original-mode (get attr :data-lang)
        parent (gdom/getElement id)
        *editor-ref (get attr :editor-ref)
        *update-cursor! (atom nil)
        context (when parent
                  (code-editor/create-context!
                   {:parent parent
                    :initial-doc (or code "")
                    :editor-id id
                    :language-name (or original-mode "plain-text")
                    :editable? (not config/publishing?)
                    :block-uuid (:block/uuid (or code-block edit-block))
                    :user-options (extra-codemirror-options)
                    :on-change (fn [new-code]
                                 (when (= original-mode "calc")
                                   (reset! (:calc-atom state) (calc/eval-lines new-code))))
                    :on-selection-change #(when-let [f @*update-cursor!] (f))}))]
    (when context
      (when *editor-ref
        (reset! *editor-ref context))
      (install-event-handlers! context config state edit-block code-block *update-cursor!)
      (when-let [legacy-enhancers (seq (hook-extensions-enhancers-by-key :codemirror))]
        (code-editor/apply-enhancers! context (map #(assoc % :type :codemirror) legacy-enhancers)))
      (when-let [enhancers (seq (hook-extensions-enhancers-by-key :codemirror-6))]
        (code-editor/apply-enhancers! context enhancers))
      context)))

(defn- load-and-render!
  [state]
  (let [editor-atom (:editor-atom state)]
    (when-not @editor-atom
      (let [editor (render! state)]
        (reset! editor-atom editor)))))

(defn get-theme! []
  (if (state/sub :ui/radix-color)
    (str "lsradix " (state/sub :ui/theme))
    (str "solarized " (state/sub :ui/theme))))

(rum/defcs editor < rum/reactive
  {:init (fn [state]
           (let [[_ _ _ code _ options] (:rum/args state)]
             (assoc state
                    :editor-atom (atom nil)
                    :calc-atom (atom (calc/eval-lines code))
                    :code-options (atom options)
                    :last-theme (atom (get-theme!)))))
   :did-mount (fn [state]
                (load-and-render! state)
                state)
   :did-update (fn [state]
                 (reset! (:code-options state) (last (:rum/args state)))
                 state)
   :will-unmount (fn [state]
                   (when-let [context (some-> state :editor-atom deref)]
                     (code-editor/destroy! context))
                   state)}
  [state _config id attr _code _theme _options]
  [:div.extensions__code
   (cond-> {}
     (= (:data-lang attr) "calc")
     (assoc :data-lang "calc"))
   (when-let [mode (:data-lang attr)]
     (when-not (= mode "calc")
       [:div.extensions__code-lang
        (string/lower-case mode)]))
    [:div.code-editor
     [:div (merge {:id id
                  :class "logseq-code-editor"
                  :data-logseq-code-editor-root "true"}
                 (select-keys (or attr {}) [:data-lang]))]
    (when (= (:data-lang attr) "calc")
      (calc/results (:calc-atom state)))]])

;; Focus into the CodeMirror editor rather than the normal "raw" editor.
(defmethod commands/handle-step :codemirror/focus [[_]]
  (let [block (state/get-edit-block)
        block-uuid (:block/uuid block)]
    (p/do!
     (state/pub-event! [:editor/save-current-block])
     (state/clear-edit!)
     (js/setTimeout
      (fn []
        (let [block-node (util/get-first-block-by-id block-uuid)]
          (when-let [context (util/get-code-editor-context block-node)]
            (code-editor/focus! context))))
      256))))
