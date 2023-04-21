(ns logseq.db.default
  "Provides fns for seeding default data in a logseq db"
  (:require [clojure.string :as string]
            [clojure.set :as set]))

(defonce built-in-markers
  ["NOW" "LATER" "DOING" "DONE" "CANCELED" "CANCELLED" "IN-PROGRESS" "TODO" "WAIT" "WAITING"])

(defonce built-in-priorities
  ["A" "B" "C"])

(defonce built-in-pages-names
  (set/union
   (set built-in-markers)
   (set built-in-priorities)
   #{"Favorites" "Contents" "card"}))

(def built-in-pages
  (mapv (fn [p]
          {:block/name (string/lower-case p)
           :block/original-name p
           :block/journal? false
           :block/uuid (random-uuid)})
        built-in-pages-names))
