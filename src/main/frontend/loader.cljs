(ns frontend.loader
  "Provides fns related to loading js assets"
  (:require [goog.net.jsloader :as jsloader]
            [goog.html.legacyconversions :as conv]
            [cljs-bean.core :as bean]))

(defn load
  ([url ok-handler] (load url ok-handler nil))
  ([url ok-handler opts]
   (let [loader (jsloader/safeLoad
                 (conv/trustedResourceUrlFromString (str url))
                 (bean/->js opts))]
     (.addCallback ^goog.net.jsloader loader ok-handler))))
