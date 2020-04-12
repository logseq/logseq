(ns frontend.loader
  (:require [goog.net.jsloader :as jsloader]
            [goog.html.legacyconversions :as conv]))

(defn load [url ok-handler]
  (let [loader ^js (jsloader/safeLoad (conv/trustedResourceUrlFromString (str url)))]
    (.addCallback loader ok-handler)))
