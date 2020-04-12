(ns frontend.format.adoc
  (:require [frontend.format.protocol :as protocol]
            [frontend.config :as config]
            [frontend.loader :as loader]))

(defn loaded? []
  js/window.Asciidoctor)

(defn to-html
  [content config]
  (when (loaded?)
    (.makeHtml (js/window.showdown.Converter.) content)))

(defrecord AdocMode []
  protocol/Format
  (toHtml [this content config]
    (when (loaded?)
      (let [config {:attributes {:showTitle false
                                 :hardbreaks true
                                 :icons "font"
                                 ;; :source-highlighter "pygments"
                                 }}]
        (.convert (js/window.Asciidoctor) content (clj->js config)))))
  (loaded? [this]
    (some? (loaded?)))
  (lazyLoad [this ok-handler error-handler]
    (loader/load
     "https://cdnjs.cloudflare.com/ajax/libs/asciidoctor.js/1.5.9/asciidoctor.min.js"
     ok-handler
     error-handler)))
