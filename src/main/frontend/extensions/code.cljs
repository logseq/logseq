(ns frontend.extensions.code
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.db :as db]
            [frontend.extensions.calc :as calc]
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
        default-value (gobj/get textarea "defaultValue")]
    (when (not= value default-value)
      (cond
        (:block/uuid config)
        (let [block (db/pull [:block/uuid (:block/uuid config)])
              format (:block/format block)
              content (:block/content block)
              full-content (:full_content (last (:rum/args state)))]
          (when (and full-content (string/includes? content full-content))
            (let [lines (string/split-lines full-content)
                  fl (first lines)
                  ll (last lines)]
              (when (and fl ll)
                (let [value' (str (string/trim fl) "\n" value "\n" (string/trim ll))
                      ;; FIXME: What if there're multiple code blocks with the same value?
                      content' (string/replace-first content full-content value')]
                  (editor-handler/save-block-if-changed! block content'))))))

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
  (let [esc-pressed? (atom nil)
        dark? (state/dark?)]
    (let [[config id attr code theme] (:rum/args state)
          original-mode (get attr :data-lang)
          mode original-mode
          clojure? (contains? #{"clojure" "clj" "text/x-clojure" "cljs" "cljc"} mode)
          mode (if clojure? "clojure" (text->cm-mode mode))
          lisp? (or clojure?
                    (contains? #{"scheme" "racket" "lisp"} mode))
          textarea (gdom/getElement id)
          editor (when textarea
                   (from-textarea textarea
                                  #js {:mode mode
                                       :theme (str "solarized " theme)
                                       :matchBrackets lisp?
                                       :autoCloseBrackets true
                                       :lineNumbers true
                                       :styleActiveLine true
                                       :extraKeys #js {"Esc" (fn [cm]
                                                               (save-file-or-block-when-blur-or-esc! cm textarea config state)
                                                               (when-let [block-id (:block/uuid config)]
                                                                 (let [block (db/pull [:block/uuid block-id])
                                                                       value (.getValue cm)
                                                                       textarea-value (gobj/get textarea "value")]
                                                                   (editor-handler/edit-block! block :max (:block/format block) block-id)))
                                                               ;; TODO: return "handled" or false doesn't always prevent event bubbles
                                                               (reset! esc-pressed? true)
                                                               (js/setTimeout #(reset! esc-pressed? false) 10))}}))]
      (when editor
        (let [element (.getWrapperElement editor)]
          (when (= mode "calc")
            (.on editor "change" (fn [_cm e]
                                   (let [new-code (.getValue editor)]
                                     (reset! (:calc-atom state) (calc/eval-lines new-code))))))
          (.on editor "blur" (fn [_cm e]
                               (when e (util/stop e))
                               (state/set-block-component-editing-mode! false)
                               (when-not @esc-pressed?
                                 (save-file-or-block-when-blur-or-esc! editor textarea config state))))
          (.addEventListener element "mousedown"
                             (fn [e]
                               (state/clear-selection!)
                               (util/stop e)
                               (state/set-block-component-editing-mode! true)))
          (.save editor)
          (.refresh editor)))
      editor)))

(defn- load-and-render!
  [state]
  (let [editor-atom (:editor-atom state)
        editor (render! state)]
    (reset! editor-atom editor)))

(rum/defcs editor < rum/reactive
  {:init (fn [state]
           (let [[_ _ _ code _] (:rum/args state)]
             (assoc state :editor-atom (atom nil) :calc-atom (atom (calc/eval-lines code)))))
   :did-mount (fn [state]
                (load-and-render! state)
                state)
   :did-update (fn [state]
                 (when-let [editor @(:editor-atom state)]
                   ;; clear the previous instance
                   (.toTextArea ^js editor))
                 (load-and-render! state)
                 state)}
  [state config id attr code theme options]
  [:div.extensions__code
   (when-let [mode (:data-lang attr)]
     (when-not (= mode "calc")
       [:div.extensions__code-lang
        (let [mode (string/lower-case mode)]
          (if (= mode "text/x-clojure")
            "clojure"
            mode))]))
   [:textarea (merge {:id id
                      :default-value code} attr)]
   (when (= (:data-lang attr) "calc")
     (calc/results (:calc-atom state)))])
