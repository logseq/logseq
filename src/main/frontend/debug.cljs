(ns frontend.debug
  (:require [cljs.pprint :as pprint]
            [frontend.state :as state]))

(defn pprint
  [& xs]
  (when (state/developer-mode?)
    (doseq [x xs]
      (pprint/pprint x))))
