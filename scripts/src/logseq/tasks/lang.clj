(ns logseq.tasks.lang
  "Tasks related to language translations"
  (:require [logseq.rewrite-clj :as rewrite-clj]
            [clojure.set :as set]
            [logseq.tasks.util :as task-util]))

(defn- get-dicts
  []
  (dissoc (rewrite-clj/var-sexp ["dicts" "src/main/frontend/dicts.cljs"])
          :tongue/fallback))

(defn- get-languages
  []
  (rewrite-clj/var-sexp ["languages" "src/main/frontend/dicts.cljs"]))

(defn list-langs
  "List translated langagues with their number of translations"
  []
  (let [dicts (get-dicts)
        en-count (count (dicts :en))
        langs (into {} (map (juxt :value :label) (get-languages)))]
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
        dicts (get-dicts)
        translated-language (dicts lang)
        _ (when-not translated-language
            (println "Language" lang "does not have an entry in dicts.cljs")
            (System/exit 1))
        missing (set/difference (set (keys (dicts :en)))
                                (set (keys translated-language)))]
    (if (zero? (count missing))
      (println "Language" lang "is fully translated!")
      (->> (select-keys (dicts :en) missing)
           (map (fn [[k v]]
                  {:translation-key k
                   ;; Shorten values
                   :string-to-translate (shorten v 50)}))
           task-util/print-table))))

(defn invalid-dicts
  "Lists translation keys that don't exist in English"
  []
  (let [dicts (get-dicts)
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
      (println "All dicts have valid keys!")
      (do
        (println "Invalid dict keys found:")
        (task-util/print-table invalid-dicts)
        (System/exit 1)))))

(defn list-duplicates
  "Lists translations that aren't any different than English"
  [& args]
  (let [dicts (get-dicts)
        en-dicts (dicts :en)
        lang (or (keyword (first args))
                 (task-util/print-usage "LOCALE"))
        lang-dicts (dicts lang)
        invalid-dicts
        (sort-by
         :invalid-key
         (keep
          #(when (= (en-dicts %) (lang-dicts %))
             {:invalid-key %
              :repeat-value (shorten (lang-dicts %) 70)})
          (keys lang-dicts)))]
    (if (empty? invalid-dicts)
      (println "No duplicated keys found!")
      (do
        (println "Keys with duplicate values found:")
        (task-util/print-table invalid-dicts)
        (System/exit 1)))))
