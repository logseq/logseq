(ns frontend.db.default
  (:require [clojure.string :as string]))

(defonce built-in-pages-names
  #{"NOW" "LATER" "DOING" "DONE" "IN-PROGRESS" "TODO" "WAIT" "WAITING" "A" "B" "C" "Favorites"})

(def built-in-pages
  (mapv (fn [p]
          {:block/name (string/lower-case p)
           :block/original-name p
           :block/journal? false
           :block/uuid (random-uuid)})
        built-in-pages-names))
