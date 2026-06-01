(ns frontend.extensions.code
  (:require [clojure.string :as string]
            ["@codemirror/autocomplete" :refer [closeBrackets closeBracketsKeymap completionKeymap]]
            ["@codemirror/commands" :refer [defaultKeymap history historyKeymap indentWithTab]]
            ["@codemirror/lang-css" :refer [css]]
            ["@codemirror/lang-html" :refer [html]]
            ["@codemirror/lang-javascript" :refer [javascript]]
            ["@codemirror/lang-json" :refer [json]]
            ["@codemirror/lang-markdown" :refer [markdown]]
            ["@codemirror/lang-python" :refer [python]]
            ["@codemirror/lang-sql" :refer [sql]]
            ["@codemirror/language" :refer [HighlightStyle syntaxHighlighting StreamLanguage]]
            ["@codemirror/legacy-modes/mode/shell" :refer [shell]]
            ["@codemirror/legacy-modes/mode/yaml" :refer [yaml]]
            ["@codemirror/lint" :refer [lintKeymap]]
            ["@codemirror/search" :refer [highlightSelectionMatches searchKeymap]]
            ["@codemirror/state" :refer [Compartment EditorState StateEffect]]
            ["@codemirror/view" :refer [drawSelection dropCursor EditorView
                                         highlightSpecialChars keymap lineNumbers]]
            ["@lezer/highlight" :refer [tags]]
            [frontend.extensions.code.api :as api]
            [frontend.extensions.code.language.clojure :as clojure-language]
            [frontend.extensions.code.language-registry :as language-registry]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]))

(def context-property "__logseqCodeEditorContext")

(defn- assert-parent!
  [parent]
  (when-not parent
    (throw (ex-info "CodeMirror 6 parent element is required" {}))))

(defn- editor-doc
  [^js view]
  (.. view -state -doc))

(defn- doc-length
  [^js view]
  (.-length (editor-doc view)))

(defn- clamp-offset
  [view offset]
  (max 0 (min (or offset 0) (doc-length view))))

(defn- resolve-language!
  [language-name]
  (or (language-registry/language-by-name language-name)
      (language-registry/language-by-extension language-name)
      (throw (ex-info "Unsupported CodeMirror 6 language"
                      {:language language-name}))))

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

