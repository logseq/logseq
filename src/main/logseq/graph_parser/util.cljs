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
  "Copy of frontend.util/parse-int. Too basic to couple to main app"
  [x]
  (if (string? x)
    (js/parseInt x)
    x))

(defn safe-parse-int
  "Copy of frontend.util/safe-parse-int. Too basic to couple to main app"
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

;; TODO: Use update-keys once its available in cljs and nbb
(defn map-keys
  "Maps function `f` over the keys of map `m` to produce a new map."
  [f m]
  (reduce-kv
   (fn [m_ k v]
     (assoc m_ (f k) v)) {} m))

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

(defn page-name-sanity
  "Sanitize the page-name."
  ([page-name]
   (page-name-sanity page-name false))
  ([page-name replace-slash?]
   (let [page (some-> page-name
                      (remove-boundary-slashes)
                      (path-normalize))]
     (if replace-slash?
       (string/replace page #"/" "%2A")
       page))))

(defn page-name-sanity-lc
  "Sanitize the query string for a page name (mandate for :block/name)"
  [s]
  (page-name-sanity (string/lower-case s)))

(defn capitalize-all
  [s]
  (some->> (string/split s #" ")
           (map string/capitalize)
           (string/join " ")))
