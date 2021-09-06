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
          (count (util/safe-re-find re-pattern content)))
        new-content
        (str (subs content 0 pos)
             (string/replace-first (subs content pos)
                                   marker-pattern
                                   (str marker " ")))]
    new-content))

(defn header-marker-pattern
  [markdown? marker]
  (re-pattern (str "^" (when markdown? "#*\\s*") marker)))

(defn replace-marker
  [content markdown? old-marker new-marker]
  (string/replace-first content (header-marker-pattern markdown? old-marker)
                        (fn [match]
                          (string/replace match old-marker new-marker))))

(defn cycle-marker
  [content format preferred-workflow]
  (let [markdown? (= :markdown format)
        match-fn (fn [marker] (util/safe-re-find (header-marker-pattern markdown? marker)
                                                content))]
    (cond
     (match-fn "TODO")
     [(replace-marker content markdown? "TODO" "DOING") "DOING"]
     (match-fn "DOING")
     [(replace-marker content markdown? "DOING" "DONE") "DONE"]
     (match-fn "LATER")
     [(replace-marker content markdown? "LATER" "NOW") "NOW"]
     (match-fn "NOW")
     [(replace-marker content markdown? "NOW" "DONE") "DONE"]
     (match-fn "DONE")
     [(replace-marker content markdown? "DONE" "") nil]
     :else
     (let [marker (if (= :now preferred-workflow) "LATER" "TODO")]
       [(add-or-update-marker (string/triml content) format marker) marker]))))
