(ns frontend.format.markdown
  (:require ["showdown" :refer [Converter]]
            [frontend.format.protocol :as protocol]))

(defonce converter (Converter.))

(defrecord Markdown [content]
  protocol/Format
  (toHtml [this]
    (.makeHtml converter content)))
