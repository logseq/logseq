(ns frontend.extensions.code
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [medley.core :as medley]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.file :as file-handler]
            [clojure.string :as string]
            [frontend.utf8 :as utf8]
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
    ;; ["parinfer-codemirror" :as par-cm]
            [frontend.db.queries :as db-queries]
            [frontend.db.utils :as db-utils]))

;; codemirror

(def from-textarea (gobj/get cm "fromTextArea"))

(defn- save-file-or-block-when-blur-or-esc!
  [editor textarea config state]
  (.save editor)
  (let [value (gobj/get textarea "value")
        default-value (gobj/get textarea "defaultValue")]
    (cond
      (:block/uuid config)
      (let [block (db-utils/pull [:block/uuid (:block/uuid config)])
            format (:block/format block)
            ;; Get newest state
            pos-meta (:pos-meta state)
            {:keys [start_pos end_pos]} @pos-meta
            value (str "\n" (string/trimr value) "\n")
            content (:block/content block)
            content' (utf8/insert! content
                                   start_pos
                                   end_pos
                                   value)]
        (reset! pos-meta {:start_pos start_pos
                          :end_pos (+ start_pos
                                      (utf8/length (utf8/encode value)))})
        (editor-handler/save-block-if-changed! block content'))

      (:file-path config)
      (let [path (:file-path config)
            content (db-queries/get-file-no-sub path)
            value (some-> (gdom/getElement path)
                          (gobj/get "value"))]
        (when (and
               (not (string/blank? value))
               (not= (string/trim value) (string/trim content)))
          (file-handler/alter-file (state/get-current-repo) path (string/trim value)
                                   {:re-render-root? true})))

      :else
      nil)))

(defn render!
  [state]
  (let [[config id attr code pos_meta] (:rum/args state)
        original-mode (get attr :data-lang)
        mode (or original-mode "javascript")
        clojure? (contains? #{"clojure" "clj" "text/x-clojure" "cljs" "cljc"} mode)
        mode (if clojure? "clojure" mode)
        lisp? (or clojure?
                  (contains? #{"scheme" "racket" "lisp"} mode))
        textarea (gdom/getElement id)
        editor (from-textarea textarea
                              #js {:mode mode
                                   :matchBrackets lisp?
                                   :autoCloseBrackets true
                                   :lineNumbers true
                                   :extraKeys #js {"Esc" (fn [cm]
                                                           (let [save! #(save-file-or-block-when-blur-or-esc! cm textarea config state)]
                                                             (if-let [block-id (:block/uuid config)]
                                                               (let [block (db-utils/pull [:block/uuid block-id])
                                                                     value (.getValue cm)
                                                                     textarea-value (gobj/get textarea "value")
                                                                     changed? (not= value textarea-value)]
                                                                 (if changed?
                                                                   (save!)
                                                                   (editor-handler/edit-block! block :max (:block/format block) block-id)))
                                                               (save!))))}})]
    (let [element (.getWrapperElement editor)]
      (.on editor "blur" (fn []
                           (save-file-or-block-when-blur-or-esc! editor textarea config state)))
      (.addEventListener element "click"
                         (fn [e]
                           (util/stop e)))
      (.save editor)
      (.refresh editor))
    editor))

(defn- load-and-render!
  [state]
  (let [editor-atom (:editor-atom state)]
    (js/setTimeout (fn []
                     (let [editor (render! state)]
                       (reset! editor-atom editor))) 10)))

(rum/defcs editor < rum/reactive
  {:init (fn [state]
           (assoc state
                  :pos-meta (atom (last (:rum/args state)))
                  :editor-atom (atom nil)))
   :did-mount (fn [state]
                (load-and-render! state)
                state)
   :did-update (fn [state]
                 (when-let [editor-atom (:editor-atom state)]
                   (let [editor @editor-atom
                         code (nth (:rum/args state) 3)]
                     (when editor
                       (.setValue (.getDoc editor) code))))
                 (when-let [pos-meta (:pos-meta state)]
                   (reset! pos-meta (last (:rum/args state)))))}
  [state config id attr code pos_meta]
  [:div.extensions__code
   [:div.extensions__code-lang
    (let [mode (get attr :data-lang "javascript")]
      (if (= mode "text/x-clojure")
        "clojure"
        mode))]
   [:textarea (merge {:id id
                      :default-value code} attr)]])
