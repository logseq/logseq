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
            [logseq.tasks.util :as task-util]))

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
                 (Math/round (* 100.0 (/ (count dicts) en-count)))
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

(defn- validate-non-default-languages
  "This validation finds any translation keys that don't exist in the default
  language English. Logseq needs to work out of the box with its default
  language. This catches mistakes where another language has accidentally typoed
  keys or added ones without updating :en"
  [{:keys [fix?]}]
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

(def ^:private direct-translation-call-source-paths
  ["src/main" "src/electron"])

(def ^:private translated-code-source-paths
  ["deps" "src/main" "src/electron"])

(def ^:private shortcut-config-path
  "src/main/frontend/modules/shortcut/config.cljs")

;; Matches literal `(t :ns/key)` and `(tt :ns/key)` calls, including alias-qualified
;; forms like `(i18n/t :ns/key)`.
(def ^:private direct-translation-call-rg-pattern
  "[(](?:[[:alnum:]._-]+/)?tt?[[:space:]]+:[^ )]+")

;; Matches literal `:i18n-key :ns/key` entries, including values wrapped onto the
;; next line when `rg` runs in multiline mode.
(def ^:private i18n-key-rg-pattern
  ":i18n-key[[:space:]]+:[^ }\n]+")

;; Matches files containing dynamic translation-call `if`/`or` forms, `i18n-key`
;; `if` forms, literal `:prompt-key`/`:title-key` options, `built-in-colors`,
;; `navs` vectors, date NLP labels, built-in property/class definitions, or
;; `:shortcut.category/*` keys for later exact extraction.
(def ^:private derived-ui-key-candidate-rg-pattern
  "(?:[(](?:[[:alnum:]._-]+/)?tt?[[:space:]]+[(](?:if|or)\\b|:?i18n-key[[:space:]]+[(]if\\b|:prompt-key[[:space:]]+:|:title-key[[:space:]]+:|[(]def[[:space:]]+built-in-colors\\b|\\bnavs[[:space:]]+\\[|[(]def[[:space:]]+nlp-pages\\b|[(]def[[:space:]]+\\^:large-vars/data-var[[:space:]]+built-in-(?:properties|classes)\\b|:shortcut\\.category/)")

(def ^:private built-in-db-ident-candidate-rg-pattern
  "[(]def[[:space:]]+\\^:large-vars/data-var[[:space:]]+built-in-(?:properties|classes)\\b")

(defn- extract-keyword-match
  [value]
  (some-> (last (re-seq #":[^ )}\s]+" value))
          (subs 1)
          keyword))

(defn- rg-output-lines
  [paths pattern & {:keys [multiline?]}]
  (let [args (concat ["rg"]
                     (when multiline? ["-U"])
                     ["--no-filename" "-o" "-N" pattern]
                     paths)]
    (->> (apply shell {:out :string :continue true} args)
         :out
         string/split-lines
         (remove string/blank?))))

(defn- rg-matching-files
  [paths pattern]
  (let [args (concat ["rg" "-l"
                      "--glob" "*.clj"
                      "--glob" "*.cljs"
                      "--glob" "*.cljc"
                      pattern]
                     paths)]
    (->> (apply shell {:out :string :continue true} args)
         :out
         string/split-lines
         (remove string/blank?))))

(defn- grep-direct-translation-keys
  "Grep source paths for literal `(t :ns/key)` and `(tt :ns/key)` calls."
  []
  (->> (rg-output-lines direct-translation-call-source-paths direct-translation-call-rg-pattern)
       (keep extract-keyword-match)
       set))

(defn- grep-i18n-payload-keys
  "Grep translated code paths for `:i18n-key` payload entries, including cases
  where the translation key is wrapped onto the next line."
  []
  (->> (rg-output-lines translated-code-source-paths i18n-key-rg-pattern :multiline? true)
       (keep extract-keyword-match)
       set))

(defn- grep-derived-translation-keys
  "Scan candidate source files for translation keys derived from supported
  dynamic patterns such as `if`/`or` translation calls, option keys, built-in
  colors, left-sidebar derived nav labels, and shortcut category labels."
  []
  (->> (rg-matching-files translated-code-source-paths derived-ui-key-candidate-rg-pattern)
       (mapcat #(lang-lint/derived-translation-keys (slurp %)))
       set))

(defn- grep-built-in-db-ident-translation-keys
  "Derive built-in property/class translation keys from built-in db-ident
  definition forms."
  []
  (->> (rg-matching-files translated-code-source-paths built-in-db-ident-candidate-rg-pattern)
       (mapcat #(lang-lint/built-in-db-ident-translation-keys (slurp %)))
       set))

(defn- grep-shortcut-command-keys
  "Derive `:command.*` translation keys from shortcut ids declared in the
  built-in shortcut config."
  []
  (lang-lint/shortcut-command-keys (slurp shortcut-config-path)))

(def ^:private config-deprecation-detailed-keys
  [:editor/command-trigger
   :arweave/gateway
   :preferred-format
   :property-pages/enabled?
   :block-hidden-properties
   :feature/enable-block-timestamps?
   :favorites
   :default-templates])

(defn- config-key->deprecation-i18n-key
  [config-key]
  (let [ns-str (namespace config-key)
        clean-name (string/replace (name config-key) #"\?$" "")
        leaf (if ns-str
               (str ns-str "-" clean-name)
               clean-name)]
    (keyword "graph.validation" (str "config-" leaf "-warning"))))

(defn- grep-config-deprecation-translation-keys
  "Derive `:graph.validation/*` deprecation keys from deprecated config keys."
  []
  (conj (->> config-deprecation-detailed-keys
             (map config-key->deprecation-i18n-key)
             set)
        :graph.validation/config-unused-in-db-graphs-warning))

(defn- delete-not-used-key-from-dict-file
  [invalid-keys]
  (let [paths (fs/list-dir "src/resources/dicts")]
    (doseq [path paths]
      (let [result (rewrite/parse-string (String. (fs/read-all-bytes path)))
            new-content (str (reduce
                              (fn [result k]
                                (rewrite/dissoc result k))
                              result invalid-keys))]
        (spit (fs/file path) new-content)))))

(defn- validate-ui-translations-are-used
  "This validation checks that translation keys referenced from frontend, Electron,
  shortcut config, and translated validation payloads all exist in the default
  :en dictionary, and that unused keys in :en can be detected."
  [{:keys [fix?]}]
  (let [defined-translation-keys (set (keys (:en (get-dicts))))
        built-in-defined-translation-keys (->> (grep-built-in-db-ident-translation-keys)
                                               (set/intersection defined-translation-keys))
        referenced-translation-keys (->> [(grep-direct-translation-keys)
                                          (grep-i18n-payload-keys)
                                          (grep-derived-translation-keys)
                                          built-in-defined-translation-keys
                                          (grep-config-deprecation-translation-keys)
                                          (grep-shortcut-command-keys)]
                                         (apply concat)
                                         set)
        undefined-references (set/difference referenced-translation-keys defined-translation-keys)
        unreferenced-definitions (set/difference defined-translation-keys referenced-translation-keys)]
    (if (and (empty? undefined-references) (empty? unreferenced-definitions))
      (println "All defined :en translation keys match the ones that are used!")
      (do
        (when (seq undefined-references)
          (println "\nThese translation keys are invalid because they are referenced in translated code paths but not defined:")
          (task-util/print-table (map #(hash-map :invalid-key %) undefined-references)))
        (when (seq unreferenced-definitions)
          (println "\nThese translation keys are invalid because they are defined but not referenced in translated code paths:")
          (task-util/print-table (map #(hash-map :invalid-key %) unreferenced-definitions))
          (when fix?
            (delete-not-used-key-from-dict-file unreferenced-definitions)
            (println "These unreferenced translation keys have been removed.")))
        (System/exit 1)))))

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
  (validate-non-default-languages {:fix? (contains? (set args) "--fix")})
  (validate-ui-translations-are-used {:fix? (contains? (set args) "--fix")})
  (validate-rich-translations)
  (validate-translation-placeholders))

(def ^:private hardcoded-default-paths
  ["src/main/frontend"
   "src/main/mobile"
   "src/electron"
   "deps"
   "packages/ui"])

(def ^:private hardcoded-allowed-extensions
  #{"clj" "cljs" "cljc" "ts" "tsx"})

(def ^:private hardcoded-ignored-segments
  ["/test/" "/tests/" "/dev/" "/node_modules/" "/target/" "/static/" "/cljs-test-runner-out/"])

;; These files are outside the product UI translation surface even though they
;; contain readable strings:
;; - component demos/playgrounds under `deps/shui`
;; - MCP tool metadata under the CLI implementation
;; - internal command definitions used only for worker-side matching
;; - language autonyms curated outside the translation dictionaries
(def ^:private hardcoded-ignored-path-patterns
  [#"^deps/shui/src/logseq/shui/demo\d*\.cljs$"
   #"^deps/cli/src/logseq/cli/common/mcp/"
   #"^deps/publish/"
   #"^deps/db/src/logseq/db/frontend/class\.cljs$"
   #"^deps/db/src/logseq/db/frontend/property\.cljs$"
   #"^src/main/frontend/worker/commands\.cljs$"
   #"^src/main/frontend/dicts\.cljc$"])

(def ^:private hardcoded-ignored-dirs
  #{"test" "tests" "dev" "node_modules" "target" "static"})

(defn- normalize-path
  [path]
  (-> (str path)
      (string/replace "\\" "/")
      (string/replace-first #"^\./" "")))

(defn- hardcoded-lint-file?
  [path]
  (let [normalized (normalize-path path)]
    (and (hardcoded-allowed-extensions (fs/extension normalized))
         (not-any? #(string/includes? normalized %) hardcoded-ignored-segments)
         (not-any? #(re-find % normalized) hardcoded-ignored-path-patterns))))

(defn- ignored-dir?
  "Return true if the directory should be skipped during lint traversal."
  [^java.io.File f]
  (let [n (.getName f)]
    (or (string/starts-with? n ".")
        (hardcoded-ignored-dirs n))))

(defn- directory-files
  [path]
  (let [root (fs/file path)
        acc  (volatile! [])]
    (letfn [(walk [^java.io.File f]
                  (if (.isDirectory f)
                    (when-not (ignored-dir? f)
                      (run! walk (.listFiles f)))
                    (vswap! acc conj (str f))))]
      (walk root))
    @acc))

(defn- collect-files
  [paths]
  (->> paths
       (map normalize-path)
       (filter fs/exists?)
       (mapcat (fn [path]
                 (if (fs/directory? path)
                   (directory-files path)
                   [path])))
       (map normalize-path)
       (filter hardcoded-lint-file?)
       distinct
       sort))

(defn- changed-files-from-git-status
  []
  (->> (shell {:out :string :continue true}
              "git" "status" "--porcelain" "--untracked-files=all")
       :out
       string/split-lines
       (map #(subs % 3))
       (map #(if (string/includes? % " -> ")
               (last (string/split % #" -> "))
               %))
       (map normalize-path)
       (filter seq)))

(defn- lint-findings
  [paths]
  (->> paths
       (mapcat #(lang-lint/hardcoded-string-findings % (slurp %)))
       (sort-by (juxt :file :line :kind))
       vec))

(defn lint-hardcoded
  "Lint likely hardcoded user-facing strings in UI-oriented source files.
  Use --warn-only to report findings without failing and --changed-only to scan
  only files changed in git status. Optional positional args limit the scan to
  specific files or directories."
  [& args]
  (let [arg-set (set args)
        warn-only? (contains? arg-set "--warn-only")
        changed-only? (contains? arg-set "--changed-only")
        explicit-paths (remove #(#{"--warn-only" "--changed-only"} %) args)
        paths (cond
                (seq explicit-paths) (collect-files explicit-paths)
                changed-only? (collect-files (changed-files-from-git-status))
                :else (collect-files hardcoded-default-paths))
        findings (lint-findings paths)]
    (cond
      (empty? paths)
      (println "No files matched the hardcoded-string lint scope.")

      (empty? findings)
      (println "No hardcoded user-facing string literals found in the selected files.")

      :else
      (do
        (println "Potential hardcoded user-facing strings:")
        (task-util/print-table findings)
        (when-not warn-only?
          (System/exit 1))))))
