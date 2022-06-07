(ns logseq.graph-parser.text
  (:require ["path" :as path]
            [goog.string :as gstring]
            [clojure.string :as string]
            [clojure.set :as set]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.util :as gp-util]))

(def page-ref-re-0 #"\[\[(.*)\]\]")
(def org-page-ref-re #"\[\[(file:.*)\]\[.+?\]\]")
(def markdown-page-ref-re #"\[(.*)\]\(file:.*\)")

(defn get-file-basename
  [path]
  (when-not (string/blank? path)
    ;; Same as util/node-path.name
    (.-name (path/parse (string/replace path "+" "/")))))

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
     (and (string? s) (gp-util/wrapped-by-quotes? s))
     (gp-util/unquote-string s)

     (and (string? s) (re-find markdown-link s))
     s

     (and (string? s)
            ;; Either a page ref, a tag or a comma separated collection
            (or (gp-util/safe-re-find page-ref-re s)
                (gp-util/safe-re-find #"[\,|，|#|\"]+" s)))
     (let [result (->> (sep-by-quotes s)
                       (mapcat
                        (fn [s]
                          (when-not (gp-util/wrapped-by-quotes? (string/trim s))
                            (string/split s page-ref-re-2))))
                       (mapcat (fn [s]
                                 (cond
                                   (gp-util/wrapped-by-quotes? s)
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
                                   (gp-util/wrapped-by-quotes? s)
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

(defn parse-property
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

       (= v "true")
       true
       (= v "false")
       false

       (and (not= k "alias") (gp-util/safe-re-find #"^\d+$" v))
       (parse-long v)

       (gp-util/wrapped-by-quotes? v) ; wrapped in ""
       v

       (contains? @non-parsing-properties (string/lower-case k))
       v

       (gp-mldoc/link? format v)
       v

       :else
       (split-page-refs-without-brackets v)))))
