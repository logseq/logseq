(ns ^:no-doc frontend.external.protocol)

(defprotocol External
  (toMarkdownFiles [this content config]
    "Should return a map of markdown's file name to contents."))

  ;; Long-term goal:
  ;; (toMldocAst [this content])
  ;; (fromMldocAst [this ast])
