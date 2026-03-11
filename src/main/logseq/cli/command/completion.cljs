(ns logseq.cli.command.completion
  "Shell completion command."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]))

(def ^:private completion-spec
  {:shell {:desc "Shell (zsh, bash)"
           :values ["zsh" "bash"]}})

(def ^:private long-desc
  (string/join "\n"
               ["Generate shell completion script for the specified shell."
                "Outputs a completion script to stdout that can be evaluated"
                "by your shell to enable tab-completion for logseq commands."
                ""
                "Setup for zsh:"
                "  # Add to ~/.zshrc"
                "  autoload -Uz compinit && compinit"
                "  eval \"$(logseq completion zsh)\""
                ""
                "Setup for bash:"
                "  # Add to ~/.bashrc"
                "  eval \"$(logseq completion bash)\""]))

(def entries
  [(core/command-entry ["completion"] :completion
                       "Generate shell completion script"
                       completion-spec
                       {:long-desc long-desc})])
