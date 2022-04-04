(ns logseq.tasks.lang
  "Tasks related to language translations"
  (:require [clojure.set :as set]
            [frontend.dicts :as dicts]
            [frontend.modules.shortcut.dicts :as shortcut-dicts]
            [logseq.tasks.util :as task-util]))

(defn- get-dicts
  []
  (dissoc dicts/dicts :tongue/fallback))

(defn- get-all-dicts
  []
  (merge-with merge (get-dicts) shortcut-dicts/dicts))

(defn- get-languages
  []
  (->> dicts/languages
       (map (juxt :value :label))
       (into {})))

(defn list-langs
  "List translated langagues with their number of translations"
  []
  (let [dicts (get-all-dicts)
        en-count (count (dicts :en))
        langs (get-languages)]
    (->> dicts
         (map (fn [[locale dicts]]
                [locale
                 (Math/round (* 100.0 (/ (count dicts) en-count)))
                 (count dicts)
                 (langs locale)]))
         (sort-by #(nth % 2) >)
         (map #(zipmap [:locale :percent-translated :translation-count :language] %))
         task-util/print-table)))

(defn- shorten [s length]
  (if (< (count s) length)
    s
    (str (subs s 0 length) "...")))

(defn list-missing
  "List missing translations for a given language"
  [& args]
  (let [lang (or (keyword (first args))
                 (task-util/print-usage "LOCALE"))
        _ (when-not (contains? (get-languages) lang)
            (println "Language" lang "does not have an entry in dicts.cljs")
            (System/exit 1))
        all-dicts [[(get-dicts) "frontend/dicts.cljs"]
                   [shortcut-dicts/dicts "shortcut/dicts.cljs"]]
        all-missing (map (fn [[dicts file]]
                           [(select-keys (dicts :en)
                                         (set/difference (set (keys (dicts :en)))
                                                         (set (keys (dicts lang)))))
                            file])
                         all-dicts)]
    (if (every? (comp zero? count first) all-missing)
      (println "Language" lang "is fully translated!")
      (->> all-missing
           (mapcat (fn [[m file]]
                     (map (fn [[k v]]
                            {:translation-key k
                             ;; Shorten values
                             :string-to-translate (shorten v 50)
                             :file file})
                          m)))
           (sort-by (juxt :file :translation-key))
           task-util/print-table))))

(defn invalid-translations
  "Lists translation that don't exist in English"
  []
  (let [dicts (get-all-dicts)
        ;; For now defined as :en but clj-kondo analysis could be more thorough
        valid-keys (set (keys (dicts :en)))
        invalid-dicts
        (->> (dissoc dicts :en)
             (mapcat (fn [[lang get-dicts]]
                       (map
                        #(hash-map :language lang :invalid-key %)
                        (set/difference (set (keys get-dicts))
                                        valid-keys)))))]
    (if (empty? invalid-dicts)
      (println "All translations have valid keys!")
      (do
        (println "Invalid translation keys found:")
        (task-util/print-table invalid-dicts)
        (System/exit 1)))))

(defn list-duplicates
  "Lists translations that are the same as the one in English"
  [& args]
  (let [dicts (get-all-dicts)
        en-dicts (dicts :en)
        lang (or (keyword (first args))
                 (task-util/print-usage "LOCALE"))
        lang-dicts (dicts lang)
        invalid-dicts
        (sort-by
         :translation-key
         (keep
          #(when (= (en-dicts %) (lang-dicts %))
             {:translation-key %
              :duplicate-value (shorten (lang-dicts %) 70)})
          (keys lang-dicts)))]
    (if (empty? invalid-dicts)
      (println "No duplicated keys found!")
      (do
        (println "Keys with duplicate values found:")
        (task-util/print-table invalid-dicts)
        (System/exit 1)))))
