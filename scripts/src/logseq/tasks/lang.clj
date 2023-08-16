(ns logseq.tasks.lang
  "Tasks related to language translations"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.dicts :as dicts]
            [logseq.tasks.util :as task-util]
            [babashka.cli :as cli]
            [babashka.process :refer [shell]]))

(defn- get-dicts
  []
  dicts/dicts)

(defn- get-languages
  []
  (->> dicts/languages
       (map (juxt :value :label))
       (into {})))

(defn list-langs
  "List translated langagues with their number of translations"
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
                    ;; Escape newlines for multi-line translations like tutorials
                    "\n" "\\n")))

(defn list-missing
  "List missing translations for a given language"
  [& args]
  (let [lang (or (keyword (first args))
                 (task-util/print-usage "LOCALE [--copy]"))
        options (cli/parse-opts (rest args) {:coerce {:copy :boolean}})
        _ (when-not (contains? (get-languages) lang)
            (println "Language" lang "does not have an entry in dicts/core.cljs")
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
                                        :file (if (= "tutorial" (namespace k))
                                                (str "Under tutorials/")
                                                (str "dicts/" (-> lang name string/lower-case) ".edn"))}))
                                (sort-by (juxt :file :translation-key)))]
        (if (:copy options)
          (doseq [[file missing-for-file] (group-by :file sorted-missing)]
            (println "\n;; For" file)
            (doseq [{:keys [translation-key string-to-translate]} missing-for-file]
              (println translation-key (pr-str string-to-translate))))
          (task-util/print-table
           ;; Shorten values
           (map #(update % :string-to-translate shorten 50) sorted-missing)))))))

(defn- validate-non-default-languages
  "This validation finds any translation keys that don't exist in the default
  language English. Logseq needs to work out of the box with its default
  language. This catches mistakes where another language has accidentally typoed
  keys or added ones without updating :en"
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

(defn- whiteboard-dicts
  []
  (->> (shell {:out :string}
              "grep -E -oh" "\\bt\\('[^ ']+" "-r" "tldraw/apps/tldraw-logseq/src/components")
       :out
       string/split-lines
       (map #(keyword (subs % 3)))))

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
                          (concat (whiteboard-dicts))
                          set)
        expected-dicts (set (remove #(re-find #"^(command|shortcut)\." (str (namespace %)))
                                    (keys (:en (get-dicts)))))
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

(def allowed-duplicates
  "Allows certain keys in a language to have the same translation
   as English. Happens more in romance languages but pretty rare otherwise"
  {:fr #{:port :type :help/docs :search-item/page :shortcut.category/navigating :text/image
         :settings-of-plugins :code :on-boarding/section-pages :paginates/pages :right-side-bar/history-global
         :shortcut.category/plugins :whiteboard/rectangle :whiteboard/triangle}
   :de #{:graph :host :plugins :port :right-side-bar/whiteboards :search-item/block
         :settings-of-plugins :search-item/whiteboard :shortcut.category/navigating
         :settings-page/enable-tooltip :settings-page/enable-whiteboards :settings-page/plugin-system}
   :es #{:settings-page/tab-general :settings-page/tab-editor :whiteboard/color :search/command-palette-tip-1 :right-side-bar/history-global}
   :it #{:plugins}
   :nl #{:plugins :type :left-side-bar/nav-recent-pages :plugin/update}
   :pl #{:port}
   :pt-BR #{:plugins :right-side-bar/flashcards :settings-page/enable-flashcards :page/backlinks
            :host :settings-page/tab-editor :shortcut.category/plugins :whiteboard/link}
   :pt-PT #{:plugins :settings-of-plugins :plugin/downloads :right-side-bar/flashcards
            :settings-page/enable-flashcards :settings-page/plugin-system}
   :nb-NO #{:port :type :whiteboard :right-side-bar/flashcards :right-side-bar/whiteboards 
            :search-item/whiteboard :settings-page/enable-flashcards :settings-page/enable-whiteboards 
            :settings-page/tab-editor :shortcut.category/whiteboard :whiteboard/medium 
            :whiteboard/twitter-url :whiteboard/youtube-url :right-side-bar/history-global}
   :tr #{:help/awesome-logseq}
   })

(defn- validate-languages-dont-have-duplicates
  "Looks up duplicates for all languages"
  []
  (let [dicts (get-dicts)
        en-dicts (dicts :en)
        invalid-dicts
        (->> (dissoc dicts :en)
             (mapcat
              (fn [[lang lang-dicts]]
                (keep
                 #(when (= (en-dicts %) (lang-dicts %))
                    {:translation-key %
                     :lang lang
                     :duplicate-value (shorten (lang-dicts %) 70)})
                 (keys (apply dissoc lang-dicts (allowed-duplicates lang))))))
             (sort-by (juxt :lang :translation-key)))]
    (if (empty? invalid-dicts)
      (println "All languages have no duplicate English values!")
      (do
        (println "These translations keys are invalid because they are just copying the English value:")
        (task-util/print-table invalid-dicts)
        (System/exit 1)))))

(defn validate-translations
  "Runs multiple translation validations that fail fast if one of them is invalid"
  []
  (validate-non-default-languages)
  (validate-ui-translations-are-used)
  (validate-languages-dont-have-duplicates))
