(ns frontend.util.property
  "Property fns needed by the rest of the app and not graph-parser"
  (:require [clojure.string :as string]
            [frontend.util :as util]
            [clojure.set :as set]
            [frontend.config :as config]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.property :as gp-property :refer [properties-start properties-end]]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [frontend.format.mldoc :as mldoc]
            [logseq.graph-parser.text :as text]
            [frontend.util.cursor :as cursor]))

(defn hidden-properties
  "These are properties hidden from user including built-in ones and ones
  configured by user"
  []
  (set/union
   (gp-property/hidden-built-in-properties)
   (set (config/get-block-hidden-properties))))

;; TODO: Investigate if this behavior is correct for configured hidden
;; properties and for editable built in properties
(def built-in-properties
  "Alias to hidden-properties to keep existing behavior"
  hidden-properties)

(defn properties-hidden?
  [properties]
  (and (seq properties)
       (let [ks (map (comp keyword string/lower-case name) (keys properties))
             hidden-properties-set (hidden-properties)]
         (every? hidden-properties-set ks))))

(defn remove-empty-properties
  [content]
  (if (gp-property/contains-properties? content)
    (string/replace content
                    (re-pattern ":PROPERTIES:\n+:END:\n*")
                    "")
    content))

(defn simplified-property?
  [line]
  (boolean
   (and (string? line)
        (re-find (re-pattern (str "^\\s?[^ ]+" gp-property/colons)) line))))

