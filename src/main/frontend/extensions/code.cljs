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
            [frontend.commands :as commands]
            [frontend.db :as db]
            [frontend.extensions.calc :as calc]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.code :as code-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.config :as config]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [rum.core :as rum]))

;; codemirror

(def from-textarea (gobj/get cm "fromTextArea"))

(def textarea-ref-name "textarea")
(def codemirror-ref-name "codemirror-instance")

;; export CodeMirror to global scope
(set! js/window -CodeMirror cm)

(defn- extra-codemirror-options []
  (get (state/get-config)
       :editor/extra-codemirror-options {}))

(defn- text->cm-mode
  ([text]
   (text->cm-mode text :name))
  ([text by]
   (when text
     (let [mode (string/lower-case text)
           find-fn-name (case by
                          :name "findModeByName"
                          :ext "findModeByExtension"
                          :file-name "findModeByFileName"
                          "findModeByName")
           find-fn (gobj/get cm find-fn-name)
           cm-mode (find-fn mode)]
       (if cm-mode
         (.-mime cm-mode)
         mode)))))

(defn render!
  [state]
  (let [[config id attr _code theme user-options] (:rum/args state)
        default-open? (and (:editor/code-mode? @state/state)
                           (= (:block/uuid (state/get-edit-block))
                              (get-in config [:block :block/uuid])))
        _ (state/set-state! :editor/code-mode? false)
        original-mode (get attr :data-lang)
        mode (if (:file? config)
               (text->cm-mode original-mode :ext) ;; ref: src/main/frontend/components/file.cljs
               (text->cm-mode original-mode :name))
        lisp-like? (contains? #{"scheme" "lisp" "clojure" "edn"} mode)
        textarea (gdom/getElement id)
        default-cm-options {:theme (str "solarized " theme)
                            :autoCloseBrackets true
                            :lineNumbers true
                            :matchBrackets lisp-like?
                            :styleActiveLine true}
        cm-options (merge default-cm-options
                          (extra-codemirror-options)
                          {:mode mode
                           :tabIndex -1 ;; do not accept TAB-in, since TAB is bind globally
                           :extraKeys #js {"Esc" (fn [cm]
                                                   ;; Avoid reentrancy
                                                   (gobj/set cm "escPressed" true)
                                                   (code-handler/save-code-editor!)
                                                   (when-let [block-id (:block/uuid config)]
                                                     (let [block (db/pull [:block/uuid block-id])]
                                                       (editor-handler/edit-block! block :max block-id))))}}
                          (when config/publishing?
                            {:readOnly true
                             :cursorBlinkRate -1})
                          user-options)
        editor (when textarea
                 (from-textarea textarea (clj->js cm-options)))]
    (when editor
      (let [textarea-ref (rum/ref-node state textarea-ref-name)
            element (.getWrapperElement editor)]
        (gobj/set textarea-ref codemirror-ref-name editor)
        (when (= mode "calc")
          (.on editor "change" (fn [_cm _e]
                                 (let [new-code (.getValue editor)]
                                   (reset! (:calc-atom state) (calc/eval-lines new-code))))))
        (.on editor "blur" (fn [cm e]
                             (when e (util/stop e))
                             (when (or
                                    (= :file (state/get-current-route))
                                    (not (gobj/get cm "escPressed")))
                               (code-handler/save-code-editor!))
                             (state/set-block-component-editing-mode! false)
                             (state/set-state! :editor/code-block-context nil)))
        (.on editor "focus" (fn [_e]
                              (state/set-block-component-editing-mode! true)
                              (state/set-state! :editor/code-block-context
                                                {:editor editor
                                                 :config config
                                                 :state state})))

        (.addEventListener element "keydown" (fn [e]
                                               (let [key-code (.-code e)
                                                     meta-or-ctrl-pressed? (or (.-ctrlKey e) (.-metaKey e))]
                                                 (when meta-or-ctrl-pressed?
                                                   ;; prevent default behavior of browser
                                                   ;; Cmd + [ => Go back in browser, outdent in CodeMirror
                                                   ;; Cmd + ] => Go forward in browser, indent in CodeMirror
                                                   (case key-code
                                                     "BracketLeft" (util/stop e)
                                                     "BracketRight" (util/stop e)
                                                     nil)))))
        (.addEventListener element "mousedown"
                           (fn [e]
                             (util/stop e)
                             (state/clear-selection!)
                             (when-let [block (and (:block/uuid config) (into {} (db/get-block-by-uuid (:block/uuid config))))]
                               (state/set-editing! id (.getValue editor) block nil false))))
        (.addEventListener element "touchstart"
                           (fn [e]
                             (.stopPropagation e)))
        (.save editor)
        (.refresh editor)
        (when default-open?
          (.focus editor))))
    editor))

(defn- load-and-render!
  [state]
  (let [editor-atom (:editor-atom state)]
    (when-not @editor-atom
      (let [editor (render! state)]
        (reset! editor-atom editor)))))

(rum/defcs editor < rum/reactive
  {:init (fn [state]
           (let [[_ _ _ code _ options] (:rum/args state)]
             (assoc state
                    :editor-atom (atom nil)
                    :calc-atom (atom (calc/eval-lines code))
                    :code-options (atom options))))
   :did-mount (fn [state]
                (load-and-render! state)
                state)
   :did-update (fn [state]
                 (reset! (:code-options state) (last (:rum/args state)))
                 (when-not (:file? (first (:rum/args state)))
                   (let [code (nth (:rum/args state) 3)
                         editor @(:editor-atom state)]
                     (when (not= (.getValue editor) code)
                       (.setValue editor code))))
                 state)}
  [state _config id attr code _theme _options]
  [:div.extensions__code
   (when-let [mode (:data-lang attr)]
     (when-not (= mode "calc")
       [:div.extensions__code-lang
        (string/lower-case mode)]))
   [:div.code-editor.flex.flex-1.flex-row.w-full
    [:textarea (merge {:id id
                       ;; Expose the textarea associated with the CodeMirror instance via
                       ;; ref so that we can autofocus into the CodeMirror instance later.
                       :ref textarea-ref-name
                       :default-value code} attr)]
    (when (= (:data-lang attr) "calc")
      (calc/results (:calc-atom state)))]])

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
  (let [block (state/get-edit-block)
        block-uuid (:block/uuid block)]
    (state/clear-edit!)
    (js/setTimeout
     (fn []
       (let [block-node (util/get-first-block-by-id block-uuid)
             textarea-ref (.querySelector block-node "textarea")]
         (when-let [codemirror-ref (gobj/get textarea-ref codemirror-ref-name)]
           (.focus codemirror-ref))))
     100)))
