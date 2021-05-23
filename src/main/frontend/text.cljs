(ns frontend.text
  (:require [frontend.config :as config]
            [frontend.util :as util]
            [clojure.string :as string]
            [clojure.set :as set]
            [medley.core :as medley]))

(defn page-ref?
  [s]
  (and
   (string? s)
   (string/starts-with? s "[[")
   (string/ends-with? s "]]")))

(defn block-ref?
  [s]
  (and
   (string? s)
   (string/starts-with? s "((")
   (string/ends-with? s "))")))

(defonce page-ref-re #"\[\[(.*?)\]\]")

(defonce page-ref-re-2 #"(\[\[.*?\]\])")

(defonce between-re #"\(between ([^\)]+)\)")

(defn page-ref-un-brackets!
  [s]
  (when (string? s)
    (if (page-ref? s)
      (subs s 2 (- (count s) 2))
      s)))

(defn block-ref-un-brackets!
  [s]
  (when (string? s)
    (if (block-ref? s)
      (subs s 2 (- (count s) 2))
      s)))

;; E.g "Foo Bar"
(defn sep-by-comma
  [s]
  (when s
    (some->>
     (string/split s #"[\,|，]{1}")
     (remove string/blank?)
     (map string/trim))))

(defn- not-matched-nested-pages
  [s]
  (and (string? s)
       (> (count (re-seq #"\[\[" s))
          (count (re-seq #"\]\]" s)))))

(defn- concat-nested-pages
  [coll]
  (first
   (reduce (fn [[acc not-matched-s] s]
             (cond
               (and not-matched-s (= s "]]"))
               [(conj acc (str not-matched-s s)) nil]

               not-matched-s
               [acc (str not-matched-s s)]

               (not-matched-nested-pages s)
               [acc s]

               :else
               [(conj acc s) not-matched-s])) [[] nil] coll)))

(defn split-page-refs-without-brackets
  ([s]
   (split-page-refs-without-brackets s true))
  ([s comma?]
   (cond
     (and (string? s)
            ;; Either a page ref, a tag or a comma separated collection
            (or (util/safe-re-find page-ref-re s)
                (util/safe-re-find (if comma? #"[\,|，|#]+" #"#") s)))
     (let [result (->> (string/split s page-ref-re-2)
                       (map (fn [s] (if (string/ends-with? (string/trimr s) "]],")
                                     (let [s (string/trimr s)]
                                       (subs s 0 (dec (count s))))
                                     s)))
                       concat-nested-pages
                       (remove string/blank?)
                       (mapcat (fn [s]
                                 (if (page-ref? s)
                                   [(page-ref-un-brackets! s)]
                                   (sep-by-comma s))))
                       (distinct))]
       (if (or (coll? result)
               (and (string? result)
                    (string/starts-with? result "#")))
         (let [result (if coll? result [result])
               result (map (fn [s] (string/replace s #"^#+" "")) result)]
           (set result))
         (first result)))

     :else
     s)))

(defn extract-level-spaces
  [text format]
  (if-not (string/blank? text)
    (let [pattern (util/format
                   "^[%s]+\\s?"
                   (config/get-block-pattern format))]
      (util/safe-re-find (re-pattern pattern) text))
    ""))

(defn- remove-level-space-aux!
  [text pattern space?]
  (let [pattern (util/format
                 (if space?
                   "^[%s]+\\s+"
                   "^[%s]+\\s?")
                 pattern)]
    (string/replace-first (string/triml text) (re-pattern pattern) "")))

(defn remove-level-spaces
  ([text format]
   (remove-level-spaces text format false))
  ([text format space?]
   (cond
     (string/blank? text)
     ""

     (and (= "markdown" (name format))
          (string/starts-with? text "---"))
     text

     :else
     (remove-level-space-aux! text (config/get-block-pattern format) space?))))

(defn build-data-value
  [col]
  (let [items (map (fn [item] (str "\"" item "\"")) col)]
    (util/format "[%s]"
                 (string/join ", " items))))

(defn image-link?
  [img-formats s]
  (some (fn [fmt] (util/safe-re-find (re-pattern (str "(?i)\\." fmt "(?:\\?([^#]*))?(?:#(.*))?$")) s)) img-formats))