(defn front-matter-property?
  [line]
  (boolean
   (and (string? line)
        (util/safe-re-find #"^\s*[^ ]+:" line))))

(defn get-property-key
  [line format]
  (and (string? line)
       (when-let [key (last
                       (if (= format :org)
                         (util/safe-re-find #"^\s*:([^: ]+): " line)
                         (util/safe-re-find #"^\s*([^ ]+):: " line)))]
         (keyword key))))

(defn org-property?
  [line]
  (boolean
   (and (string? line)
        (util/safe-re-find #"^\s*:[^: ]+: " line)
        (when-let [key (get-property-key line :org)]
          (not (contains? #{:PROPERTIES :END} key))))))

(defn get-org-property-keys
  [content]
  (let [content-lines (string/split-lines content)
        [_ properties&body] (split-with #(-> (string/triml %)
                                             string/upper-case
                                             (string/starts-with? properties-start)
                                             not)
                                        content-lines)
        properties (rest (take-while #(-> (string/trim %)
                                          string/upper-case
                                          (string/starts-with? properties-end)
                                          not
                                          (or (string/blank? %)))
                                     properties&body))]
    (when (seq properties)
      (map #(->> (string/split % ":")
                 (remove string/blank?)
                 first
                 string/upper-case)
           properties))))

(defn get-markdown-property-keys
  [content]
  (let [content-lines (string/split-lines content)
        properties (filter #(re-matches (re-pattern (str "^.+" gp-property/colons "\\s*.+")) %)
                           content-lines)]
    (when (seq properties)
      (map #(->> (string/split % gp-property/colons)
                 (remove string/blank?)
                 first
                 string/upper-case)
           properties))))

(defn get-property-keys
  [format content]
  (cond
    (gp-property/contains-properties? content)
    (get-org-property-keys content)

    (= :markdown format)
    (get-markdown-property-keys content)))

(defn property-key-exist?
  [format content key]
  (let [key (string/upper-case key)]
    (contains? (set (util/remove-first #{key} (get-property-keys format content))) key)))

(defn goto-properties-end
  [_format input]
  (cursor/move-cursor-to-thing input properties-start 0)
  (let [from (cursor/pos input)]
    (cursor/move-cursor-to-thing input properties-end from)))

(defn remove-properties
  [format content]
  (cond
    (gp-property/contains-properties? content)
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

(defn build-properties-str
  [format properties]
  (when (seq properties)
    (let [org? (= format :org)
          kv-format (if org? ":%s: %s" (str "%s" gp-property/colons " %s"))
          full-format (if org? ":PROPERTIES:\n%s\n:END:" "%s\n")
          properties-content (->> (map (fn [[k v]] (util/format kv-format (name k) v)) properties)
                                  (string/join "\n"))]
      (util/format full-format properties-content))))

;; title properties body
(defn with-built-in-properties
  [properties content format]
  (let [org? (= format :org)
        properties (filter (fn [[k _v]] ((built-in-properties) k)) properties)]
    (if (seq properties)
      (let [lines (string/split-lines content)
            ast (mldoc/->edn content (gp-mldoc/default-config format))
            [title body] (if (mldoc/block-with-title? (first (ffirst ast)))
                           [(first lines) (rest lines)]
                           [nil lines])
            properties-in-content? (and title (= (string/upper-case title) properties-start))
            no-title? (or (simplified-property? title) properties-in-content?)
            properties&body (concat
                                 (when (and no-title? (not org?)) [title])
                                 (if (and org? properties-in-content?)
                                   (rest body)
                                   body))
            {properties-lines true body false} (group-by (fn [s]
                                                           (or (simplified-property? s)
                                                               (and org? (org-property? s)))) properties&body)
            body (if org?
                   (remove (fn [s] (contains? #{properties-start properties-end} (string/trim s))) body)
                   body)
            properties-in-content (->> (map #(get-property-key % format) properties-lines)
                                       (remove nil?)
                                       (set))
            properties (remove (comp properties-in-content first) properties)
            built-in-properties-area (map (fn [[k v]]
                                            (if org?
                                              (str ":" (name k) ": " v)
                                              (str (name k) gp-property/colons " " v))) properties)
            body (concat (if no-title? nil [title])
                         (when org? [properties-start])
                         built-in-properties-area
                         properties-lines
                         (when org?
                           [properties-end])
                         body)]
        (string/triml (string/join "\n" body)))
      content)))

;; FIXME:
(defn front-matter?
  [s]
  (string/starts-with? s "---\n"))

(defn insert-property
  "Only accept nake content (without any indentation)"
  ([format content key value]
   (insert-property format content key value false))
  ([format content key value front-matter?]
   (when (string? content)
     (let [ast (mldoc/->edn content (gp-mldoc/default-config format))
           title? (mldoc/block-with-title? (ffirst (map first ast)))
           has-properties? (or (and title?
                                    (or (mldoc/properties? (second ast))
                                        (mldoc/properties? (second
                                                            (remove
                                                             (fn [[x _]]
                                                               (contains? #{"Hiccup" "Raw_Html"} (first x)))
                                                             ast)))))
                               (mldoc/properties? (first ast)))
           lines (string/split-lines content)
           [title body] (if title?
                          [(first lines) (string/join "\n" (rest lines))]
                          [nil (string/join "\n" lines)])
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
                                               (let [[k v] (gp-util/split-first ":" (subs text 1))]
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
                    (let [exists? (atom false)
                          sym (if front-matter? ": " (str gp-property/colons " "))
                          new-property-s (str key sym value)
                          property-f (if front-matter? front-matter-property? simplified-property?)
                          groups (partition-by property-f lines)
                          compose-lines (fn []
                                          (mapcat (fn [lines]
                                                    (if (property-f (first lines))
                                                      (let [lines (doall
                                                                   (mapv (fn [text]
                                                                           (let [[k v] (gp-util/split-first sym text)]
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
                      (string/join "\n" lines))

                    :else
                    content)]
       (string/trimr result)))))

(defn insert-properties
  [format content kvs]
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
                (map (fn [item] (page-ref/->page-ref (text/page-ref-un-brackets! item))))
                (string/join ", "))
               v)]
       (insert-property format content k v)))
   content kvs))

(defn remove-property
  ([format key content]
   (remove-property format key content true))
  ([format key content first?]
   (when (not (string/blank? (name key)))
     (let [format (or format :markdown)
           key (string/lower-case (name key))
           remove-f (if first? util/remove-first remove)]
       (if (and (= format :org) (not (gp-property/contains-properties? content)))
         content
         (let [lines (->> (string/split-lines content)
                          (remove-f (fn [line]
                                      (let [s (string/triml (string/lower-case line))]
                                        (or (string/starts-with? s (str ":" key ":"))
                                            (string/starts-with? s (str key gp-property/colons " ")))))))]
           (string/join "\n" lines)))))))

(defn remove-id-property
  [format content]
  (remove-property format "id" content false))

;; FIXME: remove only from the properties area, not other blocks such as
;; code blocks, quotes, etc.
;; Currently, this function will do nothing if the content is a code block.
;; The future plan is to separate those properties from the block' content.
(defn remove-built-in-properties
  [format content]
  (let [trim-content (string/trim content)]
    (if (or
         (and (= format :markdown)
              (string/starts-with? trim-content "```")
              (string/ends-with? trim-content "```"))
         (and (= format :org)
              (string/starts-with? trim-content "#+BEGIN_SRC")
              (string/ends-with? trim-content "#+END_SRC")))
      content
      (let [built-in-properties* (built-in-properties)
            content (reduce (fn [content key]
                              (remove-property format key content)) content built-in-properties*)]
        (if (= format :org)
          (string/replace-first content (re-pattern ":PROPERTIES:\n:END:\n*") "")
          content)))))

(defn add-page-properties
  [page-format properties-content properties]
  (let [properties (update-keys properties name)
        lines (string/split-lines properties-content)
        front-matter-format? (contains? #{:markdown} page-format)
        lines (if front-matter-format?
                (remove (fn [line]
                          (contains? #{"---" ""} (string/trim line))) lines)
                lines)
        property-keys (keys properties)
        prefix-f (case page-format
                   :org (fn [k]
                          (str "#+" (string/upper-case k) ": "))
                   :markdown (fn [k]
                               (str (string/lower-case k) ": "))
                   identity)
        exists? (atom #{})
        lines (doall
               (mapv (fn [line]
                       (let [result (filter #(and % (util/starts-with? line (prefix-f %)))
                                            property-keys)]
                         (if (seq result)
                           (let [k (first result)]
                             (swap! exists? conj k)
                             (str (prefix-f k) (get properties k)))
                           line))) lines))
        lines (concat
               lines
               (let [not-exists (remove
                                 (fn [[k _]]
                                   (contains? @exists? k))
                                 properties)]
                 (when (seq not-exists)
                   (mapv
                    (fn [[k v]] (str (prefix-f k) v))
                    not-exists))))]
    (util/format
     (config/properties-wrapper-pattern page-format)
     (string/join "\n" lines))))
