(ns frontend.lazy-translate
  "A tongue translate fn that compiles a language's dictionary the first time
  that language is translated. tongue/build-translate compiles every
  language it is given at once; over all shipped languages that took about
  400 ms of every renderer start and 280 ms of every Electron main process
  start, though only English and the user's language are read."
  (:require [clojure.string :as string]
            [tongue.core :as tongue]))

(defn- locale-and-parents
  "`locale` and the tags tongue falls back through for it: :zh-CN -> :zh-CN :zh."
  [locale]
  (let [parts (string/split (name locale) #"-")]
    (map #(keyword (string/join "-" (take % parts))) (range (count parts) 0 -1))))

(defn build-translate
  "Like tongue/build-translate over `all-dicts`, but each locale gets a
  translator built on first use from its own dicts, its parent tags and the
  fallback, the only dicts tongue reads for it, so every answer is the one
  the translator over all languages gives."
  [all-dicts]
  (let [fallback (:tongue/fallback all-dicts)
        cache (atom {})
        translator (fn [locale]
                     (or (get @cache locale)
                         (let [langs (cond-> (set (locale-and-parents locale))
                                       fallback (conj fallback))
                               f (tongue/build-translate
                                  (merge (select-keys all-dicts langs)
                                         (select-keys all-dicts [:tongue/fallback])))]
                           (swap! cache assoc locale f)
                           f)))]
    (fn [locale & args]
      (apply (translator locale) locale args))))
