(ns frontend.util.marker
  (:require [clojure.string :as string]
            [frontend.util :as util]))

(defn marker?
  [s]
  (contains?
   #{"NOW" "LATER" "TODO" "DOING"
     "DONE" "WAIT" "WAITING" "CANCELED" "CANCELLED" "STARTED" "IN-PROGRESS"}
   (string/upper-case s)))

(def marker-pattern
  #"^(NOW|LATER|TODO|DOING|DONE|WAITING|WAIT|CANCELED|CANCELLED|STARTED|IN-PROGRESS)?\s?")

(def bare-marker-pattern
  #"^(NOW|LATER|TODO|DOING|DONE|WAITING|WAIT|CANCELED|CANCELLED|STARTED|IN-PROGRESS){1}\s+")


(defn add-or-update-marker
  [content format marker]
  (let [[re-pattern new-line-re-pattern]
        (if (= :org format)
          [#"\*+\s" #"\n\*+\s"]
          [#"#+\s" #"\n#+\s"])
        pos
        (if-let [matches (seq (util/re-pos new-line-re-pattern content))]
          (let [[start-pos content] (last matches)]
            (+ start-pos (count content)))
          (count (re-find re-pattern content)))
        new-content
        (str (subs content 0 pos)
             (string/replace-first (subs content pos)
                                   marker-pattern
                                   (str marker " ")))]
    new-content))
