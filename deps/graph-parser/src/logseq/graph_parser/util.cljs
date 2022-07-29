(ns logseq.graph-parser.util
  "Util fns shared between graph-parser and rest of app. Util fns only rely on
  clojure standard libraries."
  (:require [clojure.walk :as walk]
            [clojure.string :as string]
            [clojure.edn :as edn]))

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
    (not (re-find #"[# \t\r\n]+" tag-name))))

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

(defn url?
  [s]
  (and (string? s)
       (try
         (js/URL. s)
         true
         (catch :default _e
           false))))

(defn json->clj
  [json-string]
  (-> json-string
      (js/JSON.parse)
      (js->clj :keywordize-keys true)))

(defn zero-pad
  "Copy of frontend.util/zero-pad. Too basic to couple to main app"
  [n]
  (if (< n 10)
    (str "0" n)
    (str n)))

(defn get-file-ext
  "Copy of frontend.util/get-file-ext. Too basic to couple to main app"
  [file]
  (and
   (string? file)
   (string/includes? file ".")
   (some-> (last (string/split file #"\.")) string/lower-case)))

(defn remove-boundary-slashes
  [s]
  (when (string? s)
    (let [s (if (= \/ (first s))
              (subs s 1)
              s)]
      (if (= \/ (last s))
        (subs s 0 (dec (count s)))
        s))))

(defn split-namespace-pages
  [title]
  (let [parts (string/split title "/")]
    (loop [others (rest parts)
           result [(first parts)]]
      (if (seq others)
        (let [prev (last result)]
          (recur (rest others)
                 (conj result (str prev "/" (first others)))))
        result))))

;; Should not contains %
;; Should not contains any reserved character
(def PERCENT-ESCAPE-CODE "_0x")

(def PERCENT-ESCAPE-CODE-PATTERN (re-pattern PERCENT-ESCAPE-CODE))

(def PERCENT-ESCAPE-URLENCODED-PATTERN (re-pattern (str PERCENT-ESCAPE-CODE "[0-9A-Fa-f]{2}")))

(defn escape-lowbar
  "Escape when ambiguation happens"
  [input]
  (string/replace input #"_" "%5F"))

(defn escape-namespace-slashes-and-multilowbars
  "Encode slashes / as double lowbars __
   Don't encode _ in most cases, except causing ambiguation"
  [string]
  (-> string
      ;; The ambiguation is caused by the unbounded _ (possible continuation of `_`s)
      (string/replace PERCENT-ESCAPE-CODE-PATTERN escape-lowbar)
      (string/replace #"__" escape-lowbar)
      (string/replace #"_/" escape-lowbar)
      (string/replace #"/_" escape-lowbar)
      ;; After ambiguaous _ encoded, encode the slash
      (string/replace #"/" "__")))

(defn decode-namespace-underlines
  "Decode namespace underlines to slashed;
   If continuous underlines, only decode at start;
   Having empty namespace is invalid."
  [string]
  (string/replace string #"__" "/"))

(defn escape-urlencode-percent-signs
  [string]
  (string/replace string #"%" PERCENT-ESCAPE-CODE))

(defn- decode-urlencode-byted
  [string]
  (string/replace string PERCENT-ESCAPE-CODE "%"))

(defn decode-urlencode-escaped
"Only decode when the percent sign escaped pattern is followed by a valid ascii hex code"
  [string]
  (string/replace string PERCENT-ESCAPE-URLENCODED-PATTERN decode-urlencode-byted))

(defn page-name-sanity
  "Sanitize the page-name. Unify different diacritics and other visual differences.
   Two objectives:
   1. To be the same as in the filesystem;
   2. To be easier to search"
  [page-name]
  (some-> page-name
          (remove-boundary-slashes)
          (path-normalize)))

(def windows-reserved-chars ":\\*\\?\"<>|")

(def android-reserved-chars "\\#|%")

(def other-reserved-chars "%") ;; reserved-for url encode

(def reserved-chars-pattern
  (re-pattern (str "["
                   windows-reserved-chars
                   android-reserved-chars
                   other-reserved-chars
                   "]+")))

(defn url-encode
  "This URL encoding is for filename escaping in Logseq"
  ;; Don't encode `/`, they will be handled in `escape-namespace-slashes-and-multilowbars`
  ;; Don't encode `_` except the cases mentioned in `escape-namespace-slashes-and-multilowbars`
  [string]
  (some-> string str
          (js/encodeURIComponent)
          (string/replace #"\*" "%2A")))

(defn safe-url-decode
  [string]
  (if (string/includes? string "%")
    (try (some-> string str (js/decodeURIComponent))
         (catch js/Error _
           string))
    string))

(defn file-name-sanity
  "Sanitize page-name for file name (strict), for file name in file writing."
  [title]
  (some-> title
          page-name-sanity
          (string/replace reserved-chars-pattern url-encode)
          (escape-namespace-slashes-and-multilowbars)
          (escape-urlencode-percent-signs)))

(defn validize-namespaces
  "Remove those empty namespaces from title to make it a valid page name."
  [title]
  (->> (string/split title "/")
       (remove empty?)
       (string/join "/")))

(defn page-name-parsing
  "Parse the file name back into page name"
  [file-name]
  (some-> file-name
          (decode-urlencode-escaped)
          (decode-namespace-underlines)
          (safe-url-decode)
          (validize-namespaces)))

(defn page-name-sanity-lc
  "Sanitize the query string for a page name (mandate for :block/name)"
  [s]
  (page-name-sanity (string/lower-case s)))

(defn capitalize-all
  [s]
  (some->> (string/split s #" ")
           (map string/capitalize)
           (string/join " ")))

(defn distinct-by
  "Copy of frontend.util/distinct-by. Too basic to couple to main app"
  [f col]
  (reduce
   (fn [acc x]
     (if (some #(= (f x) (f %)) acc)
       acc
       (vec (conj acc x))))
   []
   col))

(defn normalize-format
  [format]
  (case (keyword format)
    :md :markdown
    :asciidoc :adoc
    ;; default
    (keyword format)))

(defn get-format
  [file]
  (when file
    (normalize-format (keyword (string/lower-case (last (string/split file #"\.")))))))

(defn valid-edn-keyword?
  "Determine if string is a valid edn keyword"
  [s]
  (try
    (boolean (and (= \: (first s))
                  (edn/read-string (str "{" s " nil}"))))
    (catch :default _
      false)))
