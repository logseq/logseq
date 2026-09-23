(ns frontend.extensions.code.editor
  "CodeMirror 6 code editor. Loaded lazily as the :code-editor shadow-cljs
   module; the component registers itself with frontend.components.lazy-editor
   and the heavy implementations register with frontend.extensions.code."
  (:require ["@codemirror/autocomplete" :refer [autocompletion closeBrackets closeBracketsKeymap completionKeymap]]
            ["@codemirror/commands" :refer [defaultKeymap history historyKeymap indentWithTab]]
            ["@codemirror/language" :refer [HighlightStyle syntaxHighlighting bracketMatching]]
            ["@codemirror/lint" :refer [lintKeymap]]
            ["@codemirror/search" :refer [highlightSelectionMatches searchKeymap]]
            ["@codemirror/state" :refer [Compartment EditorState StateEffect]]
            ["@codemirror/view" :refer [drawSelection dropCursor EditorView
                                        highlightSpecialChars keymap lineNumbers]]
            ["@lezer/highlight" :refer [tags]]
            [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.components.lazy-editor :as lazy-editor]
            [frontend.config :as config]
            [frontend.db.async :as db-async]
            [frontend.extensions.calc :as calc]
            [frontend.extensions.code :as code-editor]
            [frontend.extensions.code.api :as api]
            [frontend.extensions.code.language-registry :as language-registry]
            [frontend.extensions.code.language.clojure :as clojure-language]
            [frontend.extensions.code.languages :as cm-languages]
            [frontend.handler.code :as code-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.plugin :refer [hook-extensions-enhancers-by-key]]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn- assert-parent!
  [parent]
  (when-not parent
    (throw (ex-info "CodeMirror 6 parent element is required" {}))))

(defn- js-array->seq
  [value]
  (if value
    (array-seq value)
    []))

(defn- update-scroll-state!
  [^js view]
  (when-let [^js scroller (.querySelector (.-dom view) ".cm-scroller")]
    (let [^js editor-dom (.-dom view)
          ^js editor-host (or (.closest editor-dom ".logseq-code-editor")
                              editor-dom)
          has-vertical-scroll? (> (.-scrollHeight scroller) (inc (.-clientHeight scroller)))
          has-horizontal-scroll? (> (.-scrollWidth scroller) (inc (.-clientWidth scroller)))]
      (.toggle (.-classList editor-dom) "logseq-code-editor-has-vertical-scroll" has-vertical-scroll?)
      (.toggle (.-classList editor-dom) "logseq-code-editor-has-horizontal-scroll" has-horizontal-scroll?)
      (.toggle (.-classList editor-host) "logseq-code-editor-has-vertical-scroll" has-vertical-scroll?)
      (.toggle (.-classList editor-host) "logseq-code-editor-has-horizontal-scroll" has-horizontal-scroll?))))

(defn- update-calc-result-width!
  "Calc results render in a second grid column to the right of the editor.
   Publish its measured width as --logseq-code-calc-result-width on
   .ls-code-editor-wrap so the hover actions reserve that space instead of
   covering the results."
  [^js view]
  (when-let [^js wrap (.closest (.-dom view) ".ls-code-editor-wrap")]
    (let [^js result-el (.querySelector wrap ".extensions__code-calc")]
      (.setProperty (.-style wrap) "--logseq-code-calc-result-width"
                    (str (if result-el (.-offsetWidth result-el) 0) "px")))))

(defn- sync-layout-state!
  [^js view]
  (update-scroll-state! view)
  (update-calc-result-width! view))

(defn- schedule-scroll-state!
  [^js view]
  (js/requestAnimationFrame #(sync-layout-state! view)))

(defn- keymap-extension
  []
  (.of keymap
       (to-array
        (concat
         (js-array->seq defaultKeymap)
         (js-array->seq historyKeymap)
         (js-array->seq closeBracketsKeymap)
         (js-array->seq completionKeymap)
         (js-array->seq searchKeymap)
         (js-array->seq lintKeymap)
         [indentWithTab]))))

(def code-editor-theme
  (.theme EditorView
          (clj->js
           {"&" {"backgroundColor" "var(--ls-secondary-background-color)"
                 "color" "var(--ls-primary-text-color)"
                 "border" "0"
                 "borderRadius" "4px"
                 "boxShadow" "none"}
            ".cm-scroller" {"scrollbarGutter" "stable"
                            "overscrollBehavior" "contain"}
            ".cm-content" {"caretColor" "var(--ls-primary-text-color)"
                           "padding" "6px 0"
                           "minWidth" "max-content"}
            ".cm-content.cm-lineWrapping" {"minWidth" "0"}
            ".cm-line" {"padding" "0 var(--logseq-code-editor-line-padding-right, 8.5rem) 0 12px"}
            ".cm-gutters" {"backgroundColor" "var(--ls-secondary-background-color)"
                           "border" "0"
                           "borderRight" "1px solid var(--ls-border-color)"
                           "color" "var(--ls-tertiary-text-color)"}
            ".cm-activeLine" {"backgroundColor" "transparent"}
            ".cm-activeLineGutter" {"backgroundColor" "transparent"
                                    "color" "var(--ls-tertiary-text-color)"}
            ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection"
            {"backgroundColor" "var(--ls-selection-background-color, rgba(120, 160, 220, 0.28))"}
            ".cm-cursor" {"borderLeftColor" "var(--ls-primary-text-color)"}})))

(def ^:large-vars/data-var code-highlight-style
  (.define HighlightStyle
           #js [#js {:tag (.-keyword tags)
                     :color "var(--logseq-code-token-keyword)"}
                #js {:tag (.-controlKeyword tags)
                     :color "var(--logseq-code-token-control-keyword)"}
                #js {:tag (.-definitionKeyword tags)
                     :color "var(--logseq-code-token-definition-keyword)"}
                #js {:tag (.-moduleKeyword tags)
                     :color "var(--logseq-code-token-module-keyword)"}
                #js {:tag (.-operatorKeyword tags)
                     :color "var(--logseq-code-token-operator-keyword)"}
                #js {:tag (.-modifier tags)
                     :color "var(--logseq-code-token-modifier)"}
                #js {:tag (.-self tags)
                     :color "var(--logseq-code-token-self)"}
                #js {:tag (.-atom tags)
                     :color "var(--logseq-code-token-atom)"}
                #js {:tag (.-bool tags)
                     :color "var(--logseq-code-token-bool)"}
                #js {:tag (.-null tags)
                     :color "var(--logseq-code-token-null)"}
                #js {:tag (.-unit tags)
                     :color "var(--logseq-code-token-unit)"}
                #js {:tag (.-literal tags)
                     :color "var(--logseq-code-token-literal)"}
                #js {:tag (.-number tags)
                     :color "var(--logseq-code-token-number)"}
                #js {:tag (.-integer tags)
                     :color "var(--logseq-code-token-number)"}
                #js {:tag (.-float tags)
                     :color "var(--logseq-code-token-number)"}
                #js {:tag (.-string tags)
                     :color "var(--logseq-code-token-string)"}
                #js {:tag (.-docString tags)
                     :color "var(--logseq-code-token-doc-string)"}
                #js {:tag (.-character tags)
                     :color "var(--logseq-code-token-character)"}
                #js {:tag (.-attributeValue tags)
                     :color "var(--logseq-code-token-attribute-value)"}
                #js {:tag (.-regexp tags)
                     :color "var(--logseq-code-token-regexp)"}
                #js {:tag (.-escape tags)
                     :color "var(--logseq-code-token-escape)"}
                #js {:tag (.-color tags)
                     :color "var(--logseq-code-token-color)"}
                #js {:tag (.-url tags)
                     :color "var(--logseq-code-token-url)"
                     :textDecoration "underline"}
                #js {:tag (.-comment tags)
                     :color "var(--logseq-code-token-comment)"
                     :fontStyle "italic"}
                #js {:tag (.-lineComment tags)
                     :color "var(--logseq-code-token-comment)"
                     :fontStyle "italic"}
                #js {:tag (.-blockComment tags)
                     :color "var(--logseq-code-token-comment)"
                     :fontStyle "italic"}
                #js {:tag (.-docComment tags)
                     :color "var(--logseq-code-token-doc-comment)"
                     :fontStyle "italic"}
                #js {:tag (.-name tags)
                     :color "var(--logseq-code-token-name)"}
                #js {:tag (.-variableName tags)
                     :color "var(--logseq-code-token-variable)"}
                #js {:tag ((.-definition tags) (.-variableName tags))
                     :color "var(--logseq-code-token-definition)"}
                #js {:tag ((.-function tags) (.-variableName tags))
                     :color "var(--logseq-code-token-function)"}
                #js {:tag ((.-function tags) (.-propertyName tags))
                     :color "var(--logseq-code-token-function)"}
                #js {:tag ((.-constant tags) (.-variableName tags))
                     :color "var(--logseq-code-token-constant)"}
                #js {:tag ((.-standard tags) (.-name tags))
                     :color "var(--logseq-code-token-standard)"}
                #js {:tag ((.-standard tags) (.-variableName tags))
                     :color "var(--logseq-code-token-standard)"}
                #js {:tag ((.-local tags) (.-variableName tags))
                     :color "var(--logseq-code-token-local)"}
                #js {:tag ((.-special tags) (.-variableName tags))
                     :color "var(--logseq-code-token-special-variable)"}
                #js {:tag (.-propertyName tags)
                     :color "var(--logseq-code-token-property)"}
                #js {:tag ((.-definition tags) (.-propertyName tags))
                     :color "var(--logseq-code-token-definition)"}
                #js {:tag (.-attributeName tags)
                     :color "var(--logseq-code-token-attribute)"}
                #js {:tag (.-typeName tags)
                     :color "var(--logseq-code-token-type)"}
                #js {:tag (.-tagName tags)
                     :color "var(--logseq-code-token-tag)"}
                #js {:tag (.-className tags)
                     :color "var(--logseq-code-token-class)"}
                #js {:tag (.-labelName tags)
                     :color "var(--logseq-code-token-label)"}
                #js {:tag (.-namespace tags)
                     :color "var(--logseq-code-token-namespace)"}
                #js {:tag (.-macroName tags)
                     :color "var(--logseq-code-token-macro)"}
                #js {:tag (.-operator tags)
                     :color "var(--logseq-code-token-operator)"}
                #js {:tag (.-derefOperator tags)
                     :color "var(--logseq-code-token-operator)"}
                #js {:tag (.-arithmeticOperator tags)
                     :color "var(--logseq-code-token-operator)"}
                #js {:tag (.-logicOperator tags)
                     :color "var(--logseq-code-token-operator)"}
                #js {:tag (.-bitwiseOperator tags)
                     :color "var(--logseq-code-token-operator)"}
                #js {:tag (.-compareOperator tags)
                     :color "var(--logseq-code-token-operator)"}
                #js {:tag (.-updateOperator tags)
                     :color "var(--logseq-code-token-operator)"}
                #js {:tag (.-definitionOperator tags)
                     :color "var(--logseq-code-token-definition-operator)"}
                #js {:tag (.-typeOperator tags)
                     :color "var(--logseq-code-token-type-operator)"}
                #js {:tag (.-controlOperator tags)
                     :color "var(--logseq-code-token-control-operator)"}
                #js {:tag (.-punctuation tags)
                     :color "var(--logseq-code-token-punctuation)"}
                #js {:tag (.-separator tags)
                     :color "var(--logseq-code-token-separator)"}
                #js {:tag (.-bracket tags)
                     :color "var(--logseq-code-token-bracket)"}
                #js {:tag (.-angleBracket tags)
                     :color "var(--logseq-code-token-bracket)"}
                #js {:tag (.-squareBracket tags)
                     :color "var(--logseq-code-token-bracket)"}
                #js {:tag (.-paren tags)
                     :color "var(--logseq-code-token-bracket)"}
                #js {:tag (.-brace tags)
                     :color "var(--logseq-code-token-bracket)"}
                #js {:tag (.-content tags)
                     :color "var(--logseq-code-token-content)"}
                #js {:tag (.-heading tags)
                     :color "var(--logseq-code-token-heading)"
                     :fontWeight "600"}
                #js {:tag #js [(.-heading1 tags) (.-heading2 tags) (.-heading3 tags)
                               (.-heading4 tags) (.-heading5 tags) (.-heading6 tags)]
                     :color "var(--logseq-code-token-heading)"
                     :fontWeight "600"}
                #js {:tag (.-contentSeparator tags)
                     :color "var(--logseq-code-token-content-separator)"}
                #js {:tag (.-list tags)
                     :color "var(--logseq-code-token-list)"}
                #js {:tag (.-quote tags)
                     :color "var(--logseq-code-token-quote)"}
                #js {:tag (.-emphasis tags)
                     :color "var(--logseq-code-token-emphasis)"
                     :fontStyle "italic"}
                #js {:tag (.-strong tags)
                     :color "var(--logseq-code-token-strong)"
                     :fontWeight "600"}
                #js {:tag (.-link tags)
                     :color "var(--logseq-code-token-link)"
                     :textDecoration "underline"}
                #js {:tag (.-monospace tags)
                     :color "var(--logseq-code-token-monospace)"}
                #js {:tag (.-strikethrough tags)
                     :color "var(--logseq-code-token-strikethrough)"
                     :textDecoration "line-through"}
                #js {:tag (.-inserted tags)
                     :color "var(--logseq-code-token-inserted)"}
                #js {:tag (.-deleted tags)
                     :color "var(--logseq-code-token-deleted)"}
                #js {:tag (.-changed tags)
                     :color "var(--logseq-code-token-changed)"}
                #js {:tag (.-meta tags)
                     :color "var(--logseq-code-token-meta)"}
                #js {:tag (.-documentMeta tags)
                     :color "var(--logseq-code-token-document-meta)"}
                #js {:tag (.-annotation tags)
                     :color "var(--logseq-code-token-annotation)"}
                #js {:tag (.-processingInstruction tags)
                     :color "var(--logseq-code-token-processing-instruction)"}
                #js {:tag ((.-special tags) (.-string tags))
                     :color "var(--logseq-code-token-special-string)"}
                #js {:tag (.-invalid tags)
                     :color "var(--logseq-code-token-invalid)"
                     :textDecoration "underline wavy"}]))

