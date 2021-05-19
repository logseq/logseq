(ns frontend.db.default
  (:require [clojure.string :as string]))

(def built-in-pages
  (mapv (fn [p]
          {:block/name (string/lower-case p)
           :block/original-name p
           :block/journal? false})
        #{"NOW" "LATER" "DOING" "DONE" "IN-PROGRESS" "TODO" "WAIT" "WAITING" "A" "B" "C"}))
