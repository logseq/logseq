(ns frontend.util.property
  (:require [clojure.string :as string]
            [frontend.util :as util]
            [clojure.set :as set]
            [frontend.config :as config]
            [medley.core :as medley]
            [frontend.format.mldoc :as mldoc]
            [frontend.text :as text]))

(defonce properties-start ":PROPERTIES:")
(defonce properties-end ":END:")
(defonce properties-end-pattern
  (re-pattern (util/format "%s[\t\r ]*\n|(%s\\s*$)" properties-end properties-end)))

(def built-in-extended-properties (atom #{}))
(defn register-built-in-properties
  [props]
  (reset! built-in-extended-properties (set/union @built-in-extended-properties props)))

(defn built-in-properties
  []
  (set/union
   #{:id :custom-id :background-color :heading :collapsed :created-at :updated-at :last-modified-at :created_at :last_modified_at :query-table :query-properties :query-sort-by :query-sort-desc
     :ls-type :hl-type :hl-page :hl-stamp}
   (set (map keyword config/markers))
   (set (config/get-block-hidden-properties))
   @built-in-extended-properties))

(defn properties-built-in?
  [properties]
  (and (seq properties)
       (let [ks (map (comp keyword string/lower-case name) (keys properties))
             built-in-properties-set (built-in-properties)]
         (every? built-in-properties-set ks))))

(defn contains-properties?
  [content]
  (and (string/includes? content properties-start)
       (util/safe-re-find properties-end-pattern content)))

(defn remove-empty-properties
  [content]
  (if (contains-properties? content)
    (string/replace content
                    (re-pattern ":PROPERTIES:\n:END:\n*")
                    "")
    content))

(defn simplified-property?
  [line]
  (boolean
   (and (string? line)
        (util/safe-re-find #"^\s?[^ ]+:: " line))))

(defn front-matter-property?
  [line]
  (boolean
   (and (string? line)
        (util/safe-re-find #"^\s*[^ ]+: " line))))

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

(defn remove-properties
  [format content]
  (let [org? (= format :org)]
    (cond
      (contains-properties? content)
      (let [lines (string/split-lines content)
            [title-lines properties-and-body] (split-with (fn [l] (not (string/starts-with? (string/upper-case (string/triml l)) ":PROPERTIES:"))) lines)
            body (drop-while (fn [l]
                               (let [l' (string/lower-case (string/trim l))]
                                 (or
                                  (not (string/starts-with? l' ":end:"))
                                  (string/blank? l))))
                             properties-and-body)
            body (if (and (seq body)
                          (string/starts-with? (string/lower-case (string/triml (first body))) ":end:"))
                   (let [line (string/replace (first body) #"(?i):end:\s?" "")]
                     (if (string/blank? line)
                       (rest body)
                       (cons line (rest body))))
                   body)]
        (->> (concat title-lines body)
             (string/join "\n")))

      (not org?)
      (let [lines (string/split-lines content)
            lines (if (simplified-property? (first lines))
                    (drop-while simplified-property? lines)
                    (cons (first lines)
                          (drop-while simplified-property? (rest lines))))]
        (string/join "\n" lines))

      :else
      content)))

(defn build-properties-str
  [format properties]
  (when (seq properties)
    (let [org? (= format :org)
          kv-format (if org? ":%s: %s" "%s:: %s")
          full-format (if org? ":PROPERTIES:\n%s\n:END:\n" "%s\n")
          properties-content (->> (map (fn [[k v]] (util/format kv-format (name k) v)) properties)
                                  (string/join "\n"))]
      (util/format full-format properties-content))))

;; title properties body
(defn with-built-in-properties
  [properties content format]
  (let [org? (= format :org)
        properties (filter (fn [[k v]] ((built-in-properties) k)) properties)]
    (if (seq properties)
      (let [lines (string/split-lines content)
            ast (mldoc/->edn content (mldoc/default-config format))
            [title body] (if (mldoc/block-with-title? (first (ffirst ast)))
                           [(first lines) (rest lines)]
                           [nil lines])
            properties-in-content? (and title (= (string/upper-case title) properties-start))
            no-title? (or (simplified-property? title) properties-in-content?)
            properties-and-body (concat
                                 (when (and no-title? (not org?)) [title])
                                 (if (and org? properties-in-content?)
                                   (rest body)
                                   body))
            {properties-lines true body false} (group-by (fn [s]
                                                           (or (simplified-property? s)
                                                               (and org? (org-property? s)))) properties-and-body)
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
                                              (str (name k) ":: " v))) properties)
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
  ([format content key value]
   (insert-property format content key value false))
  ([format content key value front-matter?]
   (when (and (string? content)
              (not (string/blank? (name key)))
              (not (string/blank? (str value))))
     (let [ast (mldoc/->edn content (mldoc/default-config format))
           title? (mldoc/block-with-title? (ffirst (map first ast)))
           has-properties? (or (and title?
                                    (mldoc/properties? (second ast)))
                               (mldoc/properties? (first ast)))
           lines (string/split-lines content)
           [title body] (if title?
                          [(first lines) (string/join "\n" (rest lines))]
                          [nil (string/join "\n" lines)])
           org? (= :org format)
           key (string/lower-case (name key))
           value (string/trim (str value))
           start-idx (.indexOf lines properties-start)
           end-idx (.indexOf lines properties-end)
           result        (cond
                           (and org? (not has-properties?))
                           (let [properties (build-properties-str format {key value})]
                             (if title
                               (str title "\n" properties body)
                               (str properties content)))

                           (and has-properties? (>= start-idx 0) (> end-idx 0) (> end-idx start-idx))
                           (let [exists? (atom false)
                                 before (subvec lines 0 start-idx)
                                 middle (doall
                                         (->> (subvec lines (inc start-idx) end-idx)
                                              (mapv (fn [text]
                                                      (let [[k v] (util/split-first ":" (subs text 1))]
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
                                 sym (if front-matter? ": " ":: ")
                                 new-property-s (str key sym  value)
                                 property-f (if front-matter? front-matter-property? simplified-property?)
                                 groups (partition-by property-f lines)
                                 compose-lines (fn []
                                                 (mapcat (fn [lines]
                                                           (if (property-f (first lines))
                                                             (let [lines (doall
                                                                          (mapv (fn [text]
                                                                                  (let [[k v] (util/split-first sym text)]
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
                (map (fn [item] (util/format "[[%s]]" (text/page-ref-un-brackets! item))))
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
       (if (and (= format :org) (not (contains-properties? content)))
         content
         (let [lines (->> (string/split-lines content)
                          (remove-f (fn [line]
                                      (let [s (string/triml (string/lower-case line))]
                                        (or (string/starts-with? s (str ":" key ":"))
                                            (string/starts-with? s (str key ":: ")))))))]
           (string/join "\n" lines)))))))

(defn remove-id-property
  [format content]
  (remove-property format "id" content false))

;; FIXME: only remove from the properties area
(defn remove-built-in-properties
  [format content]
  (let [built-in-properties* (built-in-properties)
        content (reduce (fn [content key]
                          (remove-property format key content)) content built-in-properties*)]
    (if (= format :org)
      (string/replace-first content (re-pattern ":PROPERTIES:\n:END:\n*") "")
      content)))

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
                                 (let [[k v] (util/split-first ":" (subs text 1))]
                                   (if (and k v)
                                     (let [k (string/replace k "_" "-")
                                           compare-k (keyword (string/lower-case k))
                                           k (if (contains? #{:id :custom_id :custom-id} compare-k) "id" k)
                                           k (if (contains? #{:last-modified-at} compare-k) "updated-at" k)]
                                       (str k ":: " (string/trim v)))
                                     text)))))
              after (subvec lines (inc end-idx))
              lines (concat before middle after)]
          (string/join "\n" lines))
        content))
    content))

(defn add-page-properties
  [page-format properties-content properties]
  (let [properties (medley/map-keys name properties)
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

(defn properties-ast?
  [block]
  (and
   (vector? block)
   (contains? #{"Property_Drawer" "Properties"}
              (first block))))

(defonce non-parsing-properties
  (atom #{"background-color" "background_color"}))

(defn parse-property
  [k v]
  (let [k (name k)
        v (if (or (symbol? v) (keyword? v)) (name v) (str v))
        v (string/trim v)]
    (cond
      (contains? #{"title" "filters"} k)
      v

      (= v "true")
      true
      (= v "false")
      false

      (util/safe-re-find #"^\d+$" v)
      (util/safe-parse-int v)

      (util/wrapped-by-quotes? v) ; wrapped in ""
      (util/unquote-string v)

      (contains? @non-parsing-properties (string/lower-case k))
      v

      (string/starts-with? v "http")
      v

      :else
      (text/split-page-refs-without-brackets v))))
