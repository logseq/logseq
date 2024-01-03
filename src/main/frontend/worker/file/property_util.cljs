(ns frontend.worker.file.property-util
  "Property fns needed by the rest of the app and not graph-parser"
  (:require [clojure.string :as string]
            [logseq.common.util :as common-util]
            [logseq.graph-parser.property :as gp-property :refer [properties-start properties-end]]
            [frontend.worker.mldoc :as worker-mldoc]
            [frontend.worker.util :as util]))

(defn- build-properties-str
  [format properties]
  (when (seq properties)
    (let [org? (= format :org)
          kv-format (if org? ":%s: %s" (str "%s" gp-property/colons " %s"))
          full-format (if org? ":PROPERTIES:\n%s\n:END:" "%s\n")
          properties-content (->> (map (fn [[k v]] (common-util/format kv-format (name k) v)) properties)
                                  (string/join "\n"))]
      (common-util/format full-format properties-content))))

(defn simplified-property?
  [line]
  (boolean
   (and (string? line)
        (re-find (re-pattern (str "^\\s?[^ ]+" gp-property/colons)) line))))

(defn- front-matter-property?
  [line]
  (boolean
   (and (string? line)
        (common-util/safe-re-find #"^\s*[^ ]+:" line))))

(defn insert-property
  "Only accept nake content (without any indentation)"
  ([repo format content key value]
   (insert-property repo format content key value false))
  ([repo format content key value front-matter?]
   (when (string? content)
     (let [ast (worker-mldoc/->edn repo content format)
           title? (worker-mldoc/block-with-title? (ffirst (map first ast)))
           has-properties? (or (and title?
                                    (or (worker-mldoc/properties? (second ast))
                                        (worker-mldoc/properties? (second
                                                            (remove
                                                             (fn [[x _]]
                                                               (contains? #{"Hiccup" "Raw_Html"} (first x)))
                                                             ast)))))
                               (worker-mldoc/properties? (first ast)))
           lines (string/split-lines content)
           [title body] (worker-mldoc/get-title&body repo content format)
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
                      (string/join "\n" lines))

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
       (if (and (= format :org) (not (gp-property/contains-properties? content)))
         content
         (let [lines (->> (string/split-lines content)
                          (remove-f (fn [line]
                                      (let [s (string/triml (string/lower-case line))]
                                        (or (string/starts-with? s (str ":" key ":"))
                                            (string/starts-with? s (str key gp-property/colons " ")))))))]
           (string/join "\n" lines)))))))

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
