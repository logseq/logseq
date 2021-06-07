(ns frontend.debug
  (:require [cljs.pprint :as pprint]
            [frontend.config :as config]
            [frontend.state :as state]))

(defn pprint
  [& xs]
  (when (or config/dev? (state/developer-mode?))
    (doseq [x xs]
      (pprint/pprint x))))
