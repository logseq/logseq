(ns frontend.extensions.code.language.clojure
  "Clojure/edn language support for the CodeMirror 6 editor: lezer-based
   highlighting, indentation and folding, plus config.edn-aware completion."
  (:require [clojure.string :as string]
            ["@codemirror/language" :refer [foldInside foldNodeProp indentNodeProp
                                            LRLanguage LanguageSupport syntaxTree]]
            ["@codemirror/state" :refer [StateField]]
            ["@codemirror/view" :refer [Decoration EditorView]]
            ["@lezer/highlight" :refer [styleTags tags]]
            ["@nextjournal/lezer-clojure" :refer [parser props]]
            [frontend.schema.handler.common-config :refer [Config-edn]]
            [goog.object :as gobj]
            [malli.core :as m]))

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

;;; config.edn completion
;;;
;;; The schema is walked with malli to build config-key and config-value
;;; completions from the lezer syntax tree at the cursor. Positional parity
;;; decides key vs value slots: inside a Map node children are
;;; "{" expr expr ... "}" so keys sit at odd sibling indexes and values at
;;; even ones.

(def ^:private non-map-colls
  "Collections in which a nested Map does not receive config completion
   (e.g. maps inside datascript vectors), matching the CM5 ignore-map rule."
  #{"List" "Vector" "Set" "AnonymousFunction" "ReaderConditional"})

(defn- keyword-node?
  [^js node]
  (= "Keyword" (.-name node)))

(defn- child-index
  "0-based position of `node` among its parent's children."
  [^js node]
  (loop [sib (.prevSibling node)
         n 0]
    (if sib
      (recur (.prevSibling sib) (inc n))
      n)))

(defn- map-key-slot?
  "True when `node` sits in a key position of its parent Map."
  [^js node]
  (and (= "Map" (some-> (.-parent node) (.-name)))
       (odd? (child-index node))))

(defn- keyword-text
  [^js state ^js node]
  (.sliceString (.-doc state) (.-from node) (.-to node)))

(defn- enclosing-key
  "When `node` sits in a value slot of a Map, returns the text of the
   Keyword keying that slot — the last key-position Keyword before it."
  [^js state ^js node]
  (when (even? (child-index node))
    (loop [sib (.prevSibling node)]
      (cond
        (nil? sib) nil
        (and (keyword-node? sib) (map-key-slot? sib)) (keyword-text state sib)
        :else (recur (.prevSibling sib))))))

(defn- path-above
  "Keyword path contributed by the Map ancestors enclosing `node`.
   Returns nil when a non-map collection ancestor is found first, matching
   the CM5 ignore-map rule (no completion inside lists/vectors/sets)."
  [^js state ^js node]
  (loop [n node
         path '()]
    (let [p (.-parent n)]
      (cond
        (nil? p) (vec (reverse path))

        (= "Map" (.-name p))
        (let [k (enclosing-key state n)]
          (recur p (if k (cons k path) path)))

        (contains? non-map-colls (.-name p))
        nil

        :else
        (recur p path)))))

(defn- innermost-map
  [^js node]
  (loop [n node]
    (cond
      (nil? n) nil
      (= "Map" (.-name n)) n
      (contains? non-map-colls (.-name n)) nil
      :else (recur (.-parent n)))))

(defn- child-before
  "Last child of `parent` that ends at or before `pos`."
  [^js parent pos]
  (loop [node (.-firstChild parent)
         prev nil]
    (cond
      (nil? node) prev
      (> (.-to node) pos) prev
      :else (recur (.-nextSibling node) node))))

(defn- child-after
  "First child of `parent` starting at or after `pos`."
  [^js parent pos]
  (loop [node (.-firstChild parent)]
    (cond
      (nil? node) nil
      (>= (.-from node) pos) node
      :else (recur (.-nextSibling node)))))

(defn- completion-context
  "Resolve `pos` inside `state` to a completion context: either a key
   completion over a partially typed Keyword, or a value completion on the
   whitespace slot right after a Keyword."
  [^js state pos]
  (let [node (.resolveInner (syntaxTree state) pos -1)]
    (cond
      ;; partially typed keyword in a key slot
      (and (keyword-node? node)
           (<= pos (.-to node)))
      (when (map-key-slot? node)
        (when-let [path (path-above state node)]
          {:kind :key
           :from (.-from node)
           :to (.-to node)
           :path path}))

      :else
      ;; whitespace right after a keyword: value slot
      (when-let [map-node (innermost-map node)]
        (let [prev (child-before map-node pos)
              next (child-after map-node pos)]
          (when (and prev
                     (keyword-node? prev)
                     (map-key-slot? prev)
                     (or (nil? next) (= "}" (.-name next))))
            (when-let [path (path-above state prev)]
              {:kind :value
                :from pos
                :to pos
                :path (conj path (keyword-text state prev))})))))))

(defn- malli-type->completion-postfix
  [type]
  (case type
    :string "\"\""
    :map-of "{}"
    :map "{}"
    :set "#{}"
    :vector "[]"
    nil))

;; TODO: mu/to-map-syntax has been deprecated, consider removing usage
(defn -map-syntax-walker [schema _ children _]
  (let [properties (m/properties schema)
        options (m/options schema)
        r (when properties (properties :registry))
        properties (if r (assoc properties :registry (m/-property-registry r options m/-form)) properties)]
    (cond-> {:type (m/type schema)}
      (seq properties) (assoc :properties properties)
      (seq children) (assoc :children children))))

(defn- malli-to-map-syntax
  ([?schema] (malli-to-map-syntax ?schema nil))
  ([?schema options] (m/walk ?schema -map-syntax-walker options)))

(defn- key-candidates
  "Map of config-key text -> malli type for `path`."
  [config-path]
  (let [result (atom {})]
    (m/walk Config-edn
            (fn [schema properties _children _opts]
              (let [schema-path (mapv str properties)]
                (cond
                  (empty? schema-path)
                  nil

                  (empty? config-path)
                  (swap! result assoc (first schema-path) (m/type schema))

                  (= (count config-path) 1)
                  (when (string/starts-with? (first schema-path) (first config-path))
                    (swap! result assoc (first schema-path) (m/type schema)))

                  (= (count config-path) 2)
                  (when (and (= (count schema-path) 2)
                             (= (first schema-path) (first config-path))
                             (string/starts-with? (second schema-path) (second config-path)))
                    (swap! result assoc (second schema-path) (m/type schema)))))
              nil))
    @result))

(defn- value-candidates
  "Completion values for the schema at `config-path` (:boolean, :enum)."
  [config-path]
  (let [result (atom {})]
    (m/walk Config-edn
            (fn [schema properties _children _opts]
              (let [schema-path (mapv str properties)]
                (when (= config-path schema-path)
                  (case (m/type schema)
                    :boolean
                    (swap! result assoc
                           "true" nil
                           "false" nil)

                    :enum
                    (let [{:keys [children]} (malli-to-map-syntax schema)]
                      (doseq [child children]
                        (swap! result assoc (str child) nil)))

                    nil))
                nil)))
    @result))

(def ^:private keyword-valid-for
  #"^:?[^\s()\[\]{}\"';]*$")

(defn config-edn-completion
  "CodeMirror 6 autocomplete source for config.edn buffers. Completes schema
   keys while typing a `:keyword` in a map key slot and boolean/enum values
   in the whitespace slot right after a key."
  [^js context]
  (let [pos (.-pos context)
        state (.-state context)]
    (when-let [{:keys [kind from to path]} (completion-context state pos)]
      (case kind
        :key
        (let [candidates (key-candidates path)]
          (when (seq candidates)
            (let [doc (.toString (.-doc state))
                  add-postfix? (<= to pos)
                  options (->> (keys candidates)
                               (remove (fn [text]
                                         (re-find (re-pattern (str "[^;]*" text "\\s")) doc)))
                               sort
                               (map (fn [text]
                                      (let [type (get candidates text)]
                                        {:label text
                                         :detail (some-> type name)
                                         :apply (str text (when add-postfix?
                                                            (str " " (malli-type->completion-postfix type))))}))))]
              #js {:from from
                   :to to
                   :options (clj->js options)
                   :validFor keyword-valid-for})))

        :value
        (let [candidates (value-candidates path)]
          (when (seq candidates)
            #js {:from from
                 :to to
                 :options (clj->js (mapv (fn [text] {:label text :apply text})
                                         (sort (keys candidates))))}))))))
