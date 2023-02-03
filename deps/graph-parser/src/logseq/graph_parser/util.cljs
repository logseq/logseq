(ns logseq.graph-parser.util
  "Util fns shared between graph-parser and rest of app. Util fns only rely on
  clojure standard libraries."
  (:require [cljs.reader :as reader]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [logseq.graph-parser.log :as log]))

(defn safe-decode-uri-component
  [uri]
  (try
    (js/decodeURIComponent uri)
    (catch :default _
      (log/error :decode-uri-component-failed uri)
      uri)))

(defn safe-url-decode
  [string]
  (if (string/includes? string "%")
    (some-> string str safe-decode-uri-component)
    string))

(defn path-normalize
  "Normalize file path (for reading paths from FS, not required by writing)
   Keep capitalization senstivity"
  [s]
  (.normalize s "NFC"))

(defn remove-nils
  "remove pairs of key-value that has nil value from a (possibly nested) map or
  coll of maps."
  [nm]
  (walk/postwalk
   (fn [el]
     (if (map? el)
       (into {} (remove (comp nil? second)) el)
       el))
   nm))

(defn remove-nils-non-nested
  "remove pairs of key-value that has nil value from a map (nested not supported)."
  [nm]
  (into {} (remove (comp nil? second)) nm))

(defn fast-remove-nils
  "remove pairs of key-value that has nil value from a coll of maps."
  [nm]
  (keep (fn [m] (if (map? m) (remove-nils-non-nested m) m)) nm))

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

(defn decode-namespace-underlines
  "Decode namespace underlines to slashed;
   If continuous underlines, only decode at start;
   Having empty namespace is invalid."
  [string]
  (string/replace string "___" "/"))

(defn page-name-sanity
  "Sanitize the page-name. Unify different diacritics and other visual differences.
   Two objectives:
   1. To be the same as in the filesystem;
   2. To be easier to search"
  [page-name]
  (some-> page-name
          (remove-boundary-slashes)
          (path-normalize)))

(defn make-valid-namespaces
  "Remove those empty namespaces from title to make it a valid page name."
  [title]
  (->> (string/split title "/")
       (remove empty?)
       (string/join "/")))

(def url-encoded-pattern #"(?i)%[0-9a-f]{2}") ;; (?i) for case-insensitive mode

(defn- tri-lb-title-parsing
  "Parsing file name under the new file name format
   Avoid calling directly"
  [file-name]
  (some-> file-name
          (decode-namespace-underlines)
          (string/replace url-encoded-pattern safe-url-decode)
          (make-valid-namespaces)))

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
  "Copy from medley"
  [f coll]
  (let [step (fn step [xs seen]
               (lazy-seq
                ((fn [[x :as xs] seen]
                   (when-let [s (seq xs)]
                     (let [fx (f x)]
                       (if (contains? seen fx)
                         (recur (rest s) seen)
                         (cons x (step (rest s) (conj seen fx)))))))
                 xs seen)))]
    (step (seq coll) #{})))

(defn normalize-format
  [format]
  (case (keyword format)
    :md :markdown
    ;; default
    (keyword format)))

(defn path->file-name
  ;; Only for interal paths, as they are converted to POXIS already
  ;; https://github.com/logseq/logseq/blob/48b8e54e0fdd8fbd2c5d25b7f1912efef8814714/deps/graph-parser/src/logseq/graph_parser/extract.cljc#L32
  ;; Should be converted to POXIS first for external paths
  [path]
  (if (string/includes? path "/")
    (last (split-last "/" path))
    path))

(defn path->file-body
  [path]
  (when-let [file-name (path->file-name path)]
    (if (string/includes? file-name ".")
      (first (split-last "." file-name))
      file-name)))

(defn path->file-ext
  [path-or-file-name]
  (second (re-find #"(?:\.)(\w+)[^.]*$" path-or-file-name)))

(defn get-format
  [file]
  (when file
    (normalize-format (keyword (some-> (path->file-ext file) string/lower-case)))))

(defn get-file-ext
  "Copy of frontend.util/get-file-ext. Too basic to couple to main app"
  [file]
  (and
   (string? file)
   (string/includes? file ".")
   (some-> (path->file-ext file) string/lower-case)))

(defn valid-edn-keyword?
  "Determine if string is a valid edn keyword"
  [s]
  (try
    (boolean (and (= \: (first s))
                  (edn/read-string (str "{" s " nil}"))))
    (catch :default _
      false)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;     Keep for backward compatibility     ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Rule of dir-ver 0
;; Source: https://github.com/logseq/logseq/blob/e7110eea6790eda5861fdedb6b02c2a78b504cd9/deps/graph-parser/src/logseq/graph_parser/extract.cljc#L35
(defn legacy-title-parsing
  [file-name-body]
  (let [title (string/replace file-name-body "." "/")]
    (or (safe-decode-uri-component title) title)))

;; Register sanitization / parsing fns in:
;; logseq.graph-parser.util (parsing only)
;; frontend.util.fs         (sanitization only)
;; frontend.handler.conversion (both)
(defn title-parsing
  "Convert file name in the given file name format to page title"
  [file-name-body filename-format]
  (case filename-format
    :triple-lowbar (tri-lb-title-parsing file-name-body)
    (legacy-title-parsing file-name-body)))

(defn safe-read-string
  [content]
  (try
    (reader/read-string content)
    (catch :default e
      (log/error :parse/read-string-failed e)
      {})))

;; Copied from Medley
;; https://github.com/weavejester/medley/blob/d1e00337cf6c0843fb6547aadf9ad78d981bfae5/src/medley/core.cljc#L22
(defn dissoc-in
  "Dissociate a value in a nested associative structure, identified by a sequence
  of keys. Any collections left empty by the operation will be dissociated from
  their containing structures."
  ([m ks]
   (if-let [[k & ks] (seq ks)]
     (if (seq ks)
       (let [v (dissoc-in (get m k) ks)]
         (if (empty? v)
           (dissoc m k)
           (assoc m k v)))
       (dissoc m k))
     m))
  ([m ks & kss]
   (if-let [[ks' & kss] (seq kss)]
     (recur (dissoc-in m ks) ks' kss)
     (dissoc-in m ks))))
