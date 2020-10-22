(ns frontend.text
  (:require [frontend.config :as config]
            [frontend.util :as util]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.db :as db]))

(defn remove-level-spaces
  [text format]
  (if-not (string/blank? text)
    (let [pattern (util/format
                   "^[%s]+\\s?"
                   (config/get-block-pattern format))]
      (string/replace-first text (re-pattern pattern) ""))
    ""))

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
  #{"custom_id" "heading" "background_color"})

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
                           (or
                            (string/starts-with? (string/triml l) ":") ; kv
                            (string/starts-with? (string/upper-case (string/triml l)) ":end:")))
                         properties-and-body)]
    (->> (concat title-lines body)
         (string/join "\n"))))

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

(defn re-construct-block-properties
  [block content properties]
  (if (and (contains-properties? content)
           ;; not changed
           (= (:block/properties (db/entity [:block/uuid (:block/uuid block)]))
              properties))
    content
    (-> (remove-properties! content)
        (rejoin-properties properties))))

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
