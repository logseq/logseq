(ns frontend.extensions.code
  (:require [clojure.string :as string]
            ["codemirror" :as cm]
            ["codemirror/addon/edit/closebrackets"]
            ["codemirror/addon/edit/matchbrackets"]
            ["codemirror/addon/selection/active-line"]
            ["codemirror/mode/apl/apl"]
            ["codemirror/mode/asciiarmor/asciiarmor"]
            ["codemirror/mode/asn.1/asn.1"]
            ["codemirror/mode/asterisk/asterisk"]
            ["codemirror/mode/brainfuck/brainfuck"]
            ["codemirror/mode/clike/clike"]
            ["codemirror/mode/clojure/clojure"]
            ["codemirror/mode/cmake/cmake"]
            ["codemirror/mode/cobol/cobol"]
            ["codemirror/mode/coffeescript/coffeescript"]
            ["codemirror/mode/commonlisp/commonlisp"]
            ["codemirror/mode/crystal/crystal"]
            ["codemirror/mode/css/css"]
            ["codemirror/mode/cypher/cypher"]
            ["codemirror/mode/d/d"]
            ["codemirror/mode/dart/dart"]
            ["codemirror/mode/diff/diff"]
            ["codemirror/mode/django/django"]
            ["codemirror/mode/dockerfile/dockerfile"]
            ["codemirror/mode/dtd/dtd"]
            ["codemirror/mode/dylan/dylan"]
            ["codemirror/mode/ebnf/ebnf"]
            ["codemirror/mode/ecl/ecl"]
            ["codemirror/mode/eiffel/eiffel"]
            ["codemirror/mode/elm/elm"]
            ["codemirror/mode/erlang/erlang"]
            ["codemirror/mode/factor/factor"]
            ["codemirror/mode/fcl/fcl"]
            ["codemirror/mode/forth/forth"]
            ["codemirror/mode/fortran/fortran"]
            ["codemirror/mode/gas/gas"]
            ["codemirror/mode/gfm/gfm"]
            ["codemirror/mode/gherkin/gherkin"]
            ["codemirror/mode/go/go"]
            ["codemirror/mode/groovy/groovy"]
            ["codemirror/mode/haml/haml"]
            ["codemirror/mode/handlebars/handlebars"]
            ["codemirror/mode/haskell-literate/haskell-literate"]
            ["codemirror/mode/haskell/haskell"]
            ["codemirror/mode/haxe/haxe"]
            ["codemirror/mode/htmlembedded/htmlembedded"]
            ["codemirror/mode/htmlmixed/htmlmixed"]
            ["codemirror/mode/http/http"]
            ["codemirror/mode/idl/idl"]
            ["codemirror/mode/javascript/javascript"]
            ["codemirror/mode/jinja2/jinja2"]
            ["codemirror/mode/jsx/jsx"]
            ["codemirror/mode/julia/julia"]
            ["codemirror/mode/livescript/livescript"]
            ["codemirror/mode/lua/lua"]
            ["codemirror/mode/markdown/markdown"]
            ["codemirror/mode/mathematica/mathematica"]
            ["codemirror/mode/mbox/mbox"]
            ["codemirror/mode/meta"]
            ["codemirror/mode/mirc/mirc"]
            ["codemirror/mode/mllike/mllike"]
            ["codemirror/mode/modelica/modelica"]
            ["codemirror/mode/mscgen/mscgen"]
            ["codemirror/mode/mumps/mumps"]
            ["codemirror/mode/nginx/nginx"]
            ["codemirror/mode/nsis/nsis"]
            ["codemirror/mode/ntriples/ntriples"]
            ["codemirror/mode/octave/octave"]
            ["codemirror/mode/oz/oz"]
            ["codemirror/mode/pascal/pascal"]
            ["codemirror/mode/pegjs/pegjs"]
            ["codemirror/mode/perl/perl"]
            ["codemirror/mode/php/php"]
            ["codemirror/mode/pig/pig"]
            ["codemirror/mode/powershell/powershell"]
            ["codemirror/mode/properties/properties"]
            ["codemirror/mode/protobuf/protobuf"]
            ["codemirror/mode/pug/pug"]
            ["codemirror/mode/puppet/puppet"]
            ["codemirror/mode/python/python"]
            ["codemirror/mode/q/q"]
            ["codemirror/mode/r/r"]
            ["codemirror/mode/rpm/rpm"]
            ["codemirror/mode/rst/rst"]
            ["codemirror/mode/ruby/ruby"]
            ["codemirror/mode/rust/rust"]
            ["codemirror/mode/sas/sas"]
            ["codemirror/mode/sass/sass"]
            ["codemirror/mode/scheme/scheme"]
            ["codemirror/mode/shell/shell"]
            ["codemirror/mode/sieve/sieve"]
            ["codemirror/mode/slim/slim"]
            ["codemirror/mode/smalltalk/smalltalk"]
            ["codemirror/mode/smarty/smarty"]
            ["codemirror/mode/solr/solr"]
            ["codemirror/mode/soy/soy"]
            ["codemirror/mode/sparql/sparql"]
            ["codemirror/mode/spreadsheet/spreadsheet"]
            ["codemirror/mode/sql/sql"]
            ["codemirror/mode/stex/stex"]
            ["codemirror/mode/stylus/stylus"]
            ["codemirror/mode/swift/swift"]
            ["codemirror/mode/tcl/tcl"]
            ["codemirror/mode/textile/textile"]
            ["codemirror/mode/tiddlywiki/tiddlywiki"]
            ["codemirror/mode/tiki/tiki"]
            ["codemirror/mode/toml/toml"]
            ["codemirror/mode/tornado/tornado"]
            ["codemirror/mode/troff/troff"]
            ["codemirror/mode/ttcn-cfg/ttcn-cfg"]
            ["codemirror/mode/ttcn/ttcn"]
            ["codemirror/mode/turtle/turtle"]
            ["codemirror/mode/twig/twig"]
            ["codemirror/mode/vb/vb"]
            ["codemirror/mode/vbscript/vbscript"]
            ["codemirror/mode/velocity/velocity"]
            ["codemirror/mode/verilog/verilog"]
            ["codemirror/mode/vhdl/vhdl"]
            ["codemirror/mode/vue/vue"]
            ["codemirror/mode/wast/wast"]
            ["codemirror/mode/webidl/webidl"]
            ["codemirror/mode/xml/xml"]
            ["codemirror/mode/xquery/xquery"]
            ["codemirror/mode/yacas/yacas"]
            ["codemirror/mode/yaml-frontmatter/yaml-frontmatter"]
            ["codemirror/mode/yaml/yaml"]
            ["codemirror/mode/z80/z80"]
            [dommy.core :as dom]
            [frontend.commands :as commands]
            [frontend.db :as db]
            [frontend.extensions.calc :as calc]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.file :as file-handler]
            [frontend.state :as state]
            [frontend.utf8 :as utf8]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [rum.core :as rum]))

