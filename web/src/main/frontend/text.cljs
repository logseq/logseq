(ns frontend.text
  (:require [frontend.config :as config]
            [frontend.util :as util]
            [clojure.string :as string]))

(defn remove-level-spaces
  [text format]
  (if-not (string/blank? text)
    (let [pattern (util/format
                   "^[%s]+\\s?"
                   (config/get-block-pattern format))]
      (string/replace-first text (re-pattern pattern) ""))))

(defn remove-properties!
  [block content]
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
    (let [properties-content (->> (map (fn [[k v]] (util/format "   :%s: %s" k v)) properties)
                                  (string/join "\n"))]
      (util/format "   :PROPERTIES:\n%s\n   :END:\n"
                   properties-content))))

(defn rejoin-properties
  [content properties]
  (let [[title body] (util/safe-split-first "\n" content)
        properties (build-properties-str properties)]
    (str title "\n" properties body)))
