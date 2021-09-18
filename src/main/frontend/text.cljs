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

(defn extract-page-name-from-ref
  [ref]
  (when-not (string/blank? ref)
    (if-let [matches (or (re-matches #"\[\[file:.+\]\[(.+)\]\]" ref)
                         (re-matches #"\[\[(.+)\]\]" ref))]
      (string/trim (last matches))
      ref)))

(defonce page-ref-re #"\[\[(.*?)\]\]")

(defonce page-ref-re-2 #"(\[\[.*?\]\])")

(def page-ref-re-without-nested #"\[\[([^\[\]]+)\]\]")

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

(defn- ref-matched?
  [s]
  (let [x (re-seq #"\[\[" s)
        y (re-seq #"\]\]" s)]
    (and (> (count x) 0) (= (count x) (count y)))))

(defn- concat-nested-pages
  [coll]
  (first
   (reduce (fn [[acc not-matched-s] s]
             (cond
               (and not-matched-s (= s "]]"))
               (let [s' (str not-matched-s s)]
                 (if (ref-matched? s')
                   [(conj acc s') nil]
                   [acc s']))

               not-matched-s
               [acc (str not-matched-s s)]

               (not-matched-nested-pages s)
               [acc s]

               :else
               [(conj acc s) not-matched-s])) [[] nil] coll)))

(defn- sep-by-quotes
  [s]
  (string/split s #"(\"[^\"]*\")"))

(def markdown-link #"\[([^\[]+)\](\(.*\))")
(defn split-page-refs-without-brackets
  ([s]
   (split-page-refs-without-brackets s {}))
  ([s {:keys [un-brackets?]
       :or {un-brackets? true}}]
   (cond
     (and (string? s) (util/wrapped-by-quotes? s))
     (util/unquote-string s)

     (and (string? s) (re-find markdown-link s))
     s

     (and (string? s)
            ;; Either a page ref, a tag or a comma separated collection
            (or (util/safe-re-find page-ref-re s)
                (util/safe-re-find #"[\,|，|#|\"]+" s)))
     (let [result (->> (sep-by-quotes s)
                       (mapcat
                        (fn [s]
                          (when-not (util/wrapped-by-quotes? (string/trim s))
                            (string/split s page-ref-re-2))))
                       (mapcat (fn [s] (cond
                                        (util/wrapped-by-quotes? s)
                                        nil

                                        (string/includes? (string/trimr s) "]],")
                                        (let [idx (string/index-of s "]],")]
                                          [(subs s 0 idx)
                                           "]]"
                                           (subs s (+ idx 3))])

                                        :else
                                        [s])))
                       (remove #(= % ""))
                       (mapcat (fn [s] (if (string/ends-with? s "]]")
                                        [(subs s 0 (- (count s) 2))
                                         "]]"]
                                        [s])))
                       concat-nested-pages
                       (remove string/blank?)
                       (mapcat (fn [s]
                                 (cond
                                   (util/wrapped-by-quotes? s)
                                   nil

                                   (page-ref? s)
                                   [(if un-brackets? (page-ref-un-brackets! s) s)]

                                   :else
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
   (when format
     (cond
       (string/blank? text)
       ""

       (and (= "markdown" (name format))
            (string/starts-with? text "---"))
       text

       :else
       (remove-level-space-aux! text (config/get-block-pattern format) space?)))))

(defn build-data-value
  [col]
  (let [items (map (fn [item] (str "\"" item "\"")) col)]
    (util/format "[%s]"
                 (string/join ", " items))))

(defn image-link?
  [img-formats s]
  (some (fn [fmt] (util/safe-re-find (re-pattern (str "(?i)\\." fmt "(?:\\?([^#]*))?(?:#(.*))?$")) s)) img-formats))

(defn scheduled-deadline-dash->star
  [content]
  (-> content
      (string/replace "- TODO -> DONE [" "* TODO -> DONE [")
      (string/replace "- DOING -> DONE [" "* DOING -> DONE [")
      (string/replace "- LATER -> DONE [" "* LATER -> DONE [")
      (string/replace "- NOW -> DONE [" "* NOW -> DONE [")))

(defn remove-indentation-spaces
  [s level remove-first-line?]
  (let [lines (string/split-lines s)
        [f & r] lines
        body (map (fn [line]
                    (if (string/blank? (util/safe-subs line 0 level))
                      (util/safe-subs line level)
                      line))
               (if remove-first-line? lines r))
        content (if remove-first-line? body (cons f body))]
    (string/join "\n" content)))

(defn namespace-page?
  [p]
  (and (not (string/starts-with? p "../"))
       (not (string/starts-with? p "./"))
       (not (string/starts-with? p "http"))
       (not
        (when-let [last-part (last (string/split p #"/"))]
          ;; a file
          (string/includes? last-part ".")))))

(defn add-timestamp
  [content key value]
  (let [new-line (str (string/upper-case key) ": " value)
        lines (string/split-lines content)
        new-lines (map (fn [line]
                         (string/trim
                          (if (string/starts-with? (string/lower-case line) key)
                            new-line
                            line)))
                    lines)
        new-lines (if (not= (map string/trim lines) new-lines)
                    new-lines
                    (cons (first new-lines) ;; title
                          (cons
                           new-line
                           (rest new-lines))))]
    (string/join "\n" new-lines)))

(defn remove-timestamp
  [content key]
  (let [lines (string/split-lines content)
        new-lines (filter (fn [line]
                            (not (string/starts-with? (string/lower-case line) key)))
                          lines)]
    (string/join "\n" new-lines)))

(defn beginning-of-line
  [content pos]
  (or (zero? pos)
      (when-let [pre-char (subs content (dec pos) pos)]
        (println "pre-char: " pre-char)
        (= pre-char \newline))))

(defn end-of-line
  [content pos]
  (or (= pos (count content))
      (when-let [next-char (subs content pos (inc pos))]
        (= next-char \newline))))

(defn goto-end-of-line
  [content pos]
  (when-not (end-of-line content pos)
    (or (string/index-of content \newline pos)
        (count content))))

(defn goto-beginning-of-line
  [content pos]
  (when-not (beginning-of-line content pos)
    (or (string/last-index-of content \newline pos)
        0)))