;; codemirror

(def from-textarea (gobj/get cm "fromTextArea"))

(def textarea-ref-name "textarea")
(def codemirror-ref-name "codemirror-instance")


(defn- save-file-or-block-when-blur-or-esc!
  [editor textarea config state]
  (.save editor)
  (let [value (gobj/get textarea "value")
        default-value (gobj/get textarea "defaultValue")]
    (when (not= value default-value)
      (cond
        (:block/uuid config)
        (let [block (db/pull [:block/uuid (:block/uuid config)])
              content (:block/content block)
              {:keys [start_pos end_pos]} (:pos_meta (last (:rum/args state)))
              offset (if (:block/pre-block? block) 0 2)
              raw-content (utf8/encode content) ;; NOTE: :pos_meta is based on byte position
              prefix (utf8/decode (.slice raw-content 0 (- start_pos offset)))
              surfix (utf8/decode (.slice raw-content (- end_pos offset)))
              new-content (if (string/blank? value)
                            (str prefix surfix)
                            (str prefix value "\n" surfix))]
          (editor-handler/save-block-if-changed! block new-content))

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
        dark? (state/dark?)
        [config id attr code theme] (:rum/args state)
        default-open? (and (:editor/code-mode? @state/state)
                           (= (:block/uuid (state/get-edit-block))
                              (get-in config [:block :block/uuid])))
        _ (state/set-state! :editor/code-mode? false)
        original-mode (get attr :data-lang)
        clojure? (contains? #{"clojure" "clj" "text/x-clojure" "cljs" "cljc"} original-mode)
        mode (if clojure? "clojure" (text->cm-mode original-mode))
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
                                                             (reset! esc-pressed? true)
                                                             (save-file-or-block-when-blur-or-esc! cm textarea config state)
                                                             (when-let [block-id (:block/uuid config)]
                                                               (let [block (db/pull [:block/uuid block-id])]
                                                                 (editor-handler/edit-block! block :max block-id)))
                                                             ;; TODO: return "handled" or false doesn't always prevent event bubbles
                                                             (js/setTimeout #(reset! esc-pressed? false) 10))}}))]
    (when editor
      (let [textarea-ref (rum/ref-node state textarea-ref-name)]
        (gobj/set textarea-ref codemirror-ref-name editor))
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
                             (when-let [block (and (:block/uuid config) (into {} (db/get-block-by-uuid (:block/uuid config))))]
                               (state/set-editing! id (.getValue editor) block nil false))
                             (util/stop e)
                             (state/set-block-component-editing-mode! true)))
        (.save editor)
        (.refresh editor)))
    (when default-open?
      (.focus editor))
    editor))

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
                      ;; Expose the textarea associated with the CodeMirror instance via
                      ;; ref so that we can autofocus into the CodeMirror instance later.
                      :ref textarea-ref-name
                      :default-value code} attr)]
   (when (= (:data-lang attr) "calc")
     (calc/results (:calc-atom state)))])

;; Focus into the CodeMirror editor rather than the normal "raw" editor
(defmethod commands/handle-step :codemirror/focus [[_]]
  ;; This requestAnimationFrame is necessary because, for some reason, when you
  ;; type /calculate and then click the "Calculate" command in the dropdown
  ;; *with your mouse* (but not when you do so via your keyboard with the
  ;; arrow + enter keys!), React doesn't re-render before the :codemirror/focus
  ;; command kicks off. As a result, you get an error saying that the node
  ;; you're trying to focus doesn't yet exist. Adding the requestAnimationFrame
  ;; ensures that the React component re-renders before the :codemirror/focus
  ;; command is run. It's not elegant... open to suggestions for how to fix it!
  (js/window.requestAnimationFrame
   (fn []
     (let [block (state/get-edit-block)
           block-uuid (:block/uuid block)
           block-node (util/get-first-block-by-id block-uuid)]
       (editor-handler/select-block! (:block/uuid block))
       (let [textarea-ref (.querySelector block-node "textarea")]
         (.focus (gobj/get textarea-ref codemirror-ref-name)))
       (util/select-unhighlight! (dom/by-class "selected"))
       (state/clear-selection!)))))
