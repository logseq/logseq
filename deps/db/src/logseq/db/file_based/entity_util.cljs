(ns logseq.db.file-based.entity-util
  "Lower level entity util fns for file graphs")

(defn whiteboard?
  [entity]
  (identical? "whiteboard" (:block/type entity)))

(defn journal?
  [entity]
  (identical? "journal" (:block/type entity)))

(defn page?
  [entity]
  (contains? #{"page" "journal" "whiteboard"} (:block/type entity)))