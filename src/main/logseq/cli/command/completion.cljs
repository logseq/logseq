(ns logseq.cli.command.completion
  "Shell completion command."
  (:require [logseq.cli.command.core :as core]))

(def ^:private completion-spec
  {:shell {:desc "Shell (zsh, bash)"
           :values ["zsh" "bash"]}})

(def entries
  [(core/command-entry ["completion"] :completion
                       "Generate shell completion script"
                       completion-spec)])
