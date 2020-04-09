(ns backend.config
  (:require [aero.core :refer (read-config)]
            [clojure.java.io :as io]))

(def config (read-config (io/resource "config.edn")))

(def production? (= "production" (:env config)))
(def dev? (= "dev" (:env config)))
(def test? (= "test" (:env config)))
(def website-uri (if dev?
                   "http://localhost:3000"
                   "https://logseq.com"))
