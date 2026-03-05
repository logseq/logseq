(ns logseq.cli.command.completions
  "Shell completions command."
  (:require [logseq.cli.command.core :as core]))

(def ^:private completions-spec
  {:shell {:desc "Shell (zsh, bash)"
           :values ["zsh" "bash"]}})

(def entries
  [(core/command-entry ["completions"] :completions
                       "Generate shell completion script"
                       completions-spec)])
