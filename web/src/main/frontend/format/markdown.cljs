(ns frontend.format.markdown
  (:require [frontend.format.protocol :as protocol]
            [frontend.config :as config]
            [frontend.loader :as loader]
            [cljs-bean.core :as bean]))

(defn loaded? []
  js/window.showdown)

(def default-config
  {:simpleLineBreaks true
   :tasklists true
   :tables true
   :strikethrough true
   :simplifiedAutoLink true})

(defn ->edn
  [content config]
  nil)

(defrecord MdMode []
  protocol/Format
  (toEdn [this content config]
    (->edn content config))
  (toHtml [this content config]
    (when (loaded?)
      (.makeHtml (js/window.showdown.Converter. (bean/->js (or config default-config))) content)))
  (loaded? [this]
    (some? (loaded?)))
  (lazyLoad [this ok-handler]
    (loader/load
     "https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.min.js"
     ok-handler)))
