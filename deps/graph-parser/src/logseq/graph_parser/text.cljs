(ns logseq.graph-parser.text
  (:require ["path" :as path]
            [goog.string :as gstring]
            [clojure.string :as string]
            [clojure.set :as set]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.util.page-ref :as page-ref :refer [right-brackets]]))

(defn get-file-basename
  [path]
  (when-not (string/blank? path)
    ;; Same as util/node-path.name
    (.-name (path/parse (string/replace path "+" "/")))))

(def page-ref-re-0 #"\[\[(.*)\]\]")
(def org-page-ref-re #"\[\[(file:.*)\]\[.+?\]\]")
(def markdown-page-ref-re #"\[(.*)\]\(file:.*\)")

(defn get-page-name
  "Extracts page names from format-specific page-refs e.g. org/md specific and
  logseq page-refs. Only call in contexts where format-specific page-refs are
  used. For logseq page-refs use page-ref/get-page-name"
  [s]
  (and (string? s)
       (or (when-let [[_ label _path] (re-matches markdown-page-ref-re s)]
             (string/trim label))
           (when-let [[_ path _label] (re-matches org-page-ref-re s)]
             (some-> (get-file-basename path)
                     (string/replace "." "/")))
           (-> (re-matches page-ref-re-0 s)
               second))))

(defn page-ref-un-brackets!
  [s]
  (or (get-page-name s) s))

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
       (> (count (re-seq page-ref/left-brackets-re s))
          (count (re-seq page-ref/right-brackets-re s)))))

(defn- ref-matched?
  [s]
  (let [x (re-seq page-ref/left-brackets-re s)
        y (re-seq page-ref/right-brackets-re s)]
    (and (> (count x) 0) (= (count x) (count y)))))

(defn get-nested-page-name
  [page-name]
  (when-let [first-match (re-find page-ref/page-ref-without-nested-re page-name)]
    (second first-match)))

(defn- concat-nested-pages
  [coll]
  (first
   (reduce (fn [[acc not-matched-s] s]
             (cond
               (and not-matched-s (= s right-brackets))
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
     (and (string? s) (gp-util/wrapped-by-quotes? s))
     (gp-util/unquote-string s)

     (and (string? s) (re-find markdown-link s))
     s

     (and (string? s)
            ;; Either a page ref, a tag or a comma separated collection
            (or (re-find page-ref/page-ref-re s)
                (re-find #"[\,|，|#|\"]+" s)))
     (let [result (->> (sep-by-quotes s)
                       (mapcat
                        (fn [s]
                          (when-not (gp-util/wrapped-by-quotes? (string/trim s))
                            (string/split s page-ref/page-ref-outer-capture-re))))
                       (mapcat (fn [s]
                                 (cond
                                   (gp-util/wrapped-by-quotes? s)
                                   nil

                                   (string/includes? (string/trimr s)
                                                     (str right-brackets ","))
                                   (let [idx (string/index-of s (str right-brackets ","))]
                                     [(subs s 0 idx)
                                      right-brackets
                                      (subs s (+ idx 3))])

                                   :else
                                   [s])))
                       (remove #(= % ""))
                       (mapcat (fn [s] (if (string/ends-with? s right-brackets)
                                         [(subs s 0 (- (count s) 2))
                                          right-brackets]
                                         [s])))
                       concat-nested-pages
                       (remove string/blank?)
                       (mapcat (fn [s]
                                 (cond
                                   (gp-util/wrapped-by-quotes? s)
                                   nil

                                   (page-ref/page-ref? s)
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
  ([text format block-pattern]
   (remove-level-spaces text format block-pattern false true))
  ([text format block-pattern space?]
   (remove-level-spaces text format block-pattern space? true))
  ([text format block-pattern space? trim-left?]
   (when format
     (cond
       (string/blank? text)
       ""

       (and (= "markdown" (name format))
            (string/starts-with? text "---"))
       text

       :else
       (remove-level-space-aux! text block-pattern space? trim-left?)))))

(defn namespace-page?
  [p]
  (and (string? p)
       (string/includes? p "/")
       (not (string/starts-with? p "../"))
       (not (string/starts-with? p "./"))
       (not (gp-util/url? p))))

(defonce non-parsing-properties
  (atom #{"background-color" "background_color"}))

(defn parse-non-string-property-value
  "Return parsed non-string property value or nil if none is found"
  [v]
  (cond
    (= v "true")
    true

    (= v "false")
    false

    (re-find #"^\d+$" v)
    (parse-long v)))

(def ^:private page-ref-or-tag-re
  (re-pattern (str "#?" (page-ref/->page-ref-re-str "(.*?)") "|"
                   ;; Don't capture punctuation at end of a tag
                   "#([\\S]+[^\\s.!,])")))

(defn extract-page-refs-and-tags
  "Returns set of page-refs and tags in given string or returns string if none
  are found"
  [string]
  (let [refs (map #(or (second %) (get % 2))
                  (re-seq page-ref-or-tag-re string))]
    (if (seq refs) (set refs) string)))

(defn parse-property
  "Property value parsing that takes into account built-in properties, format
  and user config"
  ([k v config-state]
   (parse-property :markdown k v config-state))
  ([format k v config-state]
   (let [k (name k)
         v (if (or (symbol? v) (keyword? v)) (name v) (str v))
         v (string/trim v)]
     (cond
       (contains? (set/union
                   #{"title" "filters"}
                   (get config-state :ignored-page-references-keywords)) k)
       v

       (gp-util/wrapped-by-quotes? v) ; wrapped in ""
       v

       (contains? @non-parsing-properties (string/lower-case k))
       v

       (gp-mldoc/link? format v)
       v

       (contains? gp-property/editable-linkable-built-in-properties (keyword k))
       (split-page-refs-without-brackets v)

       :else
       (if-some [res (parse-non-string-property-value v)]
         res
         (if (:rich-property-values? config-state)
           (extract-page-refs-and-tags v)
           (split-page-refs-without-brackets v)))))))
