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

(defn when-loaded!
  "Runs f once the window's web contents have finished loading: now when they already have (a main-process reload
  in development sets up again on a loaded window, whose did-finish-load has already fired), else on did-finish-load."
  [^js contents f]
  (if (.isLoading contents)
    (.once contents "did-finish-load" f)
    (f)))
