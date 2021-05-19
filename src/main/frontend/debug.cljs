(ns frontend.debug
  (:require [cljs.pprint :as pprint]))

(defn pprint
  [& xs]
  (doseq [x xs]
    (pprint/pprint x)))
