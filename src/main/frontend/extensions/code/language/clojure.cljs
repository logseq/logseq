(ns frontend.extensions.code.language.clojure
  (:require [clojure.string :as string]
            ["@codemirror/language" :refer [foldInside foldNodeProp indentNodeProp
                                             LRLanguage LanguageSupport syntaxTree]]
            ["@codemirror/state" :refer [StateField]]
            ["@codemirror/view" :refer [Decoration EditorView]]
            ["@lezer/highlight" :refer [styleTags tags]]
            ["@nextjournal/lezer-clojure" :refer [parser props]]
            [goog.object :as gobj]))

(def ^:private control-operators
  #{"->" "->>" "as->" "case" "catch" "cond" "cond->" "cond->>" "condp"
    "do" "doseq" "dotimes" "doto" "finally" "fn" "for" "if" "if-let"
    "if-not" "if-some" "let" "letfn" "loop" "recur" "some->" "some->>"
    "try" "when" "when-first" "when-let" "when-not" "when-some" "while"
    "with-bindings" "with-local-vars" "with-open" "with-redefs"})

(def ^:private definition-operators
  #{"declare" "def" "definline" "definterface" "defmacro" "defmethod"
    "defmulti" "defn" "defn-" "defonce" "defprotocol" "defrecord"
    "defstruct" "deftype" "extend-protocol" "extend-type" "ns"})

(def ^:private symbolic-operator-pattern
  #"^[!$%&*+\-./:<=>?@^|~]+$")

(def ^:private coll-prop
  (.-coll props))

(def ^:private style-tags
  (styleTags
   (gobj/create
    "NS" (.-moduleKeyword tags)
    "DefLike" (.-definitionKeyword tags)
    "VarName/Symbol" ((.-definition tags) (.-variableName tags))
    "Boolean" (.-bool tags)
    "DocString/..." (.-docString tags)
    "Discard!" (.-comment tags)
    "Number" (.-number tags)
    "StringContent" (.-string tags)
    "\"\\\"\"" (.-string tags)
    "Keyword" (.-atom tags)
    "Nil" (.-null tags)
    "LineComment" (.-lineComment tags)
    "RegExp" (.-regexp tags))))

(defn- symbolic-operator?
  [text]
  (boolean (re-matches symbolic-operator-pattern text)))

(defn- operator-token
  [text]
  (cond
    (contains? control-operators text)
    :control-keyword

    (or (contains? definition-operators text)
        (string/starts-with? text "def"))
    :definition-keyword

    (symbolic-operator? text)
    :operator

    :else
    :function))

(defn- highlight-mark
  [highlight-style token-tags]
  (.mark Decoration #js {:class (.style highlight-style token-tags)}))

(defn- token-marks
  [highlight-style]
  {:control-keyword (highlight-mark highlight-style #js [(.-controlKeyword tags)])
   :definition-keyword (highlight-mark highlight-style #js [(.-definitionKeyword tags)])
   :function (highlight-mark highlight-style #js [((.-function tags) (.-variableName tags))])
   :operator (highlight-mark highlight-style #js [(.-operator tags)])})

(defn- operator-node-token
  [^js state ^js node]
  (when (= "Operator" (.-name node))
    (operator-token (.sliceString (.-doc state) (.-from node) (.-to node)))))

(defn- highlight-decorations
  [marks ^js state]
  (let [ranges #js []]
    (.iterate (syntaxTree state)
              #js {:enter
                   (fn [^js node]
                     (when-let [mark (get marks (operator-node-token state node))]
                       (.push ranges (.range mark (.-from node) (.-to node)))))})
    (.set Decoration ranges true)))

(defn- highlight-field
  [highlight-style]
  (let [marks (token-marks highlight-style)]
    (.define StateField
             #js {:create #(highlight-decorations marks %)
                  :update (fn [decorations ^js transaction]
                            (if (or (.-docChanged transaction)
                                    (.-reconfigured transaction))
                              (highlight-decorations marks (.-state transaction))
                              decorations))
                  :provide (fn [field]
                             (.from (.-decorations EditorView) field))})))

(defn- indent
  [^js node-type]
  (fn [^js context]
    (if (.prop node-type coll-prop)
      (let [^js node (.-node context)
            ^js first-child (.-firstChild node)
            ^js operator-node (some-> first-child .-nextSibling)
            operator-name (some-> operator-node .-type .-name)
            parent-base (if first-child
                          (.column context (.-to first-child))
                          (.-baseIndent context))]
        (if (and (= "List" (.-name node-type))
                 (contains? #{"NS" "DefLike" "Operator"} operator-name))
          (inc parent-base)
          parent-base))
      0)))

(def ^:private language
  (.define LRLanguage
           #js {:parser (.configure parser
                                    #js {:props #js [style-tags
                                                     (.add indentNodeProp indent)
                                                     (.add foldNodeProp #js {"Vector Map List" foldInside})]})
                :languageData #js {:commentTokens #js {:line ";;"}}}))

(defn extensions
  [highlight-style]
  (to-array [(LanguageSupport. language)
             (highlight-field highlight-style)]))
