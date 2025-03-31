(ns logseq.db.file-based.builtins
  "File graph built-ins"
  (:require [clojure.set :as set]))

(defonce built-in-markers
  ["NOW" "LATER" "DOING" "DONE" "CANCELED" "CANCELLED" "IN-PROGRESS" "TODO" "WAIT" "WAITING"])

(defonce built-in-priorities
  ["A" "B" "C"])

(defonce built-in-pages-names
  (set/union
   (set built-in-markers)
   (set built-in-priorities)
   #{"Favorites" "Contents" "card"}))
