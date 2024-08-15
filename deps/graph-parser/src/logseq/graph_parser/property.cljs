(ns logseq.graph-parser.property
  "Core vars and util fns for properties and file based graphs"
  (:require [logseq.common.util :as common-util]
            [clojure.string :as string]
            [clojure.set :as set]
            [goog.string :as gstring]
            [goog.string.format]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.common.util.page-ref :as page-ref]))

(def colons "Property delimiter for markdown mode" "::")
(defn colons-org
  "Property delimiter for org mode"
  [property]
  (str ":" property ":"))

(defn ->block-content
  "Creates a block content string from properties map"
  [properties]
  (->> properties
       (map #(str (name (key %)) (str colons " ") (val %)))
       (string/join "\n")))

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

(def built-in-extended-properties (atom #{}))
(defn register-built-in-properties
  [props]
  (reset! built-in-extended-properties (set/union @built-in-extended-properties props)))

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
  (set/union
   #{:custom-id :background_color :created_at :last_modified_at ; backward compatibility only
     :id :background-color :heading :collapsed
     :created-at :updated-at :last-modified-at
     :query-table :query-properties :query-sort-by :query-sort-desc :ls-type
     :hl-type :hl-page :hl-stamp :hl-color :hl-value
     :logseq.order-list-type :logseq.tldraw.page :logseq.tldraw.shape
     ; task markers
     :todo :doing :now :later :done}
   @built-in-extended-properties))

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
                  ;; Most of these need to be auto-parsed as integers so exclude
                  ;; them until we have ones that must be unparsed
                  @built-in-extended-properties
                  ;; Refs need to be parsed
                  editable-linkable-built-in-properties
                  ;; All these should be parsed by gp-text/parse-non-string-property-value
                  (set (keys built-in-property-types))))


(defonce properties-start ":PROPERTIES:")
(defonce properties-end ":END:")
(defonce properties-end-pattern
  (re-pattern (gstring/format "%s[\t\r ]*\n|(%s\\s*$)" properties-end properties-end)))

