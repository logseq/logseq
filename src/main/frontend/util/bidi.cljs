(ns frontend.util.bidi
  (:require [cljs.cache :as cache]
            [clojure.string :as string]
            [frontend.common.cache :as common.cache]
            [goog.i18n.bidi :as bidi]
            [logseq.graph-parser.mldoc :as gp-mldoc]))

(defn- estimated-dir->text-dir
  [estimated-dir]
  (cond
    (number? estimated-dir)
    (cond
      (neg? estimated-dir) "rtl"
      (pos? estimated-dir) "ltr"
      :else "auto")

    :else "auto"))

(defn- non-blank-string?
  [value]
  (and (string? value)
       (not (string/blank? value))))

(defn- first-non-blank-string
  [values]
  (some (fn [value]
          (when (non-blank-string? value)
            value))
        values))

(def ^:private checkbox-prefix-regex
  #"^\[(?: |x|X|-)\]\s*")

(def ^:private ordered-list-prefix-regex
  #"^\d+[.)]\s+")

(def ^:private task-marker-prefix-regex
  #"(?i)^(?:TODO|NOW|LATER|DOING|DONE|WAITING|CANCELED|CANCELLED)\b[:：]?\s*")

(def ^:private property-prefix-regex
  #"^[^:\n]{1,80}::\s*")

(def ^:private page-ref-wrapper-regex
  #"^\[\[([^\]]+)\]\]$")

(def ^:private markdown-link-wrapper-regex
  #"^\[([^\]]+)\]\((.+)\)$")

(def ^:private leading-neutral-prefix-regex
  #"^[\s\u2022>*-]+")

(def ^:private maybe-inline-markup-regex
  #"[()\[\]]")

(def ^:private max-dir-sample-length 512)
(def ^:private max-first-strong-scan-length 256)

(defonce ^:private markdown-inline-parse-config
  (gp-mldoc/default-config :markdown))

(defonce ^:private *text-dir-cache
  (volatile! (cache/lru-cache-factory {} :threshold 2000)))

(defn- sample-dir-text
  [text]
  (let [text (or text "")]
    (if (> (count text) max-dir-sample-length)
      (subs text 0 max-dir-sample-length)
      text)))

(defn- unwrap-dir-text-once
  [text]
  (or (second (re-matches page-ref-wrapper-regex text))
      (second (re-matches markdown-link-wrapper-regex text))
      text))

(defn- strip-dir-prefixes-once
  [text]
  (-> text
      string/triml
      (string/replace leading-neutral-prefix-regex "")
      (string/replace checkbox-prefix-regex "")
      (string/replace ordered-list-prefix-regex "")
      (string/replace task-marker-prefix-regex "")
      (string/replace property-prefix-regex "")))

(defn- normalize-text-for-dir
  [sampled-text]
  (let [stripped (strip-dir-prefixes-once sampled-text)
        unwrapped (-> stripped unwrap-dir-text-once string/trim)]
    (if (= stripped unwrapped)
      unwrapped
      (-> unwrapped strip-dir-prefixes-once string/trim))))

(defn- infer-text-dir-helper
  [sampled-text]
  (let [text (normalize-text-for-dir sampled-text)
        starts-rtl? (try
                      (bidi/startsWithRtl text false)
                      (catch :default _ false))
        starts-ltr? (try
                      (bidi/startsWithLtr text false)
                      (catch :default _ false))]
    (cond
      starts-rtl? "rtl"
      starts-ltr? "ltr"
      :else (let [estimated-dir (try
                                   (bidi/estimateDirection text false)
                                   (catch :default _ nil))]
              (estimated-dir->text-dir estimated-dir)))))

(defn- first-strong-char-dir
  [text]
  (let [length (min (count text) max-first-strong-scan-length)]
    (loop [idx 0]
      (if (>= idx length)
        nil
        (let [ch (subs text idx (inc idx))
              rtl? (try
                     (bidi/startsWithRtl ch false)
                     (catch :default _ false))
              ltr? (try
                     (bidi/startsWithLtr ch false)
                     (catch :default _ false))]
          (cond
            rtl? "rtl"
            ltr? "ltr"
            :else (recur (inc idx))))))))

(defn- unwrap-page-ref-content
  [content]
  (if-let [match (and (string? content)
                      (re-matches page-ref-wrapper-regex content))]
    (second match)
    content))

(defn- extract-visible-inline-text
  [inline-ast]
  (if-not (coll? inline-ast)
    ""
    (let [parts (reduce
                 (fn [result node]
                   (if-not (vector? node)
                     result
                     (let [typ (first node)
                           payload (second node)]
                       (case typ
                         "Plain"
                         (if (non-blank-string? payload)
                           (conj result payload)
                           result)

                         "Nested_link"
                         (let [content (some-> payload :content unwrap-page-ref-content)]
                           (if (non-blank-string? content)
                             (conj result content)
                             result))

                         result))))
                 []
                 (tree-seq coll? seq inline-ast))]
      (string/trim (string/join " " parts)))))

(defn- infer-text-dir-with-fallback
  [sampled-text]
  (let [text (normalize-text-for-dir sampled-text)
        first-strong-dir (first-strong-char-dir text)
        inferred-dir (or first-strong-dir
                         (infer-text-dir-helper text))
        should-parse? (and (= inferred-dir "auto")
                           (re-find maybe-inline-markup-regex text))]
    (cond
      (not should-parse?)
      inferred-dir

      :else
      (let [inline-ast (gp-mldoc/inline->edn text markdown-inline-parse-config)
            visible-text (-> inline-ast
                             extract-visible-inline-text
                             normalize-text-for-dir)
            fallback-first-strong-dir (first-strong-char-dir visible-text)]
        (or fallback-first-strong-dir
            (infer-text-dir-helper visible-text))))))

(def ^:private infer-text-dir-cached
  (common.cache/cache-fn
   *text-dir-cache
   (fn [text]
     (let [sampled-text (sample-dir-text text)]
       [[sampled-text] [sampled-text]]))
   infer-text-dir-with-fallback))

(defn row-dir-source-text
  [{:keys [editing? edit-content title original-name name raw-title]}]
  (if (and editing? (non-blank-string? edit-content))
    edit-content
    (or (first-non-blank-string [title original-name name raw-title])
        "")))

(defn infer-text-dir
  [text]
  (infer-text-dir-cached text))
