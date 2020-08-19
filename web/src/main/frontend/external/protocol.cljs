(ns frontend.external.protocol)

(defprotocol External
  (toMldocAst [this content]               ; might be json or anything
    )
  (fromMldocAst [this ast]))
