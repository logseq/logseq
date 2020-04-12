(ns frontend.format.protocol)

(defprotocol Format
  (toHtml [this content config])
  (loaded? [this])
  (lazyLoad [this ok-handler error-handler]))
