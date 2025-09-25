(ns frontend.util.file-based.priority
  "Util fns for task priorities e.g. A, B, C.
   File graph only"
  (:require [clojure.string :as string]
            [frontend.util :as util]
            [frontend.handler.file-based.status :as status]))

(defn add-or-update-priority
  [content format priority]
  (let [priority-pattern  #"(\[#[ABC]\])?\s?"
        [re-pattern new-line-re-pattern]
        (if (= :org format)
          [#"\*+\s" #"\n\*+\s"]
          [#"#+\s" #"\n#+\s"])
        skip-hash-pos
        (if-let [matches (seq (util/re-pos new-line-re-pattern content))]
          (let [[start-pos content] (last matches)]
            (+ start-pos (count content)))
          (count (util/safe-re-find re-pattern content)))
        skip-marker-pos
        (if-let [matches (seq (util/re-pos status/bare-marker-pattern (subs content skip-hash-pos)))]
          (let [[start-pos content] (last matches)]
            (+ start-pos (count content)))
          0)
        pos (+ skip-hash-pos skip-marker-pos)
        new-content
        (str (subs content 0 pos)
             (string/replace-first (subs content pos)
                                   priority-pattern
                                   (str priority " ")))]
    new-content))
