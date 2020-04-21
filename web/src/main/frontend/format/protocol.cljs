(ns frontend.format.protocol)

(defprotocol Format
  (toHiccup [this ast-headings config])
  (toHtml [this content config])
  (loaded? [this])
  (lazyLoad [this ok-handler]))
