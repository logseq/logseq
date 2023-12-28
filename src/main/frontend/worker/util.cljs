(ns frontend.worker.util
  "Worker utils"
  (:require [clojure.string :as string]
            ["remove-accents" :as removeAccents]
            [medley.core :as medley]
            [logseq.graph-parser.util :as gp-util]
            [goog.string :as gstring]))

(defonce db-version-prefix "logseq_db_")
(defonce local-db-prefix "logseq_local_")
(defn db-based-graph?
  [s]
  (boolean
   (and (string? s)
        (string/starts-with? s db-version-prefix))))
(defn local-file-based-graph?
  [s]
  (and (string? s)
       (string/starts-with? s local-db-prefix)))

(defn search-normalize
     "Normalize string for searching (loose)"
     [s remove-accents?]
     (when s
       (let [normalize-str (.normalize (string/lower-case s) "NFKC")]
         (if remove-accents?
           (removeAccents normalize-str)
           normalize-str))))

(defn safe-re-find
  {:malli/schema [:=> [:cat :any :string] [:or :nil :string [:vector [:maybe :string]]]]}
  [pattern s]
  (when-not (string? s)
       ;; TODO: sentry
    (js/console.trace))
  (when (string? s)
    (re-find pattern s)))

(def uuid-pattern "[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}")
(defonce exactly-uuid-pattern (re-pattern (str "(?i)^" uuid-pattern "$")))

(defn uuid-string?
  {:malli/schema [:=> [:cat :string] :boolean]}
  [s]
  (boolean (safe-re-find exactly-uuid-pattern s)))

(def page-name-sanity-lc
  "Delegate to gp-util to loosely couple app usages to graph-parser"
  gp-util/page-name-sanity-lc)

(defn safe-page-name-sanity-lc
  [s]
  (if (string? s)
    (page-name-sanity-lc s) s))

(defn distinct-by
  [f col]
  (medley/distinct-by f (seq col)))

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
