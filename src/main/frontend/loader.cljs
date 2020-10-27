(ns frontend.loader
  (:require [goog.net.jsloader :as jsloader]
            [goog.html.legacyconversions :as conv]))

(defn load [url ok-handler]
  (let [loader (jsloader/safeLoad (conv/trustedResourceUrlFromString (str url)))]
    (.addCallback ^goog.net.jsloader loader ok-handler)))
