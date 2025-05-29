(ns logseq.db.common.entity-util
  "Lower level entity util fns for DB and file graphs"
  (:require [logseq.db.file-based.entity-util :as file-entity-util]
            [logseq.db.frontend.entity-util :as entity-util]))

(defn whiteboard?
  [entity]
  (or (entity-util/whiteboard? entity)
      (file-entity-util/whiteboard? entity)))

(defn journal?
  [entity]
  (or (entity-util/journal? entity)
      (file-entity-util/journal? entity)))

(defn page?
  [entity]
  (or (entity-util/page? entity)
      (file-entity-util/page? entity)))