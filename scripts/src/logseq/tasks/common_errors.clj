(ns logseq.tasks.common-errors
  "Task to use AI to detect common errors"
  (:require [babashka.fs :as fs]
            [babashka.process :refer [shell]]
            [clojure.string :as string]))

(defn check-common-errors
  []
  (let [prompt (String. (fs/read-all-bytes "prompts/review.md"))
        diff (:out (shell {:out :string} "git diff --no-prefix -U100 -- '*.cljs'"))]
    (when-not (string/blank? diff)
      (let [command (format "gh models run openai/gpt-5 \"%s\""
                            (str prompt
                                 (format "\n\n <diff>%s</diff>" diff)))]
        (shell command)))))
