(ns frontend.modules.ai.protocol)

(defprotocol AI
  (generate-text [this q opts])
  (chat [this conversation opts])
  (generate-image [this description opts])
  (speech-to-text [this audio opts])
  (text-to-speech [this text opts]))