(def ^:private language-supports
  cm-languages/language-supports)

(defn- language-extensions
  [language]
  (case (:id language)
    :clojure
    (clojure-language/extensions code-highlight-style)

    (if-let [support (or (:support language)
                         (get language-supports (:id language)))]
      (to-array [support])
      #js [])))

(defn- reconfigure-language!
  [context extension]
  (when (and extension
             (:view context)
             (:language-compartment context))
    (let [^js view (:view context)
          ^js compartment (:language-compartment context)]
      (.dispatch view
                 #js {:effects (.reconfigure compartment
                                             (if (array? extension)
                                               extension
                                               (to-array [extension])))}))))

(defn- load-language-support!
  "For plugin language descriptors carrying a `:load` fn
   (LanguageDescription.load-style), resolve the support and reconfigure the
   language compartment once it settles."
  [context descriptor]
  (when-let [load (:load descriptor)]
    (-> (js/Promise.resolve nil)
        (.then (fn [_]
                 ;; Invoke inside the promise chain so a synchronous throw is
                 ;; also routed through the .catch below.
                 (load (api/language-descriptor->js descriptor))))
        (.then (fn [extension]
                 ;; Only reconfigure while this descriptor is still the
                 ;; selected language; a slower load must not clobber a
                 ;; newer selection.
                 (when (identical? descriptor (:language @(:*state context)))
                   (reconfigure-language! context extension))))
        (.catch (fn [error]
                  (log/error :code-editor/language-load-failed
                             {:id (:id descriptor)
                              :error error}))))))

(defn- base-extensions
  []
  [code-editor-theme
   (highlightSpecialChars)
   (history)
   (drawSelection)
   (dropCursor)
   (closeBrackets)
   (bracketMatching)
   (highlightSelectionMatches)
   (syntaxHighlighting code-highlight-style)
   (keymap-extension)])

(defn- user-option-extensions
  [options]
  (cond-> []
    (:line-numbers? options)
    (conj (lineNumbers))

    (:line-wrapping? options)
    (conj (.-lineWrapping EditorView))))

(defn- extra-codemirror-options
  []
  (get (state/get-config)
       :editor/extra-codemirror-options {}))

(defn- normalize-language-lookup
  [language-name]
  (some-> language-name str string/lower-case string/trim))

(defn- plugin-language-by-name
  [context language-name]
  (let [lookup-key (normalize-language-lookup language-name)]
    (some
     (fn [descriptor]
       (when (or (= lookup-key (api/external-name (:id descriptor)))
                 (contains? (:names descriptor) lookup-key))
         descriptor))
     (vals (:plugin-languages @(:*state context))))))

(defn- language-by-name
  [context language-name]
  (or (plugin-language-by-name context language-name)
      (language-registry/language-by-name language-name)))

(declare enhancer-payload)

(declare set-language-impl!)

(defn- js-enhancer-payload
  [context]
  (api/enhancer-payload->js (enhancer-payload context)))

(defn- resolve-extension
  [context extension]
  (if (fn? extension)
    (extension (js-enhancer-payload context))
    extension))

(defn- register-extension!
  [context key extension]
  (when-not key
    (throw (ex-info "CodeMirror 6 extension key is required" {})))
  (let [extension (resolve-extension context extension)]
    (swap! (:*state context) assoc-in [:plugin-extensions key] extension)
    (when-let [^js view (:view context)]
      (when (and extension (fn? (.-dispatch view)))
        (.dispatch view #js {:effects (.of (.-appendConfig StateEffect) extension)}))))
  context)

(defn- register-language!
  [context descriptor]
  (let [descriptor (api/normalize-language-descriptor descriptor)]
    (when-not (language-registry/valid-language-descriptor? descriptor)
      (throw (ex-info "Invalid CodeMirror 6 language descriptor"
                      {:descriptor descriptor})))
    (swap! (:*state context) assoc-in [:plugin-languages (:id descriptor)] descriptor)
    ;; The fence language was resolved before enhancers ran; if this
    ;; registration now matches the requested name, re-resolve it.
    (let [requested (:requested-language-name @(:*state context))
          resolved (:language @(:*state context))
          match (when requested (plugin-language-by-name context requested))]
      (when (and match (not (identical? match resolved)))
        (set-language-impl! context requested))))
  context)

(defonce ^:private *reported-legacy-enhancers
  (atom #{}))

(defn- report-legacy-enhancer!
  [key enhancer]
  (let [id (or key enhancer)]
    (when-not (contains? @*reported-legacy-enhancers id)
      (swap! *reported-legacy-enhancers conj id)
      (log/error :code-editor/legacy-codemirror-enhancer
                 {:key key
                  :message "Legacy CodeMirror enhancer is not supported by the CodeMirror 6 editor"}))))

(defn- apply-enhancer!
  [key enhancer payload]
  (let [result (enhancer payload)]
    (when (instance? js/Promise result)
      (.catch ^js result
              (fn [e]
                (log/error :code-editor/enhancer-failed {:key key :error e}))))))

(defn apply-enhancers!
  [context enhancers]
  (let [payload (js-enhancer-payload context)]
    (doseq [{:keys [key type enhancer]} enhancers]
      (cond
        (= api/legacy-enhancer-type type)
        (report-legacy-enhancer! key enhancer)

        (fn? enhancer)
        (apply-enhancer! key enhancer payload))))
  context)

(defn- enhancer-payload
  [context]
  (when-let [^js view (:view context)]
    (api/make-enhancer-payload
     {:editor-id (:editor-id context)
      :view view
      :state (.-state view)
      :dispatch! #(.dispatch view %)
      :language (:language @(:*state context))
      :get-language #(language-by-name context %)
      :register-extension! #(register-extension! context %1 %2)
      :register-language! #(register-language! context %)})))

(defn- set-language-impl!
  "Same resolution order as `create-context!`: plugin languages, registry
   names, then file extensions, falling back to plain-text while preserving the
   requested name so a later plugin `register-language!` can re-resolve it."
  [context language-name]
  (let [language (or (plugin-language-by-name context language-name)
                     (language-registry/language-by-name language-name)
                     (language-registry/language-by-extension language-name)
                     (language-registry/plain-text-language))]
    (swap! (:*state context) assoc
           :language language
           :requested-language-name language-name)
    (reconfigure-language! context (language-extensions language))
    (load-language-support! context language)
    language))

(code-editor/register-impl! {:set-language! set-language-impl!})

(defn- config-completion-extensions
  [config-edit?]
  (when config-edit?
    [(autocompletion
      #js {:override #js [clojure-language/config-edn-completion]})]))

(defn create-context!
  [{:keys [parent initial-doc editor-id language-name on-change on-selection-change editable? block-uuid user-options config-edit?]
    :or {initial-doc ""
         editable? true}}]
  (assert-parent! parent)
  (let [user-options (merge api/default-user-options
                            (api/sanitize-user-options user-options))
        language (or (language-registry/language-by-name language-name)
                     (language-registry/language-by-extension language-name)
                     (language-registry/plain-text-language))
        *state (atom {:default-value initial-doc
                      :change-listeners {}
                      :dispose-fns []
                      :language language
                      :plugin-extensions {}
                      :plugin-languages {}
                      :requested-language-name language-name})
        update-listener (.of (.-updateListener EditorView)
                             (fn [^js view-update]
                               (when (.-docChanged view-update)
                                 (let [new-value (.toString (.. view-update -state -doc))]
                                   (schedule-scroll-state! (.-view view-update))
                                   (when on-change
                                     (on-change new-value))
                                   (doseq [listener (vals (:change-listeners @*state))]
                                     (listener new-value))))
                               (when (and (.-selectionSet view-update) on-selection-change)
                                 (on-selection-change))))
        editable-extension (.of (.-editable EditorView) editable?)
        read-only-extension (.of (.-readOnly EditorState) (not editable?))
        user-extensions (user-option-extensions user-options)
        language-compartment (Compartment.)
        state (EditorState.create
               #js {:doc initial-doc
                    :extensions (to-array (into [update-listener editable-extension read-only-extension]
                                                (concat (base-extensions)
                                                        [(.of language-compartment
                                                              (language-extensions language))]
                                                        user-extensions
                                                        (config-completion-extensions config-edit?))))})
        view (EditorView. #js {:state state
                               :parent parent})
        context {:block-uuid block-uuid
                 :editor-id editor-id
                 :language-compartment language-compartment
                 :parent parent
                 :*state *state
                 :view view}]
    (when-let [^js scroller (.querySelector (.-dom view) ".cm-scroller")]
      (let [on-scroll #(update-scroll-state! view)]
        (.addEventListener scroller "scroll" on-scroll)
        (swap! *state update :dispose-fns conj
               #(.removeEventListener scroller "scroll" on-scroll))))
    (let [on-resize #(schedule-scroll-state! view)]
      (.addEventListener js/window "resize" on-resize)
      (swap! *state update :dispose-fns conj
             #(.removeEventListener js/window "resize" on-resize)))
    (when (gobj/get js/window "ResizeObserver")
      (let [^js observer (js/ResizeObserver. #(schedule-scroll-state! view))]
        (.observe observer (.-dom view))
        (when-let [^js editor-host (.closest (.-dom view) ".logseq-code-editor")]
          (.observe observer editor-host))
        (swap! *state update :dispose-fns conj #(.disconnect observer))))
    (schedule-scroll-state! view)
    (js/setTimeout #(sync-layout-state! view) 80)
    (gobj/set parent code-editor/context-property context)
    (gobj/set (.-dom view) code-editor/context-property context)
    context))

(defn- save-editor!
  [config]
  (p/do!
   (code-handler/save-code-editor!)
   (when-let [block (or (:code-block config) (:block config))]
     (p/let [block (db-async/<get-block (state/get-current-repo)
                                       (:block/uuid block)
                                       {:children? false})]
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

(defn- editor-keydown-handler
  [context config *esc-pressed? *cursor-prev *cursor-curr update-cursor!]
  (fn [e]
    (let [key-code (.-code e)
          meta-or-ctrl-pressed? (or (.-ctrlKey e) (.-metaKey e))]
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

        :else nil))))

(defn- install-event-handlers!
  [context config component-state edit-block code-block *update-cursor!]
  (let [^js view (:view context)
        ^js editor-dom (.-dom view)
        ^js editor-root (or (.closest editor-dom ".ui-fenced-code-editor")
                            editor-dom)
        ^js owner-document (.-ownerDocument editor-dom)
        *esc-pressed? (volatile! false)
        *cursor-prev (volatile! nil)
        *cursor-curr (volatile! nil)
        update-cursor! #(update-cursor-state! context *cursor-prev *cursor-curr)
        current-context? #(identical? context (:editor (:editor/code-block-context (state/get-state))))
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
                                            :state component-state})
                         (update-cursor!)))
    (.addEventListener editor-dom "focusout"
                       (fn [e]
                         (let [related-target (some-> e .-relatedTarget)]
                           (when-not (and related-target
                                          (.contains editor-root related-target))
                             (leave-editor! @*esc-pressed?)))))
    ;; Shift+Enter creates a sibling block. Intercept in the capture phase so
    ;; CodeMirror's Shift-Enter (insertNewlineAndIndent) never runs — otherwise
    ;; the editor would insert a newline *and* a sibling block would be added.
    (.addEventListener editor-dom "keydown"
                       (fn [e]
                         (when (and (= "Enter" (.-code e)) (.-shiftKey e))
                           (util/stop e)
                           (when-let [blockid (some-> (.-target e) (.closest "[blockid]") (.getAttribute "blockid"))]
                             (code-handler/save-code-editor!)
                             (util/schedule #(editor-handler/api-insert-new-block! ""
                                                                                   {:block-uuid (uuid blockid)
                                                                                    :sibling? true})))))
                       #js {:capture true})
    (.addEventListener editor-dom "keydown"
                       (editor-keydown-handler context config *esc-pressed? *cursor-prev *cursor-curr update-cursor!))
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
  [component-state]
  (let [{:keys [config id attr code set-calc-lines!]} component-state
        edit-block (:block config)
        code-block (:code-block config)
        original-mode (get attr :data-lang)
        parent (gdom/getElement id)
        *editor-ref (get attr :editor-ref)
        *update-cursor! (atom nil)
        config-edit? (and (:file? config)
                          (string/ends-with? (:file-path config) "config.edn"))
        context (when parent
                  (create-context!
                   {:parent parent
                    :initial-doc (or code "")
                    :editor-id id
                    :language-name (or original-mode "plain-text")
                    :editable? (not config/publishing?)
                    :block-uuid (:block/uuid (or code-block edit-block))
                    :user-options (extra-codemirror-options)
                    :config-edit? config-edit?
                    :on-change (fn [new-code]
                                 (when (= original-mode "calc")
                                   (set-calc-lines! (calc/eval-lines new-code))))
                    :on-selection-change #(when-let [f @*update-cursor!] (f))}))]
    (when context
      (when *editor-ref
        (reset! *editor-ref context))
      (install-event-handlers! context config component-state edit-block code-block *update-cursor!)
      (when-let [legacy-enhancers (seq (hook-extensions-enhancers-by-key api/legacy-enhancer-type))]
        (apply-enhancers! context (map #(assoc % :type api/legacy-enhancer-type) legacy-enhancers)))
      (when-let [enhancers (seq (hook-extensions-enhancers-by-key api/enhancer-type))]
        (apply-enhancers! context enhancers))
      context)))

(defn- load-and-render!
  [component-state]
  (let [editor-atom (:editor-atom component-state)]
    (when-not @editor-atom
      (let [context (render! component-state)]
        (reset! editor-atom context)))))

(defn- calc-mode?
  [attr]
  (= (:data-lang attr) "calc"))

(defn- sync-editor-code!
  [context code]
  (when (and context
             (string? code)
             (not (code-editor/has-focus? context))
             (not= (code-editor/get-value context) code))
    (code-editor/set-value! context code)))

(defn- sync-editor-language!
  "Re-resolve `:data-lang` when it changes on a mounted editor, e.g. the same
   block open in the main page and sidebar: picking a language in one view must
   update the other's highlighting too."
  [context language-name]
  (when context
    (let [language-name (or language-name "plain-text")]
      (when-not (= language-name (:requested-language-name @(:*state context)))
        (code-editor/set-language! context language-name)))))

(hsx/defc editor
  [config id attr code options]
  (let [editor-atom (hooks/use-memo #(atom nil) [id])
        calc? (calc-mode? attr)
        [calc-lines set-calc-lines!] (hooks/use-state #(when calc? (calc/eval-lines code)))
        code-options (hooks/use-memo #(atom options) [id])
        component-state {:config config
                         :id id
                         :attr attr
                         :code code
                         :options options
                         :editor-atom editor-atom
                         :set-calc-lines! set-calc-lines!
                         :code-options code-options}]
    (hooks/use-effect!
     (fn []
       (load-and-render! component-state)
       (fn []
         (when-let [context @editor-atom]
           (code-editor/destroy! context)
           (reset! editor-atom nil))))
     [id])
    (hooks/use-effect!
     (fn []
       (sync-editor-code! @editor-atom code)
       (sync-editor-language! @editor-atom (:data-lang attr))
       (when calc?
         (set-calc-lines! (calc/eval-lines code))))
     [id code calc? (:data-lang attr)])
    (hooks/use-effect!
     (fn []
       (reset! code-options options))
     [options])
    [:div.extensions__code.flex.flex-1
     (cond-> {}
       calc?
       (assoc :data-lang "calc"))
     (when-let [mode (:data-lang attr)]
       (when-not (= mode "calc")
         [:div.extensions__code-lang
          (string/lower-case mode)]))
     [:div.code-editor.flex.flex-1.flex-row.w-full
      [:div (merge {:id id
                    :class "logseq-code-editor"
                    :data-logseq-code-editor-root "true"}
                   (select-keys (or attr {}) [:data-lang]))]
      (when calc?
        (calc/results calc-lines))]]))

(lazy-editor/register-editor! editor)

;; Focus into the CodeMirror editor rather than the normal "raw" editor.
;; The requestAnimationFrame is necessary because, for some reason, when you
;; type /calculate and then click the "Calculate" command in the dropdown
;; *with your mouse* (but not when you do so via your keyboard with the
;; arrow + enter keys!), React doesn't re-render before the :codemirror/focus
;; command kicks off. As a result, you get an error saying that the node
;; you're trying to focus doesn't yet exist. Adding the requestAnimationFrame
;; ensures that the React component re-renders before the :codemirror/focus
;; command is run. It's not elegant... open to suggestions for how to fix it!
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
