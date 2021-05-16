(ns frontend.extensions.code
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.file :as file-handler]
            [clojure.string :as string]
            [frontend.utf8 :as utf8]
            ["codemirror" :as cm]
            ["codemirror/addon/edit/matchbrackets"]
            ["codemirror/addon/edit/closebrackets"]
            ["codemirror/addon/selection/active-line"]
            ["codemirror/mode/clojure/clojure"]
            ["codemirror/mode/powershell/powershell"]
            ["codemirror/mode/javascript/javascript"]
            ["codemirror/mode/jsx/jsx"]
            ["codemirror/mode/clike/clike"]
            ["codemirror/mode/vue/vue"]
            ["codemirror/mode/commonlisp/commonlisp"]
            ["codemirror/mode/coffeescript/coffeescript"]
            ["codemirror/mode/css/css"]
            ["codemirror/mode/sass/sass"]
            ["codemirror/mode/dart/dart"]
            ["codemirror/mode/dockerfile/dockerfile"]
            ["codemirror/mode/elm/elm"]
            ["codemirror/mode/erlang/erlang"]
            ["codemirror/mode/go/go"]
            ["codemirror/mode/haskell/haskell"]
            ["codemirror/mode/lua/lua"]
            ["codemirror/mode/mathematica/mathematica"]
            ["codemirror/mode/perl/perl"]
            ["codemirror/mode/php/php"]
            ["codemirror/mode/python/python"]
            ["codemirror/mode/ruby/ruby"]
            ["codemirror/mode/rust/rust"]
            ["codemirror/mode/scheme/scheme"]
            ["codemirror/mode/shell/shell"]
            ["codemirror/mode/smalltalk/smalltalk"]
            ["codemirror/mode/sql/sql"]
            ["codemirror/mode/swift/swift"]
            ["codemirror/mode/xml/xml"]))

;; codemirror

(def from-textarea (gobj/get cm "fromTextArea"))

(defn- save-file-or-block-when-blur-or-esc!
  [editor textarea config state]
  (.save editor)
  (let [value (gobj/get textarea "value")
        default-value (gobj/get textarea "defaultValue")
        pos-meta (:pos-meta state)]
    (when (not= value default-value)
      (cond
       (:block/uuid config)
       (let [block (db/pull [:block/uuid (:block/uuid config)])
             format (:block/format block)
             content (:block/content block)
             {:keys [start_pos end_pos]} @pos-meta
             prev-content (utf8/substring (utf8/encode content)
                                          0 start_pos)
             value (str (if (not= "\n" (last prev-content))
                          "\n")
                        (string/trimr value)
                        "\n")
             content' (utf8/insert! content start_pos end_pos value)]
         (editor-handler/save-block-if-changed! block content')
         (let [new-pos-meta {:start_pos start_pos
                             :end_pos (+ start_pos
                                         (utf8/length (utf8/encode value)))}
               old-pos-meta @pos-meta]
           (reset! pos-meta new-pos-meta)))

       (:file-path config)
       (let [path (:file-path config)
             content (db/get-file-no-sub path)
             value (some-> (gdom/getElement path)
                           (gobj/get "value"))]
         (when (and
                (not (string/blank? value))
                (not= (string/trim value) (string/trim content)))
           (file-handler/alter-file (state/get-current-repo) path (string/trim value)
                                    {:re-render-root? true})))

       :else
       nil))))

(defn- text->cm-mode
  [text]
  (when text
    (let [mode (string/lower-case text)]
      (case mode
        "html" "text/html"
        "c" "text/x-csrc"
        "c++" "text/x-c++src"
        "java" "text/x-java"
        "c#" "text/x-csharp"
        "csharp" "text/x-csharp"
        "objective-c" "text/x-objectivec"
        "scala" "text/x-scala"
        "js" "text/javascript"
        "typescript" "text/typescript"
        "ts" "text/typescript"
        "tsx" "text/typescript-jsx"
        "scss" "text/x-scss"
        "less" "text/x-less"
        mode))))

(defn render!
  [state]
  (let [editor-atom (:editor-atom state)
        esc-pressed? (atom nil)]
    (if @editor-atom
      @editor-atom
      (let [[config id attr code] (:rum/args state)
            original-mode (get attr :data-lang)
            mode (or original-mode "javascript")
            clojure? (contains? #{"clojure" "clj" "text/x-clojure" "cljs" "cljc"} mode)
            mode (if clojure? "clojure" (text->cm-mode mode))
            lisp? (or clojure?
                      (contains? #{"scheme" "racket" "lisp"} mode))
            textarea (gdom/getElement id)
            editor (or
                    @(:editor-atom state)
                    (when textarea
                      (from-textarea textarea
                                     #js {:mode mode
                                          :matchBrackets lisp?
                                          :autoCloseBrackets true
                                          :lineNumbers true
                                          :styleActiveLine true
                                          :extraKeys #js {"Esc" (fn [cm]
                                                                  (let [save! #(save-file-or-block-when-blur-or-esc! cm textarea config state)]
                                                                    (if-let [block-id (:block/uuid config)]
                                                                      (let [block (db/pull [:block/uuid block-id])
                                                                            value (.getValue cm)
                                                                            textarea-value (gobj/get textarea "value")
                                                                            changed? (not= value textarea-value)]
                                                                        (if changed?
                                                                          (save!)
                                                                          (editor-handler/edit-block! block :max (:block/format block) block-id)))
                                                                      (save!)))
                                                                  ;; TODO: return "handled" or false doesn't always prevent event bubbles
                                                                  (reset! esc-pressed? true)
                                                                  (js/setTimeout #(reset! esc-pressed? false) 10))}})))]
        (when editor
          (let [element (.getWrapperElement editor)]
            (.on editor "blur" (fn [_cm e]
                                 (util/stop e)
                                 (when-not @esc-pressed?
                                   (save-file-or-block-when-blur-or-esc! editor textarea config state))))
            (.addEventListener element "click"
                               (fn [e]
                                 (util/stop e)))
            (.save editor)
            (.refresh editor)))
        editor))))

(defn- load-and-render!
  [state]
  (let [editor-atom (:editor-atom state)]
    (let [editor (render! state)]
      (reset! editor-atom editor))))

(rum/defcs editor < rum/reactive
  {:init (fn [state]
           (assoc state
                  :pos-meta (atom (last (:rum/args state)))
                  :editor-atom (atom nil)))
   :did-mount (fn [state]
                (load-and-render! state)
                state)
   :did-remount (fn [old_state state]
                  (load-and-render! state)
                  state)}
  [state config id attr code pos-meta]
  [:div.extensions__code
   {:on-mouse-down (fn [e]
                     (util/stop e)
                     (state/set-block-component-editing-mode! true))
    :on-blur #(state/set-block-component-editing-mode! false)}
   [:div.extensions__code-lang
    (let [mode (string/lower-case (get attr :data-lang "javascript"))]
      (if (= mode "text/x-clojure")
        "clojure"
        mode))]
   [:textarea (merge {:id id
                      :default-value code} attr)]])
