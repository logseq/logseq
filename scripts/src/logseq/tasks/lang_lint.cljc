(ns logseq.tasks.lang-lint
  (:require [clojure.string :as string]))

;; Matches `notification/show!` calls whose first argument is a literal message.
(def ^:private notification-pattern
  #"notification/show!\s+\"([^\"\n]+)\"")

;; Matches supported user-facing Hiccup attributes with literal string values.
(def ^:private user-facing-attr-pattern
  #"(?<!\[):(placeholder|title|aria-label|label|alt)\s+\"([^\"\n]+)\"")

;; Matches literal text children in supported Hiccup tags, including tag
;; shorthand such as `:div.foo` or `:button#id`.
(def ^:private hiccup-text-pattern
  #"\[:(?:button|span|div|label|a|p|small|strong|li|h1|h2|h3|h4|h5|h6)(?:[#.][^\"\s\[\{]+)*\s+\"([A-Za-z][^\"\n]*)\"")

;; Matches numbered placeholders like `{1}` in translation strings.
(def ^:private translation-placeholder-pattern
  #"\{(\d+)\}")

;; Matches keyword literals embedded in source text.
(def ^:private translation-key-pattern
  #":[^ )}\],\s]+")

;; Matches translation calls whose first argument starts with an `if` form.
(def ^:private translation-call-if-prefix-pattern
  #"\((?:[[:alnum:]._-]+/)?tt?\s+\(if\b")

;; Matches translation calls whose first argument starts with an `or` form.
(def ^:private translation-call-or-prefix-pattern
  #"\((?:[[:alnum:]._-]+/)?tt?\s+\(or\b")

;; Matches literal `i18n-key` assignments backed by an `if` form.
(def ^:private i18n-key-if-prefix-pattern
  #":?i18n-key\s+\(if\b")

;; Matches the `built-in-colors` vector body for later string extraction.
(def ^:private built-in-colors-pattern
  #"(?s)\(def\s+built-in-colors\s+\[(.*?)\]\)")

;; Matches quoted string literals inside extracted list or vector content.
(def ^:private string-literal-pattern
  #"\"([^\"]+)\"")

;; Matches the left sidebar `navs` vector body for derived key extraction.
(def ^:private left-sidebar-navs-pattern
  #"(?s)\bnavs\s+\[(.*?)\]")

;; Matches `:tag/*` entries inside left sidebar nav definitions.
(def ^:private tag-nav-key-pattern
  #":tag/([A-Za-z][A-Za-z0-9._-]*)")

;; Matches namespaced built-in shortcut ids declared as map keys.
(def ^:private shortcut-command-id-pattern
  #"(?m)^\s*\{?:([A-Za-z0-9._-]+)/([A-Za-z0-9._-]+)\s+\{")

;; Matches literal shortcut category translation keys.
(def ^:private shortcut-category-key-pattern
  #":shortcut\.category/[A-Za-z0-9._-]+")

;; Matches the start of `(comment ...)` forms.
(def ^:private comment-form-prefix-pattern
  #"\(comment\b")

;; Lists literal strings that are intentionally excluded from hardcoded UI findings.
(def ^:private ignored-hardcoded-texts
  #{"Logseq"
    "Logseq "
    "ID: "
    "DOING"
    "TODO"
    "http://"
    "https://"
    "{}"
    "Ag"
    "git commit -m ..."})

(defn- make-finding
  [kind file-path line text]
  {:kind kind
   :file file-path
   :line line
   :text text})

(defn- ignorable-hardcoded-text?
  [text]
  (contains? ignored-hardcoded-texts text))

(defn- line-findings
  [file-path line-number line commented-lines]
  (if (or (commented-lines line-number)
          (string/starts-with? (string/triml line) ";"))
    []
    (let [notification-findings
          (for [[_ text] (re-seq notification-pattern line)]
            (when-not (ignorable-hardcoded-text? text)
              (make-finding :notification file-path line-number text)))
          attr-findings
          (for [[_ attr text] (re-seq user-facing-attr-pattern line)]
            (when-not (ignorable-hardcoded-text? text)
              (make-finding (keyword attr) file-path line-number text)))
          hiccup-findings
          (for [[_ text] (re-seq hiccup-text-pattern line)]
            (when-not (ignorable-hardcoded-text? text)
              (make-finding :hiccup-text file-path line-number text)))]
      (into [] (remove nil? (concat notification-findings attr-findings hiccup-findings))))))

(declare comment-form-lines)

(defn hardcoded-string-findings
  "Return user-facing hardcoded string findings for `content`.

  Each finding contains `:kind`, `:file`, `:line`, and `:text`."
  [file-path content]
  (let [commented-lines (comment-form-lines content)]
    (->> (string/split-lines content)
       (map-indexed (fn [index line]
                      (line-findings file-path (inc index) line commented-lines)))
       (apply concat)
       vec)))

(defn translation-placeholders
  "Return the placeholder indexes referenced by translation string `value`.

  Non-string values return an empty set."
  [value]
  (if (string? value)
    (->> (re-seq translation-placeholder-pattern value)
         (map second)
         set)
    #{}))

(defn- keyword-literals
  ([value] (keyword-literals value #{}))
  ([value excluded-keys]
   (->> (re-seq translation-key-pattern value)
        (map #(keyword (subs % 1)))
        (remove excluded-keys)
        set)))

(defn- keyword-literals-in-order
  [value]
  (->> (re-seq translation-key-pattern value)
       (map #(keyword (subs % 1)))))

(defn- conditional-branch-keys
  [value]
  (->> (keyword-literals-in-order value)
       (remove #{:i18n-key})
       (take-last 2)
       set))

(defn- extract-balanced-list-form
  [content start-index]
  (loop [index start-index
         depth 0
         in-string? false
         escape? false]
    (when (< index (count content))
      (let [ch (.charAt content index)
            next-escape? (and in-string? (= ch \\) (not escape?))
            next-in-string? (if (and (= ch \") (not escape?))
                              (not in-string?)
                              in-string?)
            next-depth (cond
                         next-in-string? depth
                         (= ch \() (inc depth)
                         (= ch \)) (dec depth)
                         :else depth)
            end? (and (= ch \)) (not in-string?) (= next-depth 0))]
        (if end?
          (subs content start-index (inc index))
          (recur (inc index) next-depth next-in-string? next-escape?))))))

(defn- matched-list-form-matches
  [pattern list-head content]
  (loop [forms []
         search-start 0]
    (let [remaining (subs content search-start)
          match (re-find pattern remaining)]
      (if match
        (let [match-start (+ search-start (string/index-of remaining match))
              list-offset (string/index-of match list-head)
              list-start (+ match-start list-offset)
              form (extract-balanced-list-form content list-start)]
          (recur (cond-> forms
                   form (conj {:start list-start
                               :form form}))
                 (inc match-start)))
        forms))))

(defn- matched-list-forms
  [pattern list-head content]
  (mapv :form (matched-list-form-matches pattern list-head content)))

(defn- comment-form-lines
  [content]
  (->> (matched-list-form-matches comment-form-prefix-pattern "(comment" content)
       (mapcat (fn [{:keys [start form]}]
                 (let [start-line (inc (count (re-seq #"\n" (subs content 0 start))))
                       line-count (count (string/split-lines form))]
                   (range start-line (+ start-line line-count)))))
       set))

(defn conditional-translation-keys
  "Return translation keys referenced by supported `(if ...)` forms.

  This covers direct translation calls like `(t (if ...))` and `:i18n-key`
  payload bindings whose then/else branches both resolve to translation keys."
  [content]
  (->> [translation-call-if-prefix-pattern i18n-key-if-prefix-pattern]
       (mapcat #(matched-list-forms % "(if" content))
       (mapcat conditional-branch-keys)
       set))

(defn translation-call-fallback-keys
  "Return fallback translation keys referenced by supported `(t (or ...))`
  forms."
  [content]
  (->> (matched-list-forms translation-call-or-prefix-pattern "(or" content)
       (mapcat #(take-last 1 (keyword-literals-in-order %)))
       set))

(defn option-translation-keys
  "Return literal translation keys assigned to option key `option-key`.

  Example option keys include `:prompt-key` and `:title-key`."
  [content option-key]
  (let [pattern (re-pattern (str ":" (name option-key) "\\s+:[^ )}\\],\\s]+"))]
    (->> (re-seq pattern content)
         (mapcat #(keyword-literals % #{option-key}))
         set)))

(defn built-in-color-keys
  "Return `:color/*` translation keys derived from `built-in-colors`."
  [content]
  (if-let [[_ colors-content] (re-find built-in-colors-pattern content)]
    (->> (re-seq string-literal-pattern colors-content)
         (map second)
         (map #(keyword "color" %))
         set)
    #{}))

(defn left-sidebar-translation-keys
  "Return left sidebar navigation translation keys derived from tag nav entries
  in the left sidebar `navs` vector."
  [content]
  (if-let [[_ navs-content] (re-find left-sidebar-navs-pattern content)]
    (->> (re-seq tag-nav-key-pattern navs-content)
         (map second)
         (map #(keyword "nav" %))
         set)
    #{}))

(defn shortcut-command-keys
  "Return `:command.*` translation keys derived from built-in shortcut ids.

  Shortcut handler ids like `:shortcut.handler/*` are ignored because they are
  config group keys, not user-visible command ids."
  [content]
  (->> (re-seq shortcut-command-id-pattern content)
       (remove (fn [[_ shortcut-ns _]]
                 (string/starts-with? shortcut-ns "shortcut.handler")))
       (map (fn [[_ shortcut-ns shortcut-name]]
              (keyword (str "command." shortcut-ns) shortcut-name)))
       set))

(defn shortcut-category-translation-keys
  "Return `:shortcut.category/*` translation keys referenced in shortcut UI
  category declarations."
  [content]
  (->> (re-seq shortcut-category-key-pattern content)
       (map #(keyword (subs % 1)))
       set))

(defn derived-translation-keys
  "Return translation keys derived from supported non-literal UI patterns.

  This combines conditional calls, fallback calls, option keys, built-in color
  labels, left-sidebar derived nav labels, and shortcut category labels."
  [content]
  (->> [(conditional-translation-keys content)
        (translation-call-fallback-keys content)
        (option-translation-keys content :prompt-key)
        (option-translation-keys content :title-key)
        (built-in-color-keys content)
        (left-sidebar-translation-keys content)
        (shortcut-category-translation-keys content)]
       (apply concat)
       set))

(defn- placeholders-compatible?
  [default-value localized-value]
  (or (not (string? default-value))
      (not (string? localized-value))
      (= (translation-placeholders default-value)
         (translation-placeholders localized-value))))

(defn placeholder-mismatch-findings
  "Return localized string findings whose placeholder set diverges from
  English."
  [dicts]
  (let [en-dicts (:en dicts)]
    (->> (dissoc dicts :en)
         (mapcat
          (fn [[lang lang-dicts]]
            (keep (fn [[translation-key localized-value]]
                    (let [default-value (get en-dicts translation-key)]
                      (when (and (string? default-value)
                                 (string? localized-value)
                                 (not (placeholders-compatible? default-value localized-value)))
                        {:lang lang
                         :translation-key translation-key
                         :expected-placeholders (sort (translation-placeholders default-value))
                         :actual-placeholders (sort (translation-placeholders localized-value))
                         :default-value default-value
                         :localized-value localized-value})))
                  lang-dicts)))
         (sort-by (juxt :lang :translation-key))
         vec)))

(defn- rich-translation-value?
  "Return true when `value` preserves the rich zero-arg translation contract.

  Babashka reads dictionary `fn` forms as lists, while tests may pass actual
  function values, so both representations are treated as rich translations."
  [value]
  (or (fn? value)
      (and (seq? value)
           (= 'fn (first value))
           (= [] (second value)))))

(defn- value-kind
  [value]
  (cond
    (rich-translation-value? value) :fn
    (string? value) :string
    (nil? value) :nil
    :else :other))

(defn rich-translation-mismatch-findings
  "Return localized rich-translation findings whose value kind no longer
  matches the English zero-arg function contract."
  [dicts]
  (let [en-dicts (:en dicts)]
    (->> (dissoc dicts :en)
         (mapcat
          (fn [[lang lang-dicts]]
            (keep (fn [[translation-key default-value]]
                    (let [localized-present? (contains? lang-dicts translation-key)
                          localized-value (get lang-dicts translation-key)]
                      (when (and localized-present?
                                 (rich-translation-value? default-value)
                                 (not (rich-translation-value? localized-value)))
                        {:lang lang
                         :translation-key translation-key
                         :expected-value-kind :fn
                         :actual-value-kind (value-kind localized-value)})))
                  en-dicts)))
         (sort-by (juxt :lang :translation-key))
         vec)))
