(ns logseq.graph-parser.text
  "Miscellaneous text util fns for the parser"
  (:require ["path" :as path]
            [goog.string :as gstring]
            [clojure.string :as string]
            [clojure.set :as set]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.page-ref :as page-ref]))

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

(defn get-nested-page-name
  [page-name]
  (when-let [first-match (re-find page-ref/page-ref-without-nested-re page-name)]
    (second first-match)))

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

(defn- get-ref-from-ast
  [[typ data]]
  (case typ
    "Link"
    (case (first (:url data))
      "Page_ref"
      (second (:url data))

      "Search"
      (second (:url data))

      nil)

    "Nested_link"
    (page-ref/get-page-name (:content data))

    "Tag"
    (if (= "Plain" (ffirst data))
      (second (first data))
      (get-ref-from-ast (first data)))

    nil))

(defn extract-refs-from-mldoc-ast
  [v]
  (into #{}
        (comp
         (remove gp-mldoc/ast-link?)
         (keep get-ref-from-ast)
         (map string/trim))
        v))

(defn- sep-by-comma
  [s]
  {:pre (string? s)}
  (->>
   (string/split s #"[\,，]{1}")
   (map string/trim)
   (remove string/blank?)
   (set)))

(defn separated-by-commas?
  [config-state k]
  (let [k' (if (keyword? k) k (keyword k))]
    (contains? (set/union gp-property/editable-linkable-built-in-properties
                          (set (get config-state :property/separated-by-commas)))
               k')))

(defn- extract-refs-by-commas
  [v format]
  (let [plains (->> (map first (gp-mldoc/->edn v (gp-mldoc/default-config format)))
                    first
                    second
                    (filter #(and (vector? %) (= "Plain" (first %))))
                    (map second))]
    (set (mapcat sep-by-comma plains))))

(defn parse-property
  "Property value parsing that takes into account built-in properties, and user config"
  [k v mldoc-references-ast config-state]
  (let [refs (extract-refs-from-mldoc-ast mldoc-references-ast)
        property-separated-by-commas? (separated-by-commas? config-state k)
        refs' (if property-separated-by-commas?
                (->> (extract-refs-by-commas v (get config-state :format :markdown))
                     (set/union refs))
                refs)
        k (if (or (symbol? k) (keyword? k)) (subs (str k) 1) k)
        v (string/trim (str v))
        non-string-property (parse-non-string-property-value v)]
    (cond
      (contains? (set/union
                  #{"filters" "macro"}
                  (get config-state :ignored-page-references-keywords)) k)
      v

      (@non-parsing-properties k)
      v

      (string/blank? v)
      nil

      (and (string? v) (gp-util/wrapped-by-quotes? v))
      v

      (seq refs')
      refs'

      (some? non-string-property)
      non-string-property

      :else
      v)))
