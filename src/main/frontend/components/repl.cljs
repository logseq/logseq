(ns frontend.components.repl
  "Notebook-style ClojureScript REPL UI.
  Renders in both the right sidebar (compact) and a dedicated /repl route."
  (:require [clojure.string :as string]
            [frontend.extensions.repl :as repl]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [rum.core :as rum]))

;; Helpers
;; =======

(defn- get-cm-theme
  "Returns the CodeMirror theme string matching the current Logseq theme."
  []
  (if (state/sub :ui/radix-color)
    (str "lsradix " (state/sub :ui/theme))
    (str "solarized " (state/sub :ui/theme))))

;; Result rendering
;; ================

(rum/defc repl-result
  "Renders a cell result — hiccup if tagged, otherwise pre-formatted text."
  [result error?]
  (when (some? result)
    (if error?
      [:pre.code.text-red-500.mt-1.mb-0.p-2.text-sm {:style {:white-space "pre-wrap"}}
       (str result)]
      (if (and (vector? result) (:hiccup (meta result)))
        [:div.mt-1.mb-0.p-2 result]
        [:pre.code.mt-1.mb-0.p-2.text-sm {:style {:white-space "pre-wrap"}}
         (str result)]))))

;; Autocomplete
;; ============

(defn- repl-hint
  "CodeMirror hint function that completes from the SCI context's bindings."
  [cm _options]
  (let [cur (.getCursor cm)
        token (.getTokenAt cm cur)
        token-string (.-string token)
        start (.-start token)
        end (.-end token)
        all-syms (or (repl/completions) [])
        matches (if (string/blank? token-string)
                  []
                  (filterv #(string/starts-with? % token-string) all-syms))]
    (when (seq matches)
      (clj->js {:list matches
                :from (.Pos js/window.CodeMirror (.-line cur) start)
                :to (.Pos js/window.CodeMirror (.-line cur) end)}))))

;; Cell
;; ====

(rum/defcs repl-cell < rum/reactive
  {:did-mount
   (fn [state]
     (let [[cell _] (:rum/args state)
           node (rum/dom-node state)
           textarea (.querySelector node "textarea")
           theme (get-cm-theme)
           cm (js/window.CodeMirror.fromTextArea
               textarea
               (clj->js {:mode "clojure"
                         :theme theme
                         :matchBrackets true
                         :autoCloseBrackets true
                         :smartIndent true
                         :lineNumbers false
                         :viewportMargin js/Infinity
                         :hintOptions {:hint repl-hint
                                       :completeSingle false}
                         :extraKeys {"Shift-Enter"
                                     (fn [editor]
                                       (repl/update-cell-code! (:id cell) (.getValue editor))
                                       (repl/run-cell! (:id cell)))
                                     "Ctrl-Space" "autocomplete"}}))]
       (.setValue cm (:code cell))
       (.on cm "blur" (fn [editor _]
                        (repl/update-cell-code! (:id cell) (.getValue editor))))
       (assoc state ::cm cm)))
   :will-unmount
   (fn [state]
     (when-let [cm (::cm state)]
       (.toTextArea cm))
     state)}
  [state cell on-remove]
  (let [cells (rum/react repl/*repl-cells)
        cell' (some #(when (= (:id %) (:id cell)) %) cells)]
    [:div.repl-cell.mb-2.rounded-md.border {:style {:border-color "var(--ls-border-color)"}}
     [:div.repl-cell-input.p-1
      [:textarea {:default-value (:code cell)}]]
     (when cell'
       (repl-result (:result cell') (:error? cell')))
     [:div.flex.justify-end.p-1
      [:button.text-xs.opacity-50.hover:opacity-100.px-2
       {:on-click (fn [_] (on-remove (:id cell)))}
       (ui/icon "trash" {:size 14})]]]))

;; Notebook (shared core)
;; ======================

(rum/defc repl-notebook < rum/reactive
  "Toolbar + ordered list of cells. Used by both sidebar and page views."
  []
  (let [cells (rum/react repl/*repl-cells)]
    ;; Ensure at least one cell exists
    (when (empty? cells)
      (repl/add-cell!))
    [:div.repl-notebook.flex.flex-col.gap-2.p-2
     ;; Toolbar
     [:div.flex.gap-2.items-center.mb-2
      [:button.button.text-sm {:on-click (fn [_] (repl/run-all-cells!))}
       "Run All"]
      [:button.button.text-sm {:on-click (fn [_] (repl/clear-all!))}
       "Clear"]
      [:button.button.text-sm {:on-click (fn [_] (repl/add-cell!))}
       "Add Cell"]]
     ;; Cells
     (for [cell cells]
       (rum/with-key
         (repl-cell cell repl/remove-cell!)
         (:id cell)))]))

;; Wrappers
;; ========

(rum/defc repl-sidebar
  "Compact wrapper for the right sidebar panel."
  []
  [:div.repl-sidebar.p-1
   (repl-notebook)])

(defn repl-page
  "Full-page wrapper for the /repl route."
  [_route-match]
  [:div.repl-page.mx-auto.p-4 {:style {:max-width "960px"}}
   [:h1.text-2xl.font-bold.mb-4 "ClojureScript REPL"]
   (repl-notebook)])
