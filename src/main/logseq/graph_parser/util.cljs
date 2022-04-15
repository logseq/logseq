(ns logseq.graph-parser.util
  "General util fns that only rely on clojure core fns. Fns from frontend.util"
  (:require [clojure.walk :as walk]
            [clojure.string :as string]))

(def uuid-pattern "[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}")
(defonce exactly-uuid-pattern (re-pattern (str "(?i)^" uuid-pattern "$")))

(defn safe-re-find
  [pattern s]
  (when (string? s)
    (re-find pattern s)))

(defn uuid-string?
  [s]
  (safe-re-find exactly-uuid-pattern s))

(defn remove-nils
  "remove pairs of key-value that has nil value from a (possibly nested) map."
  [nm]
  (walk/postwalk
   (fn [el]
     (if (map? el)
       (into {} (remove (comp nil? second)) el)
       el))
   nm))

(defn path-normalize
  "Normalize file path (for reading paths from FS, not required by writting)"
  [s]
  (.normalize s "NFC"))

(defn distinct-by
  [f col]
  (reduce
   (fn [acc x]
     (if (some #(= (f x) (f %)) acc)
       acc
       (vec (conj acc x))))
   []
   col))

(defn split-first [pattern s]
  (when-let [first-index (string/index-of s pattern)]
    [(subs s 0 first-index)
     (subs s (+ first-index (count pattern)) (count s))]))

(defn split-last [pattern s]
  (when-let [last-index (string/last-index-of s pattern)]
    [(subs s 0 last-index)
     (subs s (+ last-index (count pattern)) (count s))]))

(defn get-file-ext
  [file]
  (and
   (string? file)
   (string/includes? file ".")
   (some-> (last (string/split file #"\.")) string/lower-case)))

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

(defn remove-boundary-slashes
  [s]
  (when (string? s)
    (let [s (if (= \/ (first s))
              (subs s 1)
              s)]
      (if (= \/ (last s))
        (subs s 0 (dec (count s)))
        s))))

(def windows-reserved-chars #"[:\\*\\?\"<>|]+")

(defn page-name-sanity
  "Sanitize the page-name for file name (strict), for file writting"
  ([page-name]
   (page-name-sanity page-name false))
  ([page-name replace-slash?]
   (let [page (some-> page-name
                      (remove-boundary-slashes)
                      ;; Windows reserved path characters
                      (string/replace windows-reserved-chars "_")
                      ;; for android filesystem compatiblity
                      (string/replace #"[\\#|%]+" "_")
                      (path-normalize))]
     (if replace-slash?
       (string/replace page #"/" ".")
       page))))

(defn page-name-sanity-lc
  "Sanitize the query string for a page name (mandate for :block/name)"
  [s]
  (page-name-sanity (string/lower-case s)))

(defn zero-pad
  [n]
  (if (< n 10)
    (str "0" n)
    (str n)))

(defn url?
  [s]
  (and (string? s)
       (try
         (js/URL. s)
         true
         (catch js/Error _e
           false))))

(defn parse-int
  [x]
  (if (string? x)
    (js/parseInt x)
    x))

(defn safe-parse-int
  [x]
  (let [result (parse-int x)]
    (if (js/isNaN result)
      nil
      result)))

(defn wrapped-by-quotes?
  [v]
  (and (string? v) (>= (count v) 2) (= "\"" (first v) (last v))))

(defn unquote-string
  [v]
  (string/trim (subs v 1 (dec (count v)))))

(defn tag-valid?
  [tag-name]
  (when (string? tag-name)
    (not (safe-re-find #"[# \t\r\n]+" tag-name))))

;; TODO: Use medley instead
(defn map-keys
  "Maps function `f` over the keys of map `m` to produce a new map."
  [f m]
  (reduce-kv
   (fn [m_ k v]
     (assoc m_ (f k) v)) {} m))

(defn safe-subs
  ([s start]
   (let [c (count s)]
     (safe-subs s start c)))
  ([s start end]
   (let [c (count s)]
     (subs s (min c start) (min c end)))))

(defn json->clj
  ([json-string]
   (json->clj json-string false))
  ([json-string kebab?]
   (let [m (-> json-string
               (js/JSON.parse)
               (js->clj :keywordize-keys true))]
     (if kebab?
       m
       #_(cske/transform-keys csk/->kebab-case-keyword m)
       m))))
