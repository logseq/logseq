(ns frontend.modules.ai.protocol)

(defprotocol AI
  (ask [this q opts])
  (chat [this conversation opts])
  ;; (index-graph [this repo])
  ;; encode && embedding
  (summarize [this content opts])
  (translate [this content opts])
  (generate-text [this description opts])
  (generate-image [this description opts])
  (speech-to-text [this audio opts])
  (transcription [this audio opts])
  )
