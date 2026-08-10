(ns electron.lifecycle
  (:require [promesa.core :as p]))

(defn enqueue!
  "Serialize lifecycle operations and continue after an earlier operation fails."
  [lifecycle-op operation]
  (let [next-op (-> @lifecycle-op
                    (p/catch (fn [_] nil))
                    (p/then (fn [_] (operation))))]
    (vreset! lifecycle-op next-op)
    next-op))
