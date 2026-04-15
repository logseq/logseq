(ns logseq.tasks.lang-lint)

;; Matches numbered placeholders like `{1}` in translation strings.
(def ^:private translation-placeholder-pattern
  #"\{(\d+)\}")

(defn translation-placeholders
  "Return the placeholder indexes referenced by translation string `value`.

  Non-string values return an empty set."
  [value]
  (if (string? value)
    (->> (re-seq translation-placeholder-pattern value)
         (map second)
         set)
    #{}))

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
