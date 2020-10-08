(ns frontend.extensions.code
  (:require [rum.core :as rum]
            [frontend.config :as config]
            [frontend.util :as util]
            [frontend.mixins :as mixins]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.file :as file-handler]
            [clojure.string :as string]
            ["codemirror" :as cm]
            ["codemirror/addon/edit/matchbrackets"]
            ["codemirror/addon/edit/closebrackets"]
            ["codemirror/mode/clojure/clojure"]
            ["codemirror/mode/javascript/javascript"]
            ["codemirror/mode/commonlisp/commonlisp"]
            ["codemirror/mode/coffeescript/coffeescript"]
            ["codemirror/mode/css/css"]
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
            ["codemirror/mode/xml/xml"]
            ["parinfer-codemirror" :as par-cm]))

;; codemirror

(def from-text-area (gobj/get cm "fromTextArea"))

(defn render!
  [state]
  (let [[config id attr] (:rum/args state)
        mode (get attr :data-lang "javascript")
        clojure? (contains? #{"clojure" "clj"} mode)
        mode (if clojure? "clojure" mode)
        lisp? (contains? #{"clojure" "scheme" "racket" "lisp"} mode)
        textarea (gdom/getElement id)
        editor (from-text-area textarea
                               #js {:mode mode
                                    :matchBrackets lisp?
                                    :autoCloseBrackets true
                                    :lineNumbers true})
        element (.getWrapperElement editor)]
    (.on editor "blur" (fn []
                         (.save editor)
                         (let [value (gobj/get textarea "value")
                               default-value (gobj/get textarea "defaultValue")]
                           (cond
                             (:block/uuid config)
                             (let [block (db/pull [:block/uuid (:block/uuid config)])
                                   content (:block/content block)
                                   ;; FIXME: what if there're multiple same code blocks in the same block
                                   ;; and we're editing the second code block instead of the first one?
                                   content' (string/replace-first content default-value value)]
                               (editor-handler/save-block-if-changed! block content'))

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
    (.addEventListener element "click"
                       (fn [e]
                         (util/stop e)))
    (.save editor)
    (.refresh editor)
    (when clojure?
      (par-cm/init editor))))

(defn- load-and-render!
  [state]
  (render! state)
  state)

(rum/defcs editor < rum/reactive
  {:did-mount load-and-render!}
  [state config id attr code]
  [:div.relative.fixed-width
   [:div.absolute.top-0.right-0.p-1.text-sm.text-gray-500
    {:style {:z-index 1000
             :background "white"}}
    (get attr :data-lang "javascript")]
   [:textarea (merge {:id id
                      :default-value code} attr)]])
