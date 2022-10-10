(ns frontend.format.adoc
  "Partial implementation of format protocol for adoc that uses asciidoctor"
  (:require [frontend.format.protocol :as protocol]
            [frontend.loader :as loader]))

(defn loaded? []
  js/window.Asciidoctor)

(defrecord AdocMode []
  protocol/Format
  (toEdn [_this _content _config]
    nil)
  (toHtml [_this content _config _references]
    (when (loaded?)
      (let [config {:attributes {:showTitle false
                                 :hardbreaks true
                                 :icons "font"
                                 ;; :source-highlighter "pygments"
                                 }}]
        (.convert (js/window.Asciidoctor) content (clj->js config)))))
  (loaded? [_this]
    (some? (loaded?)))
  (lazyLoad [_this ok-handler]
    (loader/load
     "https://cdnjs.cloudflare.com/ajax/libs/asciidoctor.js/1.5.9/asciidoctor.min.js"
     ok-handler))
  (exportMarkdown [_this _content _config _references]
    (throw "not support"))
  (exportOPML [_this _content _config _title _references]
    (throw "not support")))
