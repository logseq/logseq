(ns logseq.tasks.dev.lint
  "Validation for the app's shared resources."
  (:require [babashka.process :refer [shell]]))

(defn dev
  "Checks dictionary formatting, translation contracts, and UI strings."
  []
  (doseq [command ["bb lang:format-dicts --check"
                   "bb lang:validate-translations"
                   "bb lang:lint-hardcoded"]]
    (shell {:shutdown nil} command)))
