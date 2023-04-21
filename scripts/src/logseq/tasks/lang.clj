(ns logseq.tasks.lang
  "Tasks related to language translations"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.dicts :as dicts]
            [frontend.modules.shortcut.dicts :as shortcut-dicts]
            [logseq.tasks.util :as task-util]
            [babashka.cli :as cli]
            [babashka.process :refer [shell]]))

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
                 (task-util/print-usage "LOCALE [--copy]"))
        options (cli/parse-opts (rest args) {:coerce {:copy :boolean}})
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
      (let [sorted-missing (->> all-missing
                                (mapcat (fn [[m file]]
                                          (map (fn [[k v]]
                                                 {:translation-key k
                                                  ;; Shorten values
                                                  :string-to-translate (shorten v 50)
                                                  :file file})
                                               m)))
                                (sort-by (juxt :file :translation-key)))]
        (if (:copy options)
          (doseq [[file missing-for-file] (group-by :file sorted-missing)]
            (println "\n;; For" file)
            (doseq [{:keys [translation-key string-to-translate]} missing-for-file]
              (println translation-key (pr-str string-to-translate))))
          (task-util/print-table sorted-missing))))))

(defn- validate-non-default-languages
  "This validation finds any translation keys that don't exist in the default
  language English. Logseq needs to work out of the box with its default
  language. This catches mistakes where another language has accidentally typoed
  keys or added ones without updating :en"
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
      (println "All non-default translations have valid keys!")
      (do
        (println "\nThese translation keys are invalid because they don't exist in English:")
        (task-util/print-table invalid-dicts)
        (System/exit 1)))))

;; Command to check for manual entries:
;; grep -E -oh  '\(t [^ ):]+' -r src/main
(def manual-ui-dicts
  "Manual list of ui translations because they are dynamic i.e. keyword isn't
  first arg. Only map values are used in linter as keys are for easily scanning
  grep result."

  {"(t (shortcut-helper/decorate-namespace" [] ;; shortcuts related so can ignore
   "(t (keyword" [:color/yellow :color/red :color/pink :color/green :color/blue
                  :color/purple :color/gray]
   ;; from 3 files
   "(t (if" [:asset/show-in-folder :asset/open-in-browser
             :search-item/whiteboard :search-item/page
             :page/make-private :page/make-public]
   "(t (name" [] ;; shortcuts related
   "(t (dh/decorate-namespace" [] ;; shortcuts related
   "(t prompt-key" [:select/default-prompt :select/default-select-multiple :select.graph/prompt]
   ;; All args to ui/make-confirm-modal are not keywords
   "(t title" []
   "(t subtitle" [:asset/physical-delete]})

(defn- validate-ui-translations-are-used
  "This validation checks to see that translations done by (t ...) are equal to
  the ones defined for the default :en lang. This catches translations that have
  been added in UI but don't have an entry or translations no longer used in the UI"
  []
  (let [actual-dicts (->> (shell {:out :string}
                                 ;; This currently assumes all ui translations
                                 ;; use (t and src/main. This can easily be
                                 ;; tweaked as needed
                                 "grep -E -oh '\\(t :[^ )]+' -r src/main")
                          :out
                          string/split-lines
                          (map #(keyword (subs % 4)))
                          (concat (mapcat val manual-ui-dicts))
                          set)
        expected-dicts (set (keys (:en (get-dicts))))
        actual-only (set/difference actual-dicts expected-dicts)
        expected-only (set/difference expected-dicts actual-dicts)]
    (if (and (empty? actual-only) (empty? expected-only))
      (println "All defined :en translation keys match the ones that are used!")
      (do
        (when (seq actual-only)
          (println "\nThese translation keys are invalid because they are used in the UI but not defined:")
          (task-util/print-table (map #(hash-map :invalid-key %) actual-only)))
        (when (seq expected-only)
          (println "\nThese translation keys are invalid because they are not used in the UI:")
          (task-util/print-table (map #(hash-map :invalid-key %) expected-only)))
        (System/exit 1)))))

(defn validate-translations
  "Runs multiple translation validations that fail fast if one of them is invalid"
  []
  (validate-non-default-languages)
  (validate-ui-translations-are-used))

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
