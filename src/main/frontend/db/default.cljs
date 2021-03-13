(ns frontend.db.default
  (:require [clojure.string :as string]))

(def built-in-pages
  (mapv (fn [p]
          {:page/name (string/lower-case p)
           :page/original-name p
           :page/journal? false})
        #{"NOW" "LATER" "DOING" "DONE" "IN-PROGRESS" "TODO" "WAIT" "WAITING" "A" "B" "C"}))