(defn contains-properties?
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

(defn- build-properties-str
  [format properties]
  (when (seq properties)
    (let [org? (= format :org)
          kv-format (if org? ":%s: %s" (str "%s" colons " %s"))
          full-format (if org? ":PROPERTIES:\n%s\n:END:" "%s\n")
          properties-content (->> (map (fn [[k v]] (gstring/format kv-format (name k) v)) properties)
                                  (string/join "\n"))]
      (gstring/format full-format properties-content))))

(defn simplified-property?
  [line]
  (boolean
   (and (string? line)
        (re-find (re-pattern (str "^\\s?[^ ]+" colons)) line))))

(defn- front-matter-property?
  [line]
  (boolean
   (and (string? line)
        (common-util/safe-re-find #"^\s*[^ ]+:" line))))

(defn- insert-property-not-org
  [key* value lines {:keys [front-matter? has-properties? title?]}]
  (let [exists? (atom false)
        sym (if front-matter? ": " (str colons " "))
        new-property-s (str key* sym value)
        property-f (if front-matter? front-matter-property? simplified-property?)
        groups (partition-by property-f lines)
        compose-lines (fn []
                        (mapcat (fn [lines]
                                  (if (property-f (first lines))
                                    (let [lines (doall
                                                 (mapv (fn [text]
                                                         (let [[k v] (common-util/split-first sym text)]
                                                           (if (and k v)
                                                             (let [key-exists? (= k key)
                                                                   _ (when key-exists? (reset! exists? true))
                                                                   v (if key-exists? value v)]
                                                               (str k sym  (string/trim v)))
                                                             text)))
                                                       lines))
                                          lines (if @exists? lines (conj lines new-property-s))]
                                      lines)
                                    lines))
                                groups))
        lines (cond
                has-properties?
                (compose-lines)

                title?
                (cons (first lines) (cons new-property-s (rest lines)))

                :else
                (cons new-property-s lines))]
    (string/join "\n" lines)))

(defn insert-property
  "Only accept nake content (without any indentation)"
  ([repo format content key value]
   (insert-property repo format content key value false))
  ([repo format content key value front-matter?]
   (when (string? content)
     (let [ast (gp-mldoc/->edn repo content format)
           title? (gp-mldoc/block-with-title? (ffirst (map first ast)))
           has-properties? (or (and title?
                                    (or (gp-mldoc/properties? (second ast))
                                        (gp-mldoc/properties? (second
                                                               (remove
                                                                (fn [[x _]]
                                                                  (contains? #{"Hiccup" "Raw_Html"} (first x)))
                                                                ast)))))
                               (gp-mldoc/properties? (first ast)))
           lines (string/split-lines content)
           [title body] (gp-mldoc/get-title&body repo content format)
           scheduled (filter #(string/starts-with? % "SCHEDULED") lines)
           deadline (filter #(string/starts-with? % "DEADLINE") lines)
           body-without-timestamps (filter
                                    #(not (or (string/starts-with? % "SCHEDULED")
                                              (string/starts-with? % "DEADLINE")))
                                    (string/split-lines body))
           org? (= :org format)
           key (string/lower-case (name key))
           value (string/trim (str value))
           start-idx (.indexOf lines properties-start)
           end-idx (.indexOf lines properties-end)
           result (cond
                    (and org? (not has-properties?))
                    (let [properties (build-properties-str format {key value})]
                      (if title
                        (string/join "\n" (concat [title] scheduled deadline [properties] body-without-timestamps))
                        (str properties "\n" content)))

                    (and has-properties? (>= start-idx 0) (> end-idx 0) (> end-idx start-idx))
                    (let [exists? (atom false)
                          before (subvec lines 0 start-idx)
                          middle (doall
                                  (->> (subvec lines (inc start-idx) end-idx)
                                       (mapv (fn [text]
                                               (let [[k v] (common-util/split-first ":" (subs text 1))]
                                                 (if (and k v)
                                                   (let [key-exists? (= k key)
                                                         _ (when key-exists? (reset! exists? true))
                                                         v (if key-exists? value v)]
                                                     (str ":" k ": "  (string/trim v)))
                                                   text))))))
                          middle (if @exists? middle (conj middle (str ":" key ": "  value)))
                          after (subvec lines (inc end-idx))
                          lines (concat before [properties-start] middle [properties-end] after)]
                      (string/join "\n" lines))

                    (not org?)
                    (insert-property-not-org key value lines {:has-properties? has-properties?
                                                              :title? title?
                                                              :front-matter? front-matter?})

                    :else
                    content)]
       (string/trimr result)))))

(defn remove-property
  ([format key content]
   (remove-property format key content true))
  ([format key content first?]
   (when (not (string/blank? (name key)))
     (let [format (or format :markdown)
           key (string/lower-case (name key))
           remove-f (if first? common-util/remove-first remove)]
       (if (and (= format :org) (not (contains-properties? content)))
         content
         (let [lines (->> (string/split-lines content)
                          (remove-f (fn [line]
                                      (let [s (string/triml (string/lower-case line))]
                                        (or (string/starts-with? s (str ":" key ":"))
                                            (string/starts-with? s (str key colons " ")))))))]
           (string/join "\n" lines)))))))

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

(defn insert-properties
  [repo format content kvs]
  (reduce
   (fn [content [k v]]
     (let [k (if (string? k)
               (keyword (-> (string/lower-case k)
                            (string/replace " " "-")))
               k)
           v (if (coll? v)
               (some->>
                (seq v)
                (distinct)
                (map (fn [item] (page-ref/->page-ref (page-ref/page-ref-un-brackets! item))))
                (string/join ", "))
               (if (keyword? v) (name v) v))]
       (insert-property repo format content k v)))
   content kvs))
