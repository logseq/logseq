(ns frontend.format.protocol)

(defprotocol Format
  (toHtml [this] [this config]))
