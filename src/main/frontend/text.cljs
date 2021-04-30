(ns frontend.text
  (:require [frontend.config :as config]
            [frontend.util :as util]
            [clojure.string :as string]
            [clojure.set :as set]))

(defonce properties-start ":PROPERTIES:")
(defonce properties-end ":END:")

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

(defn- concat-nested-pages
  [coll]
  (loop [coll coll
         result []]
    (if (seq coll)
      (let [item (first coll)]
        (if (= item "]]")
          (recur (rest coll)
                 (conj
                  (vec (butlast result))
                  (str (last result) item)))
          (recur (rest coll) (conj result item))))
      result)))

(defn split-page-refs-without-brackets
  ([s]
   (split-page-refs-without-brackets s false))
  ([s comma?]
   (cond
     (and (string? s)
            ;; Either a page ref, a tag or a comma separated collection
            (or (re-find page-ref-re s)
                (re-find (if comma? #"[\,|，|#]+" #"#") s)))
     (let [result (->> (string/split s page-ref-re-2)
                       (remove string/blank?)
                       concat-nested-pages
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
      (re-find (re-pattern pattern) text))
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

(defn append-newline-after-level-spaces
  [text format]
  (if-not (string/blank? text)
    (let [pattern (util/format
                   "^[%s]+\\s?\n?"
                   (config/get-block-pattern format))
          matched-text (re-find (re-pattern pattern) text)]
      (if matched-text
        (string/replace-first text matched-text (str (string/trimr matched-text) "\n"))
        text))))

;; properties

(def hidden-properties
  (set/union
   #{:id :custom-id :background-color :heading :collapsed}
   config/markers))

(defn properties-hidden?
  [properties]
  (and (seq properties)
       (let [ks (map (comp keyword string/lower-case name) (keys properties))]
         (every? hidden-properties ks))))

(defn contains-properties?
  [content]
  (and (string/includes? content properties-start)
       (string/includes? content properties-end)))

(defn simplified-property?
  [line]
  (some? (first (util/split-first ":: " line))))

(defn remove-properties!
  [format content]
  (let [org? (= format :org)]
    (cond
      (contains-properties? content)
      (let [lines (string/split-lines content)
            [title-lines properties-and-body] (split-with (fn [l] (not (string/starts-with? (string/upper-case (string/triml l)) ":PROPERTIES:"))) lines)
            body (drop-while (fn [l]
                               (let [l' (string/lower-case (string/trim l))]
                                 (or
                                  (and (string/starts-with? l' ":")
                                       (not (string/starts-with? l' ":end:")))
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
            non-properties (get (group-by simplified-property? lines) false)]
        (string/join "\n" non-properties))

      :else
      content)))

(defn build-properties-str
  [format properties]
  (when (seq properties)
    (let [org? (= format :org)
          kv-format (if org? ":%s: %s" "%s:: %s")
          full-format (if org? ":PROPERTIES:\n%s\n:END:\n" "%s\n")
          properties-content (->> (map (fn [[k v]] (util/format kv-format k v)) properties)
                                  (string/join "\n"))]
      (util/format full-format properties-content))))

(defn insert-property!
  [format content key value]
  (when (and (not (string/blank? (name key)))
             (not (string/blank? (str value))))
    (let [org? (= :org format)
          key (string/lower-case (name key))
          value (string/trim (str value))
          lines (string/split-lines content)
          start-idx (.indexOf lines properties-start)
          end-idx (.indexOf lines properties-end)]
      (cond
        (and org? (not (contains-properties? content)))
        (let [properties (build-properties-str format {key value})
              [title body] (util/safe-split-first "\n" content)]
          (str title "\n" properties body))

        (and (>= start-idx 0) (> end-idx 0) (> end-idx start-idx))
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
              lines (concat before middle after)]
          (string/join "\n" lines))

        (not org?)
        (let [exists? (atom false)
              new-property-s (str key ":: "  value)
              groups (partition-by simplified-property? lines)
              no-properties? (and (= 1 (count groups))
                                  (not (simplified-property? (ffirst groups))))
              lines (mapcat (fn [lines]
                              (if (simplified-property? (first lines))
                                (let [lines (doall
                                             (mapv (fn [text]
                                                     (let [[k v] (util/split-first ":: " text)]
                                                       (if (and k v)
                                                         (let [key-exists? (= k key)
                                                               _ (when key-exists? (reset! exists? true))
                                                               v (if key-exists? value v)]
                                                           (str k ":: "  (string/trim v)))
                                                         text)))
                                                   lines))
                                      lines (if @exists? lines (conj lines new-property-s))]
                                  lines)
                                lines))
                            groups)
              lines (if no-properties?
                      (if (string/blank? content)
                        [new-property-s]
                        (cons (first lines) (cons new-property-s (rest lines))))
                      lines)]
          (string/join "\n" lines))

        :else
        content))))

(defn remove-property!
  ([format key content]
   (remove-property! format key content true))
  ([format key content first?]
   (when (not (string/blank? (name key)))
     (let [format (or format :markdown)
           key (string/lower-case (name key))
           remove-f (if first? util/remove-first remove)]
       (if-not (and (= format :org) (contains-properties? content))
         content
         (let [lines (->> (string/split-lines content)
                          (remove-f (fn [line]
                                      (let [s (string/triml (string/lower-case line))]
                                        (or (string/starts-with? s (str ":" key ":"))
                                            (string/starts-with? s (str key ":: ")))))))]
           (string/join "\n" lines)))))))

(defn remove-id-property!
  [format content]
  (remove-property! format "id" content false))

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
                                     (str k ":: " (string/trim v))
                                     text)))))
              after (subvec lines (inc end-idx))
              lines (concat before middle after)]
          (string/join "\n" lines))
        content))
    content))

(defn build-data-value
  [col]
  (let [items (map (fn [item] (str "\"" item "\"")) col)]
    (util/format "[%s]"
                 (string/join ", " items))))

(defn image-link?
  [img-formats s]
  (some (fn [fmt] (re-find (re-pattern (str "(?i)\\." fmt "(?:\\?([^#]*))?(?:#(.*))?$")) s)) img-formats))
