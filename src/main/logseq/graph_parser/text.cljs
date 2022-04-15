(ns logseq.graph-parser.text
  "Modified version of frontend.text"
  (:require [logseq.graph-parser.util :as util]
            ; ["/frontend/utils" :as utils]
            [goog.string :as gstring]
            [clojure.string :as string]
            [logseq.graph-parser.mldoc :as mldoc]
            [clojure.set :as set]))

(def page-ref-re-0 #"\[\[(.*)\]\]")
(def org-page-ref-re #"\[\[(file:.*)\]\[.+?\]\]")
(def markdown-page-ref-re #"\[(.*)\]\(file:.*\)")

; (defonce ^js node-path utils/nodePath)

;; TODO: Load frontend/utils.js
(defn get-file-basename
  [path]
  path
  #_(when-not (string/blank? path)
      (node-path.name path)))

(defn get-page-name
  [s]
  (and (string? s)
       (or (when-let [[_ label _path] (re-matches markdown-page-ref-re s)]
             (string/trim label))
           (when-let [[_ path _label] (re-matches org-page-ref-re s)]
             (some-> (get-file-basename path)
                     (string/replace "." "/")))
           (-> (re-matches page-ref-re-0 s)
               second))))

(defn page-ref?
  [s]
  (and
   (string? s)
   (string/starts-with? s "[[")
   (string/ends-with? s "]]")))

(def block-ref-re #"\(\(([a-zA-z0-9]{8}-[a-zA-z0-9]{4}-[a-zA-z0-9]{4}-[a-zA-z0-9]{4}-[a-zA-z0-9]{12})\)\)")

(defn get-block-ref
  [s]
  (and (string? s)
       (second (re-matches block-ref-re s))))

(defn block-ref?
  [s]
  (boolean (get-block-ref s)))

(defonce page-ref-re #"\[\[(.*?)\]\]")

(defonce page-ref-re-2 #"(\[\[.*?\]\])")

(def page-ref-re-without-nested #"\[\[([^\[\]]+)\]\]")

(defonce between-re #"\(between ([^\)]+)\)")

(defn page-ref-un-brackets!
  [s]
  (or (get-page-name s) s))

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

(defn sep-by-hashtag
  [s]
  (when s
    (some->>
     (string/split s #"#")
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

(defn get-nested-page-name
  [page-name]
  (when-let [first-match (re-find page-ref-re-without-nested page-name)]
    (second first-match)))

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
                       (mapcat (fn [s]
                                 (cond
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
                                   (->> (sep-by-comma s)
                                        (mapcat sep-by-hashtag)))))
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
  [text _format]
  (if-not (string/blank? text)
    (let [pattern (gstring/format
                   "^[%s]+\\s?"
                   ;; TODO: Pass in config
                   "-"  #_(config/get-block-pattern format))]
      (util/safe-re-find (re-pattern pattern) text))
    ""))

(defn- remove-level-space-aux!
  [text pattern space? trim-left?]
  (let [pattern (gstring/format
                 (if space?
                   "^[%s]+\\s+"
                   "^[%s]+\\s?")
                 pattern)
        text (if trim-left? (string/triml text) text)]
    (string/replace-first text (re-pattern pattern) "")))

(defn remove-level-spaces
  ([text format]
   (remove-level-spaces text format false true))
  ([text format space?]
   (remove-level-spaces text format space? true))
  ([text format space? trim-left?]
   (when format
     (cond
       (string/blank? text)
       ""

       (and (= "markdown" (name format))
            (string/starts-with? text "---"))
       text

       :else
       (remove-level-space-aux! text "-" #_(config/get-block-pattern format) space? trim-left?)))))

(defn build-data-value
  [col]
  (let [items (map (fn [item] (str "\"" item "\"")) col)]
    (gstring/format "[%s]"
                 (string/join ", " items))))

(defn media-link?
  [media-formats s]
  (some (fn [fmt] (util/safe-re-find (re-pattern (str "(?i)\\." fmt "(?:\\?([^#]*))?(?:#(.*))?$")) s)) media-formats))

(defn namespace-page?
  [p]
  (and (string? p)
       (string/includes? p "/")
       (not (string/starts-with? p "../"))
       (not (string/starts-with? p "./"))
       (not (util/url? p))))

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

(defn get-current-line-by-pos
  [s pos]
  (let [lines (string/split-lines s)
        result (reduce (fn [acc line]
                         (let [new-pos (+ acc (count line))]
                           (if (>= new-pos pos)
                             (reduced line)
                             (inc new-pos)))) 0 lines)]
    (when (string? result)
      result)))

(defn get-string-all-indexes
  "Get all indexes of `value` in the string `s`."
  [s value]
  (loop [acc []
         i 0]
    (if-let [i (string/index-of s value i)]
      (recur (conj acc i) (+ i (count value)))
      acc)))

(defn surround-by?
  "`pos` must be surrounded by `before` and `and` in string `value`, e.g. ((|))"
  [value pos before end]
  (let [start-pos (if (= :start before) 0 (- pos (count before)))
        end-pos (if (= :end end) (count value) (+ pos (count end)))]
    (when (>= (count value) end-pos)
      (= (cond
           (and (= :end end) (= :start before))
           ""

           (= :end end)
           before

           (= :start before)
           end

           :else
           (str before end))
         (subs value start-pos end-pos)))))

(defn wrapped-by?
  "`pos` must be wrapped by `before` and `and` in string `value`, e.g. ((a|b))"
  [value pos before end]
  (let [before-matches (->> (get-string-all-indexes value before)
                            (map (fn [i] [i :before])))
        end-matches (->> (get-string-all-indexes value end)
                         (map (fn [i] [i :end])))
        indexes (sort-by first (concat before-matches end-matches [[pos :between]]))
        ks (map second indexes)
        q [:before :between :end]]
    (true?
     (reduce (fn [acc k]
               (if (= q (conj acc k))
                 (reduced true)
                 (vec (take-last 2 (conj acc k)))))
             []
             ks))))

(defn get-graph-name-from-path
  [path]
  (when (string? path)
    (let [parts (->> (string/split path #"/")
                     (take-last 2))]
      (-> (if (not= (first parts) "0")
            (string/join "/" parts)
            (last parts))
          js/decodeURI))))

(defonce non-parsing-properties
  (atom #{"background-color" "background_color"}))

(defn parse-property
  ([k v]
   (parse-property :markdown k v))
  ([format k v]
   (let [k (name k)
         v (if (or (symbol? v) (keyword? v)) (name v) (str v))
         v (string/trim v)]
     (cond
       (contains? (set/union
                   #{"title" "filters"}
                   ;; TODO: Pass in config
                   #_(get (state/get-config) :ignored-page-references-keywords)) k)
       v

       (= v "true")
       true
       (= v "false")
       false

       (and (not= k "alias") (util/safe-re-find #"^\d+$" v))
       (util/safe-parse-int v)

       (util/wrapped-by-quotes? v) ; wrapped in ""
       v

       (contains? @non-parsing-properties (string/lower-case k))
       v

       (mldoc/link? format v)
       v

       :else
       (split-page-refs-without-brackets v)))))
