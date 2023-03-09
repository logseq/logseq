(ns frontend.modules.ai.protocol)

(defprotocol AI
  ;; TODO: thread questions
  (ask [this q])
  ;; (index-graph [this repo])
  )
