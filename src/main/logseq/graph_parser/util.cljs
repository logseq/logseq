(ns ^:nbb-compatible logseq.graph-parser.util
  "Util fns shared between graph-parser and rest of app. Util fns only rely on
  clojure standard libraries."
  (:require [clojure.walk :as walk]
            [clojure.string :as string]))

(def uuid-pattern "[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}")
(defonce exactly-uuid-pattern (re-pattern (str "(?i)^" uuid-pattern "$")))

(defn safe-re-find
  [pattern s]
  (when-not (string? s)
    ;; TODO: sentry
    (js/console.trace))
  (when (string? s)
    (re-find pattern s)))

(defn uuid-string?
  [s]
  (safe-re-find exactly-uuid-pattern s))

(defn path-normalize
  "Normalize file path (for reading paths from FS, not required by writting)"
  [s]
  (.normalize s "NFC"))

(defn remove-nils
  "remove pairs of key-value that has nil value from a (possibly nested) map."
  [nm]
  (walk/postwalk
   (fn [el]
     (if (map? el)
       (into {} (remove (comp nil? second)) el)
       el))
   nm))

(defn split-first [pattern s]
  (when-let [first-index (string/index-of s pattern)]
    [(subs s 0 first-index)
     (subs s (+ first-index (count pattern)) (count s))]))

(defn split-last [pattern s]
  (when-let [last-index (string/last-index-of s pattern)]
    [(subs s 0 last-index)
     (subs s (+ last-index (count pattern)) (count s))]))

(defn tag-valid?
  [tag-name]
  (when (string? tag-name)
    (not (safe-re-find #"[# \t\r\n]+" tag-name))))

(defn safe-subs
  ([s start]
   (let [c (count s)]
     (safe-subs s start c)))
  ([s start end]
   (let [c (count s)]
     (subs s (min c start) (min c end)))))

(defn unquote-string
  [v]
  (string/trim (subs v 1 (dec (count v)))))

(defn wrapped-by-quotes?
  [v]
  (and (string? v) (>= (count v) 2) (= "\"" (first v) (last v))))

(defn parse-int
  "Copy of frontend.util/parse-int. Don't want to couple to main app too much"
  [x]
  (if (string? x)
    (js/parseInt x)
    x))

(defn safe-parse-int
  "Copy of frontend.util/safe-parse-int. Don't want to couple to main app too much"
  [x]
  (let [result (parse-int x)]
    (if (js/isNaN result)
      nil
      result)))

(defn url?
  [s]
  (and (string? s)
       (try
         (js/URL. s)
         true
         (catch js/Error _e
           false))))

(defn json->clj
  [json-string]
  (-> json-string
      (js/JSON.parse)
      (js->clj :keywordize-keys true)))
