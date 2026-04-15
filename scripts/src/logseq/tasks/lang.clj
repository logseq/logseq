(ns logseq.tasks.lang
  "Tasks related to language translations"
  (:require [babashka.cli :as cli]
            [babashka.fs :as fs]
            [babashka.process :refer [shell]]
            [borkdude.rewrite-edn :as rewrite]
            [clojure.set :as set]
            [clojure.string :as string]
            [frontend.dicts :as dicts]
            [logseq.tasks.lang-lint :as lang-lint]
            [logseq.tasks.util :as task-util]
            [rewrite-clj.node :as node]))

(defn- get-dicts
  []
  dicts/dicts)

(defn- get-languages
  []
  (->> dicts/languages
       (map (juxt :value :label))
       (into {})))

(defn list-langs
  "List translated languages with their number of translations"
  []
  (let [dicts (get-dicts)
        en-count (count (dicts :en))
        langs (get-languages)]
    (->> dicts
         (map (fn [[locale dicts]]
                [locale
                 (format "%.2f" (* 100.0 (/ (count dicts) en-count)))
                 (count dicts)
                 (langs locale)]))
         (sort-by #(nth % 2) >)
         (map #(zipmap [:locale :percent-translated :translation-count :language] %))
         task-util/print-table)))

(defn- shorten [s length]
  (if (< (count s) length)
    s
    (string/replace (str (subs s 0 length) "...")
                    ;; Keep shortened table rows single-line for multi-line translations.
                    "\n" "\\n")))

(defn list-missing
  "List missing translations for a given language"
  [& args]
  (let [lang (or (keyword (first args))
                 (task-util/print-usage "LOCALE [--copy]"))
        options (cli/parse-opts (rest args) {:coerce {:copy :boolean}})
        _ (when-not (contains? (get-languages) lang)
            (println "Language" lang "does not have an entry in frontend.dicts/languages")
            (System/exit 1))
        dicts (get-dicts)
        all-missing (select-keys (dicts :en)
                                 (set/difference (set (keys (dicts :en)))
                                                 (set (keys (dicts lang)))))]
    (if (-> all-missing count zero?)
      (println "Language" lang "is fully translated!")
      (let [sorted-missing (->> all-missing
                                (map (fn [[k v]]
                                       {:translation-key k
                                        :string-to-translate v
                                        :file (str "dicts/" (-> lang name string/lower-case) ".edn")}))
                                (sort-by (juxt :file :translation-key)))]
        (if (:copy options)
          (doseq [[file missing-for-file] (group-by :file sorted-missing)]
            (println "\n;; For" file)
            (doseq [{:keys [translation-key string-to-translate]} missing-for-file]
              (println translation-key (pr-str string-to-translate))))
          (task-util/print-table
           ;; Shorten values
           (map #(update % :string-to-translate shorten 50) sorted-missing)))))))

(defn- delete-invalid-non-default-languages
  [invalid-keys-by-lang]
  (doseq [[lang invalid-keys] invalid-keys-by-lang]
    (let [path (fs/path "src/resources/dicts" (str (name lang) ".edn"))
          result (rewrite/parse-string (String. (fs/read-all-bytes path)))
          new-content (str (reduce
                            (fn [result k]
                              (rewrite/dissoc result k))
                            result invalid-keys))]
      (spit (fs/file path) new-content))))

(def ^:private dicts-dir
  (fs/path "src/resources/dicts"))

(def ^:private ignored-dict-node-tags
  #{:comment :newline :whitespace})

(defn- ignored-dict-node?
  [node]
  (contains? ignored-dict-node-tags (node/tag node)))

(defn- dict-map-node
  [root]
  (->> (:children root)
       (remove ignored-dict-node?)
       first))

(defn- parse-dict-entries
  [text]
  (let [root (rewrite/parse-string text)
        map-node (dict-map-node root)]
    (when-not (= :map (node/tag map-node))
      (println "Expected a top-level map in dictionary file.")
      (System/exit 1))
    (let [entry-nodes (->> (:children map-node)
                           (remove ignored-dict-node?))]
      (when (odd? (count entry-nodes))
        (println "Encountered an uneven number of top-level dictionary nodes.")
        (System/exit 1))
      (mapv (fn [[key-node value-node]]
              {:key (rewrite/sexpr key-node)
               :value-node value-node})
            (partition 2 entry-nodes)))))

(defn- render-dict-entry
  [{:keys [key value-node]}]
  (str " " key " " value-node))

(defn- key-namespace-root
  [key]
  (some-> key namespace (string/split #"\.") first))

(defn- key-leaf
  [key]
  (name key))

(defn- compare-dict-keys
  [key-a key-b]
  (let [namespace-a (namespace key-a)
        namespace-b (namespace key-b)
        root-a (key-namespace-root key-a)
        root-b (key-namespace-root key-b)
        root-diff (compare root-a root-b)]
    (cond
      (not= 0 root-diff)
      root-diff

      (not= namespace-a root-a)
      (if (= namespace-b root-b) 1
          (let [namespace-diff (compare namespace-a namespace-b)]
            (if (zero? namespace-diff)
              (compare (key-leaf key-a) (key-leaf key-b))
              namespace-diff)))

      (not= namespace-b root-b)
      -1

      :else
      (compare (key-leaf key-a) (key-leaf key-b)))))

(defn- render-dict
  [entries]
  (let [sorted-entries (sort #(neg? (compare-dict-keys (:key %1) (:key %2))) entries)
        lines (loop [remaining sorted-entries
                     previous-namespace nil
                     acc ["{"]]
                (if-let [{:keys [key] :as entry} (first remaining)]
                  (let [current-namespace (namespace key)
                        acc (cond-> acc
                              (and previous-namespace
                                   (not= previous-namespace current-namespace))
                              (conj "")
                              true
                              (conj (render-dict-entry entry)))]
                    (recur (next remaining) current-namespace acc))
                  (conj acc "}")))]
    (str (string/join "\n" lines) "\n")))

(defn- dict-file-paths
  []
  (->> (fs/list-dir dicts-dir)
       (filter #(string/ends-with? (str %) ".edn"))
       (sort-by fs/file-name)))

(defn format-dicts
  "Formats dictionary files by full-key sort order and inserts a blank line
   between namespace groups. Use --check to fail when any file would change."
  [& args]
  (let [check? (contains? (set args) "--check")
        changed? (volatile! false)]
    (doseq [path (dict-file-paths)]
      (let [file-name (fs/file-name path)
            current-text (slurp (str path))
            output-text (-> current-text
                            parse-dict-entries
                            render-dict)]
        (if (= current-text output-text)
          (println file-name ": already formatted")
          (do
            (vreset! changed? true)
            (if check?
              (println file-name "would change")
              (do
                (spit (str path) output-text)
                (println file-name ": formatted")))))))
    (when (and check? @changed?)
      (System/exit 1))))

(defn- validate-non-default-languages
  "This validation finds any translation keys that don't exist in the default
  language English. Logseq needs to work out of the box with its default
  language. This catches mistakes where another language has accidentally typoed
  keys or added ones without updating :en"
  [fix?]
  (let [dicts (get-dicts)
        ;; For now defined as :en but clj-kondo analysis could be more thorough
        valid-keys (set (keys (dicts :en)))
        invalid-dicts
        (->> (dissoc dicts :en)
             (mapcat (fn [[lang lang-dicts]]
                       (map
                        #(hash-map :language lang :invalid-key %)
                        (set/difference (set (keys lang-dicts))
                                        valid-keys)))))]
    (if (empty? invalid-dicts)
      (println "All non-default translations have valid keys!")
      (do
        (println "\nThese translation keys are invalid because they don't exist in English:")
        (task-util/print-table invalid-dicts)
        (when fix?
          (delete-invalid-non-default-languages
           (update-vals (group-by :language invalid-dicts) #(map :invalid-key %)))
          (println "These invalid translation keys have been removed from non-default dictionaries."))
        (System/exit 1)))))

(def ^:private i18n-lint-launcher-path
  (fs/absolutize "bin/logseq-i18n-lint"))

(def ^:private i18n-lint-config-path
  (fs/absolutize ".i18n-lint.toml"))

(defn- ensure-i18n-lint-ready!
  []
  (when-not (fs/exists? i18n-lint-launcher-path)
    (println "logseq-i18n-lint launcher not found at" (str i18n-lint-launcher-path))
    (System/exit 1))
  (when-not (fs/exists? i18n-lint-config-path)
    (println "i18n lint config not found at" (str i18n-lint-config-path))
    (System/exit 1)))

(defn- run-i18n-lint-command!
  [subcommand cli-args]
  (ensure-i18n-lint-ready!)
  (let [cmd (into ["bash"
                   (str i18n-lint-launcher-path)
                   "-c"
                   (str i18n-lint-config-path)
                   subcommand]
                  cli-args)
        result (apply shell {:continue true
                             :out :inherit
                             :err :inherit}
                      cmd)]
    (when (pos? (:exit result))
      (System/exit (:exit result)))))

(defn- check-translation-keys
  "Use logseq-i18n-lint to detect unused translation keys."
  [args]
  (run-i18n-lint-command! "check-keys" args))

(defn- validate-rich-translations
  "Checks that localized rich translations remain rich zero-arg functions.
   Missing translations are allowed, but once a locale defines a rich key it
   must preserve the same renderable contract as English."
  []
  (let [invalid-dicts (lang-lint/rich-translation-mismatch-findings (get-dicts))]
    (if (empty? invalid-dicts)
      (println "All rich translations preserve English render contracts!")
      (do
        (println "These translation keys are invalid because they no longer preserve English rich render contracts:")
        (task-util/print-table invalid-dicts)
        (System/exit 1)))))

(defn- validate-translation-placeholders
  "Checks that every localized string uses the same placeholder set as English.
   Missing translations are allowed because Tongue falls back to :en, but once
   a locale defines a string it must preserve the placeholder contract."
  []
  (let [invalid-dicts (lang-lint/placeholder-mismatch-findings (get-dicts))]
    (if (empty? invalid-dicts)
      (println "All translations preserve English placeholder contracts!")
      (do
        (println "These translation keys are invalid because their placeholders do not match English:")
        (task-util/print-table
         (map #(dissoc % :default-value :localized-value) invalid-dicts))
        (System/exit 1)))))

(defn validate-translations
  "Runs multiple translation validations that fail fast if one of them is invalid"
  [& args]
  (validate-non-default-languages (contains? (set args) "--fix"))
  (check-translation-keys args)
  (validate-rich-translations)
  (validate-translation-placeholders))

(defn lint-hardcoded
  "Run logseq-i18n-lint to lint likely hardcoded user-facing strings in UI-oriented source files.
   Use -w or --warn-only to report findings without failing and -g or --git-changed to scan
   only files changed in git status."
  [& args]
  (run-i18n-lint-command! "lint" args))
