(ns frontend.loader
  (:require [goog.net.jsloader :as jsloader]
            [goog.html.legacyconversions :as conv]))

(defn load [url ok-handler error-handler]
  (let [loader ^js (jsloader/safeLoad (conv/trustedResourceUrlFromString (str url)))]
    (.addCallback loader
                  (fn [result]
                    (ok-handler result))
                  (fn [error]
                    (error-handler error)))))
