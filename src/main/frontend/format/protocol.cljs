(ns frontend.format.protocol)

(defprotocol Format
  (toEdn [this content config])
  (toHtml [this content config])
  (loaded? [this])
  (lazyLoad [this ok-handler]))

(defprotocol Export
  (export [this config page-ast]))
