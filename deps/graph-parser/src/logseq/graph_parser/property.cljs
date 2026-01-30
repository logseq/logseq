(ns logseq.graph-parser.property
  "For file graphs, core vars and util fns for properties"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [goog.string :as gstring]
            [goog.string.format]
            [logseq.common.util :as common-util]))

(def colons "Property delimiter for markdown mode" "::")
(defn colons-org
  "Property delimiter for org mode"
  [property]
  (str ":" property ":"))

(defn properties-ast?
  [block]
  (and
   (vector? block)
   (contains? #{"Property_Drawer" "Properties"}
              (first block))))

(defn valid-property-name?
  [s]
  {:pre [(string? s)]}
  (and (common-util/valid-edn-keyword? s)
       (not (re-find #"[\"|^|(|)|{|}]+" s))
       ;; Disallow tags as property names
       (not (re-find #"^:#" s))))

;; Built-in properties are properties that logseq uses for its features. Most of
;; these properties are hidden from the user but a few like the editable ones
;; are visible for the user to edit.

(def editable-linkable-built-in-properties
  "Properties used by logseq that user can edit and that can have linkable property values"
  #{:alias :aliases :tags})

(defn editable-built-in-properties
  "Properties used by logseq that user can edit"
  []
  (set/union #{:title :icon :template :template-including-parent :public :filters :exclude-from-graph-view
               :logseq.query/nlp-date
               ;; org-mode only
               :macro :filetags}
             editable-linkable-built-in-properties))

(defn hidden-built-in-properties
  "Properties used by logseq that user can't edit or see"
  []
  #{:custom-id :background_color :created_at :last_modified_at ; backward compatibility only
    :id :background-color :heading :collapsed
    :created-at :updated-at :last-modified-at
    :query-table :query-properties :query-sort-by :query-sort-desc :ls-type
    :hl-type :hl-page :hl-stamp :hl-color :hl-value :logseq.macro-name :logseq.macro-arguments
    :logseq.order-list-type
     ; task markers
    :todo :doing :now :later :done})

(def built-in-property-types
  "Types for built-in properties. Built-in properties whose values are to be
  parsed by gp-text/parse-non-string-property-value should be added here"
  {:template-including-parent :boolean
   :public :boolean
   :exclude-from-graph-view :boolean
   :logseq.query/nlp-date :boolean
   :heading :boolean                    ; FIXME: or integer
   :collapsed :boolean
   :created-at :integer
   :created_at :integer
   :updated-at :integer
   :last-modified-at :integer
   :last_modified_at :integer
   :query-table :boolean
   :query-sort-desc :boolean
   :hl-page :integer
   :hl-stamp :integer
   :todo :integer
   :doing :integer
   :now :integer
   :later :integer
   :done :integer})

(assert (set/subset? (set (keys built-in-property-types))
                     (set/union (hidden-built-in-properties)
                                (editable-built-in-properties)))
        "Keys of built-in-property-types must be valid built-in properties")

(defn unparsed-built-in-properties
  "Properties whose values will not be parsed by gp-text/parse-property"
  []
  (set/difference (set/union (hidden-built-in-properties)
                             (editable-built-in-properties))
                  ;; Refs need to be parsed
                  editable-linkable-built-in-properties
                  ;; All these should be parsed by gp-text/parse-non-string-property-value
                  (set (keys built-in-property-types))))

(defonce properties-start ":PROPERTIES:")
(defonce properties-end ":END:")
(defonce properties-end-pattern
  (re-pattern (gstring/format "%s[\t\r ]*\n|(%s\\s*$)" properties-end properties-end)))

(defn- contains-properties?
  [content]
  (when content
    (and (string/includes? content properties-start)
         (re-find properties-end-pattern content))))

(defn ->new-properties
  "New syntax: key:: value"
  [content]
  (if (contains-properties? content)
    (let [lines (string/split-lines content)
          start-idx (.indexOf lines properties-start)
          end-idx (.indexOf lines properties-end)]
      (if (and (>= start-idx 0) (> end-idx 0) (> end-idx start-idx))
        (let [before (subvec lines 0 start-idx)
              middle (->> (subvec lines (inc start-idx) end-idx)
                          (map (fn [text]
                                 (let [[k v] (common-util/split-first ":" (subs text 1))]
                                   (if (and k v)
                                     (let [k (string/replace k "_" "-")
                                           compare-k (keyword (string/lower-case k))
                                           k (if (contains? #{:id :custom_id :custom-id} compare-k) "id" k)
                                           k (if (contains? #{:last-modified-at} compare-k) "updated-at" k)]
                                       (str k colons " " (string/trim v)))
                                     text)))))
              after (subvec lines (inc end-idx))
              lines (concat before middle after)]
          (string/join "\n" lines))
        content))
    content))

(defn simplified-property?
  [line]
  (boolean
   (and (string? line)
        (re-find (re-pattern (str "^\\s?[^ ]+" colons)) line))))

(defn remove-properties
  [format content]
  (cond
    (contains-properties? content)
    (let [lines (string/split-lines content)
          [title-lines properties&body] (split-with #(-> (string/triml %)
                                                         string/upper-case
                                                         (string/starts-with? properties-start)
                                                         not)
                                                    lines)
          body (drop-while #(-> (string/trim %)
                                string/upper-case
                                (string/starts-with? properties-end)
                                not
                                (or (string/blank? %)))
                           properties&body)
          body (if (and (seq body)
                        (-> (first body)
                            string/triml
                            string/upper-case
                            (string/starts-with? properties-end)))
                 (let [line (string/replace (first body) #"(?i):END:\s?" "")]
                   (if (string/blank? line)
                     (rest body)
                     (cons line (rest body))))
                 body)]
      (->> (concat title-lines body)
           (string/join "\n")))

    (not= format :org)
    (let [lines (string/split-lines content)
          lines (if (simplified-property? (first lines))
                  (drop-while simplified-property? lines)
                  (cons (first lines)
                        (drop-while simplified-property? (rest lines))))]
      (string/join "\n" lines))

    :else
    content))

(defn remove-logbook
  [content]
  (when (string? content)
    (let [lines (string/split-lines content)
          [result _in-logbook?]
          (reduce (fn [[acc in-logbook?] line]
                    (let [trimmed (string/trim line)
                          upper (string/upper-case trimmed)]
                      (cond
                        (string/starts-with? upper ":LOGBOOK:")
                        [acc true]

                        (and in-logbook? (string/starts-with? upper ":END:"))
                        [acc false]

                        in-logbook?
                        [acc true]

                        :else
                        [(conj acc line) in-logbook?])))
                  [[] false]
                  lines)]
      (string/join "\n" result))))

(defn remove-deadline-scheduled
  [content]
  (when (string? content)
    (let [lines (string/split-lines content)]
      (if (= 1 (count lines))
        content
        (let [first-line (first lines)
              rest-lines (rest lines)
              rest-lines (keep (fn [line]
                                 (let [upper (string/upper-case (string/triml line))]
                                   (if (or (string/starts-with? upper "DEADLINE: ")
                                           (string/starts-with? upper "SCHEDULED: "))
                                     (let [cleaned (-> line (string/replace #"(?i)(?:^|\s)(DEADLINE|SCHEDULED):\s+<[^>]*>" "") string/trim)]
                                       (when-not (string/blank? cleaned)
                                         cleaned))
                                     line)))
                               rest-lines)]
          (string/join "\n" (cons first-line rest-lines)))))))
