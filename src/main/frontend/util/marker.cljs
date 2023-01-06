(ns frontend.util.marker
  "Task (formerly todo) related util fns"
  (:require [clojure.string :as string]
            [frontend.util :as util]))

(defn marker-pattern [format]
  (re-pattern
   (str "^" (if (= format :markdown) "(#+\\s+)?" "(\\*+\\s+)?")
        "(NOW|LATER|TODO|DOING|DONE|WAITING|WAIT|CANCELED|CANCELLED|IN-PROGRESS)?\\s?")))

(def bare-marker-pattern
  #"(NOW|LATER|TODO|DOING|DONE|WAITING|WAIT|CANCELED|CANCELLED|IN-PROGRESS){1}\s+")

(defn add-or-update-marker
  [content format marker]
  (let [[re-pattern new-line-re-pattern]
        (case format
          :org
          [#"^\*+\s" #"\n\*+\s"]

          (:markdown :md)
          [#"^#+\s" #"\n#+\s"]

          ;; failback to markdown
          [#"^#+\s" #"\n#+\s"])

        pos
        (if-let [matches (seq (util/re-pos new-line-re-pattern content))]
          (let [[start-pos content] (last matches)]
            (+ start-pos (count content)))
          (count (util/safe-re-find re-pattern content)))

        new-content
        (str (subs content 0 pos)
             (string/replace-first (subs content pos)
                                   (marker-pattern format)
                                   (str marker (if (empty? marker) "" " "))))]
    new-content))

(defn cycle-marker-state
  [marker preferred-workflow]
  (case marker
    "TODO"
    "DOING"

    "DOING"
    "DONE"

    "LATER"
    "NOW"

    "NOW"
    "DONE"

    "DONE"
    nil

    (if (= :now preferred-workflow) "LATER" "TODO")))

(defn cycle-marker
  "The cycle-marker will cycle markers sequentially. You can find all its order in `cycle-marker-state`.

  It also accepts the specified `marker` and `new-marker`.
  If you don't specify it, it will automatically find it based on `content`.

  Returns [new-content new-marker]."
  [content marker new-marker format preferred-workflow]
  (let [content    (string/triml content)
        marker     (or (not-empty marker)
                       (last (util/safe-re-find (marker-pattern format) content))) ; Returns the last matching group (last vec)
        new-marker (or (not-empty new-marker)
                       (cycle-marker-state marker preferred-workflow))]
    [(add-or-update-marker content format new-marker) new-marker]))
