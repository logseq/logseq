(ns frontend.modules.ai.protocol)

(defprotocol AI
  ;; TODO: thread questions
  (ask [this q opts])
  ;; (index-graph [this repo])
  (summarize [this content opts])
  (translate [this content opts])
  ;; draft email/etc.
  (generate-text [this description opts])
  (generate-image [this description opts])
  (speech-to-text [this audio opts])
  (transcription [this audio opts])
  )