(defn- schedule-scroll-state!
  [^js view]
  (js/requestAnimationFrame #(update-scroll-state! view)))

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

(def code-highlight-style
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

(defn- language-extension
  [language]
  (case (:id language)
    :css (css)
    :html (html)
    :javascript (javascript)
    :json (json)
    :jsx (javascript #js {:jsx true})
    :markdown (markdown)
    :python (python)
    :sql (sql)
    :shell (.define StreamLanguage shell)
    :typescript (javascript #js {:typescript true})
    :tsx (javascript #js {:jsx true
                          :typescript true})
    :yaml (.define StreamLanguage yaml)
    nil))

(defn- language-extensions
  [language]
  (case (:id language)
    :clojure (clojure-language/extensions code-highlight-style)
    (if-let [extension (language-extension language)]
      (to-array [extension])
      #js [])))

(defn- base-extensions
  []
  [code-editor-theme
   (highlightSpecialChars)
   (history)
   (drawSelection)
   (dropCursor)
   (closeBrackets)
   (highlightSelectionMatches)
   (syntaxHighlighting code-highlight-style)
   (keymap-extension)])

(defn get-value
  [context]
  (.toString (editor-doc (:view context))))

(defn default-value
  [context]
  (:default-value @(:*state context)))

(defn set-default-value!
  [context value]
  (swap! (:*state context) assoc :default-value value)
  context)

(defn add-change-listener!
  [context f]
  (when-not (fn? f)
    (throw (ex-info "CodeMirror 6 change listener must be a function" {})))
  (let [listener-id (random-uuid)]
    (swap! (:*state context) assoc-in [:change-listeners listener-id] f)
    #(swap! (:*state context) update :change-listeners dissoc listener-id)))

(defn set-value!
  [context value]
  (let [^js view (:view context)]
    (.dispatch view
               #js {:changes #js {:from 0
                                   :to (doc-length view)
                                   :insert (or value "")}})
    context))

(defn focus!
  [context]
  (let [^js view (:view context)]
    (.focus view))
  context)

(defn has-focus?
  [context]
  (let [^js view (:view context)]
    (true? (.-hasFocus view))))

(defn line-count
  [context]
  (.-lines (editor-doc (:view context))))

(defn last-line
  [context]
  (dec (line-count context)))

(defn line-ch->offset
  [context {:keys [line ch]}]
  (let [^js view (:view context)
        text-doc (editor-doc view)
        line-number (inc (max 0 (or line 0)))
        line' (.line text-doc (min line-number (.-lines text-doc)))
        line-start (.-from line')
        line-end (.-to line')]
    (+ line-start (max 0 (min (or ch 0) (- line-end line-start))))))

(defn offset->line-ch
  [context offset]
  (let [^js view (:view context)
        text-doc (editor-doc view)
        offset' (clamp-offset view offset)
        line' (.lineAt text-doc offset')]
    {:line (dec (.-number line'))
     :ch (- offset' (.-from line'))}))

(defn selection-range
  [context]
  (let [^js view (:view context)
        main (.. view -state -selection -main)]
    {:start (offset->line-ch context (.-from main))
     :end (offset->line-ch context (.-to main))}))

(defn line-text
  [context line]
  (let [^js view (:view context)
        text-doc (editor-doc view)
        line-number (inc (max 0 (or line 0)))
        line' (.line text-doc (min line-number (.-lines text-doc)))]
    (.-text line')))

(defn set-selection-by-offset!
  [context offset]
  (let [^js view (:view context)
        offset' (clamp-offset view offset)]
    (.dispatch view #js {:selection #js {:anchor offset'}})
    context))

(defn set-cursor!
  [context cursor]
  (set-selection-by-offset! context (line-ch->offset context cursor)))

(defn set-language!
  [context language-name]
  (let [language (or (plugin-language-by-name context language-name)
                     (resolve-language! language-name))]
    (swap! (:*state context) assoc :language language)
    (when-let [^js view (:view context)]
      (when-let [^js compartment (:language-compartment context)]
        (.dispatch view #js {:effects (.reconfigure compartment (language-extensions language))})))
    language))

(declare enhancer-payload)

(defn- js-enhancer-payload
  [context]
  (api/enhancer-payload->js (enhancer-payload context)))

(defn- resolve-extension
  [context extension]
  (if (fn? extension)
    (extension (js-enhancer-payload context))
    extension))

(defn register-extension!
  [context key extension]
  (when-not key
    (throw (ex-info "CodeMirror 6 extension key is required" {})))
  (let [extension (resolve-extension context extension)]
    (swap! (:*state context) assoc-in [:plugin-extensions key] extension)
    (when-let [^js view (:view context)]
      (when (and extension (fn? (.-dispatch view)))
        (.dispatch view #js {:effects (.of (.-appendConfig StateEffect) extension)}))))
  context)

(defn register-language!
  [context descriptor]
  (let [descriptor (api/normalize-language-descriptor descriptor)]
    (when-not (language-registry/valid-language-descriptor? descriptor)
      (throw (ex-info "Invalid CodeMirror 6 language descriptor"
                      {:descriptor descriptor})))
    (swap! (:*state context) assoc-in [:plugin-languages (:id descriptor)] descriptor))
  context)

(defn apply-enhancers!
  [context enhancers]
  (let [payload (js-enhancer-payload context)]
    (doseq [{:keys [key type enhancer]} enhancers]
      (cond
        (= api/legacy-enhancer-type type)
        (log/error :code-editor/legacy-codemirror-enhancer
                   {:key key
                    :message "Legacy CodeMirror enhancer is not supported by the CodeMirror 6 editor"})

        (fn? enhancer)
        (enhancer payload))))
  context)

(defn enhancer-payload
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

(defn destroy!
  [context]
  (let [^js view (:view context)
        ^js parent (:parent context)]
    (doseq [dispose! (:dispose-fns @(:*state context))]
      (dispose!))
    (swap! (:*state context) assoc :dispose-fns [])
    (when parent
      (gobj/remove parent context-property))
    (some-> view .-dom (gobj/remove context-property))
    (.destroy view))
  context)

(defn- user-option-extensions
  [options]
  (cond-> []
    (:line-numbers? options)
    (conj (lineNumbers))

    (:line-wrapping? options)
    (conj (.-lineWrapping EditorView))))

(defn create-context!
  [{:keys [parent initial-doc editor-id language-name on-change on-selection-change editable? block-uuid user-options]
    :or {initial-doc ""
         editable? true}}]
  (assert-parent! parent)
  (let [user-options (merge api/default-user-options
                            (api/validate-user-options! user-options))
        language (or (language-registry/language-by-name language-name)
                     (language-registry/language-by-extension language-name)
                     (language-registry/plain-text-language))
        *state (atom {:default-value initial-doc
                      :change-listeners {}
                      :dispose-fns []
                      :language language
                      :plugin-extensions {}
                      :plugin-languages {}})
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
                                                        user-extensions)))})
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
    (js/setTimeout #(update-scroll-state! view) 80)
    (gobj/set parent context-property context)
    (gobj/set (.-dom view) context-property context)
    context))
