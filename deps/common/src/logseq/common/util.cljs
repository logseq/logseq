(ns logseq.common.util
  "Util fns shared between the app. Util fns only rely on
  clojure standard libraries."
  (:require [cljs.reader :as reader]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [logseq.common.log :as log]
            [goog.string :as gstring]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]))

(defn safe-decode-uri-component
  [uri]
  (try
    (js/decodeURIComponent uri)
    (catch :default _
      (log/error :decode-uri-component-failed uri)
      uri)))

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
    (not (re-find #"[#\t\r\n]+" tag-name))))

(defn tag?
  "Whether `s` is a tag."
  [s]
  (and (string? s)
       (string/starts-with? s "#")
       (or
        (not (string/includes? s " "))
        (string/starts-with? s "#[[")
        (string/ends-with? s "]]"))))

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
  "Test if it is a `protocol://`-style URL.

   NOTE: Can not handle mailto: links, use this with caution."
  [s]
  (and (string? s)
       (try
         (not (contains? #{nil "null"} (.-origin (js/URL. s))))
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
    (->>
     (loop [others (rest parts)
            result [(first parts)]]
       (if (seq others)
         (let [prev (last result)]
           (recur (rest others)
                  (conj result (str prev "/" (first others)))))
         result))
     (map string/trim))))

(def url-encoded-pattern #"(?i)%[0-9a-f]{2}") ;; (?i) for case-insensitive mode

(defn page-name-sanity
  "Sanitize the page-name. Unify different diacritics and other visual differences.
   Two objectives:
   1. To be the same as in the filesystem;
   2. To be easier to search"
  [page-name]
  (some-> page-name
          (remove-boundary-slashes)
          (path-normalize)))

(defn page-name-sanity-lc
  "Sanitize the query string for a page name (mandate for :block/name)"
  [s]
  (page-name-sanity (string/lower-case s)))

(defn safe-page-name-sanity-lc
  [s]
  (if (string? s)
    (page-name-sanity-lc s) s))

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

(defn distinct-by-last-wins
     [f col]
     {:pre [(sequential? col)]}
     (reverse (distinct-by f (reverse col))))

(defn normalize-format
  [format]
  (case (keyword format)
    :md :markdown
    ;; default
    (keyword format)))

(defn path->file-ext
  [path-or-file-name]
  (let [last-part (last (string/split path-or-file-name #"/"))]
    (second (re-find #"(?:\.)(\w+)[^.]*$" last-part))))

(defn get-format
  "File path to format keyword, :org, :markdown, etc."
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

(defn safe-read-string
  ([content]
   (safe-read-string {} content))
  ([opts content]
   (try
     (reader/read-string opts content)
     (catch :default e
       (log/error :parse/read-string-failed e)
       {}))))

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

(defn safe-re-find
  {:malli/schema [:=> [:cat :any :string] [:or :nil :string [:vector [:maybe :string]]]]}
  [pattern s]
  (when-not (string? s)
       ;; TODO: sentry
    (js/console.trace))
  (when (string? s)
    (re-find pattern s)))

(def uuid-pattern "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
(defonce exactly-uuid-pattern (re-pattern (str "(?i)^" uuid-pattern "$")))

(defn uuid-string?
  {:malli/schema [:=> [:cat :string] :boolean]}
  [s]
  (boolean (safe-re-find exactly-uuid-pattern s)))

(defn format
  [fmt & args]
  (apply gstring/format fmt args))

(defn remove-first [pred coll]
  ((fn inner [coll]
     (lazy-seq
      (when-let [[x & xs] (seq coll)]
        (if (pred x)
          xs
          (cons x (inner xs))))))
   coll))

(defn concat-without-nil
  [& cols]
  (->> (apply concat cols)
       (remove nil?)))

(defn time-ms
  "Current time in milliseconds"
  []
  (tc/to-long (t/now)))

(defn get-page-title
  [page]
  (or (:block/title page)
      (:block/name page)))

(defn string-join-path
  #_:clj-kondo/ignore
  "Replace all `strings/join` used to construct paths with this function to reduce lint output.
  https://github.com/logseq/logseq/pull/8679"
  [parts]
  (string/join "/" parts))

(def escape-chars "[]{}().+*?|$")

(defn escape-regex-chars
  "Escapes characters in string `old-value"
  [old-value]
  (reduce (fn [acc escape-char]
            (string/replace acc escape-char (str "\\" escape-char)))
          old-value escape-chars))

(defn replace-ignore-case
  [s old-value new-value]
  (string/replace s (re-pattern (str "(?i)" (escape-regex-chars old-value))) new-value))

(defn replace-first-ignore-case
  [s old-value new-value]
  (string/replace-first s (re-pattern (str "(?i)" (escape-regex-chars old-value))) new-value))


(defn sort-coll-by-dependency
  "Sort the elements in the collection based on dependencies.
coll:  [{:id 1 :depend-on 2} {:id 2 :depend-on 3} {:id 3}]
get-elem-id-fn: :id
get-elem-dep-id-fn :depend-on
return: [{:id 3} {:id 2 :depend-on 3} {:id 1 :depend-on 2}]"
  [get-elem-id-fn get-elem-dep-id-fn coll]
  (let [id->elem (into {} (keep (juxt get-elem-id-fn identity)) coll)
        id->dep-id (into {} (keep (juxt get-elem-id-fn get-elem-dep-id-fn)) coll)
        all-ids (set (keys id->dep-id))
        seen-ids (volatile! #{})        ; to check dep-cycle
        sorted-ids
        (loop [r []
               rest-ids all-ids
               id (first rest-ids)]
          (if-not id
            r
            (if-let [dep-id (id->dep-id id)]
              (let [next-id (get rest-ids dep-id)]
                (if (and next-id
                         ;; if found dep-cycle, break it
                         (not (contains? @seen-ids next-id)))
                  (do (vswap! seen-ids conj next-id)
                      (recur r rest-ids next-id))
                  (let [rest-ids* (disj rest-ids id)]
                    (vreset! seen-ids #{})
                    (recur (conj r id) rest-ids* (first rest-ids*)))))
              ;; not found dep-id, so this id can be put into result now
              (let [rest-ids* (disj rest-ids id)]
                (vreset! seen-ids #{})
                (recur (conj r id) rest-ids* (first rest-ids*))))))]
    (mapv id->elem sorted-ids)))