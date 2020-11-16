(ns frontend.text
  (:require [frontend.config :as config]
            [frontend.util :as util]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.db :as db]))

(defn remove-level-spaces
  ([text format]
   (remove-level-spaces text format false))
  ([text format space?]
   (if-not (string/blank? text)
     (let [pattern (util/format
                    (if space?
                      "^[%s]+\\s+"
                      "^[%s]+\\s?")
                    (config/get-block-pattern format))]
       (string/replace-first text (re-pattern pattern) ""))
     "")))

(defn append-newline-after-level-spaces
  [text format]
  (if-not (string/blank? text)
    (let [pattern (util/format
                   "^[%s]+\\s?"
                   (config/get-block-pattern format))
          matched-text (re-find (re-pattern pattern) text)]
      (if matched-text
        (string/replace-first text matched-text (str (string/trimr matched-text) "\n"))
        text))))

;; properties

(def hidden-properties
  (set/union
   #{"id" "custom_id" "heading" "background_color"}
   config/markers))

(defn properties-hidden?
  [properties]
  (and (seq properties)
       (let [ks (map string/lower-case (keys properties))]
         (every? hidden-properties ks))))

(defn remove-properties!
  [content]
  (let [lines (string/split-lines content)
        [title-lines properties-and-body] (split-with (fn [l] (not (string/starts-with? (string/upper-case (string/triml l)) ":PROPERTIES:"))) lines)
        body (drop-while (fn [l]
                           (let [l' (string/lower-case (string/trim l))]
                             (and (string/starts-with? l' ":")
                                  (not (string/starts-with? l' ":end:")))))
                         properties-and-body)
        body (if (and (seq body)
                      (string/starts-with? (string/lower-case (string/triml (first body))) ":end:"))
               (let [line (string/replace (first body) #"(?i):end:\s?" "")]
                 (if (string/blank? line)
                   (rest body)
                   (cons line (rest body))))
               body)]
    (->> (concat title-lines body)
         (string/join "\n"))))

(defn remove-id-property
  [content]
  (let [lines (->> (string/split-lines content)
                   (remove #(let [s (string/lower-case (string/trim %))]
                              (and
                               (or (string/starts-with? s ":id:")
                                   (string/starts-with? s ":custom_id:"))
                               (let [id (and
                                         (> (count s) 36)
                                         (subs s (- (count s) 36)))]
                                 (and id (util/uuid-string? id)))))))]
    (string/join "\n" lines)))

(defn build-properties-str
  [properties]
  (when (seq properties)
    (let [properties-content (->> (map (fn [[k v]] (util/format ":%s: %s" k v)) properties)
                                  (string/join "\n"))]
      (util/format ":PROPERTIES:\n%s\n:END:\n"
                   properties-content))))

(defn rejoin-properties
  ([content properties]
   (rejoin-properties content properties true))
  ([content properties remove-blank?]
   (let [properties (if (= (get properties "heading") "false")
                      (dissoc properties "heading")
                      properties)
         properties (if remove-blank?
                      (remove (fn [[k _v]] (string/blank? k)) properties)
                      properties)
         [title body] (util/safe-split-first "\n" content)
         properties (build-properties-str properties)]
     (str title "\n" properties body))))

(defn contains-properties?
  [s]
  (let [lines (set (map string/trim (string/split-lines s)))]
    (when (seq lines)
      (set/subset? #{":PROPERTIES:" ":END:"} lines))))

;; FIXME:
(defn get-properties-text
  [text]
  (let [start (or (string/index-of text ":PROPERTIES:")
                  (string/index-of text ":properties:"))
        end (or (string/index-of text ":END:")
                (string/index-of text ":end:"))]
    (when (and start end)
      (subs text start (+ end 5)))))

(defn re-construct-block-properties
  [block content properties]
  (let [content' (-> (remove-level-spaces content (:block/format block))
                     (string/trim)
                     (string/lower-case))
        properties-text (get-properties-text content)]
    (if (or
         (and
          properties-text
          (string/starts-with? content' (string/lower-case properties-text)))
         (and (contains-properties? content)
              ;; not changed
              (= (:block/properties (db/entity [:block/uuid (:block/uuid block)]))
                 properties)))
      content
      (-> (remove-properties! content)
          (rejoin-properties properties)))))

(defn insert-property
  [content key value]
  (when (and (not (string/blank? key))
             (not (string/blank? value)))
    (let [key (string/lower-case key)
          [title body] (util/safe-split-first "\n" content)]
      (if-not (contains-properties? content)
        (let [properties (build-properties-str {key value})]
          (str title "\n" properties body))
        (let [lines (string/split-lines content)
              [title-lines properties-and-body] (split-with (fn [l] (not (string/starts-with? (string/upper-case (string/triml l)) ":PROPERTIES:"))) lines)
              properties? (fn [l]
                            (or
                             (string/starts-with? (string/triml l) ":") ; kv
                             (string/starts-with? (string/upper-case (string/triml l)) ":end:")))
              properties (take-while properties? properties-and-body)
              exists? (atom false)
              new-line (util/format ":%s: %s" key value)
              new-properties (doall
                              (map (fn [l]
                                     (if (string/starts-with? (string/triml l) (str ":" key ":"))
                                       (do
                                         (reset! exists? true)
                                         (util/format ":%s: %s" key value))
                                       l)) properties))
              new-properties (if @exists?
                               new-properties
                               (concat
                                (drop-last new-properties)
                                [(util/format ":%s: %s" key value)
                                 (last new-properties)]))
              body (drop-while properties? properties-and-body)]
          (->> (concat title-lines new-properties body)
               (string/join "\n")))))))
