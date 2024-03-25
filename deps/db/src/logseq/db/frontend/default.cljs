(ns logseq.db.frontend.default
  "Provides vars and fns for dealing with default/built-in? data"
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

(defn page-title->block
  [title]
  {:block/name (string/lower-case title)
   :block/original-name title
   :block/journal? false
   :block/uuid (random-uuid)})

(def built-in-pages
  (mapv page-title->block built-in-pages-names))

(defn mark-block-as-built-in
  "Marks built-in blocks as built-in? including pages, classes, properties and closed values"
  [block]
  (assoc block :logseq.property/built-in? true))
