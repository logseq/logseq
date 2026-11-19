(ns logseq.db.common.journal
  "Journal title and name updates for configured title formats"
  (:require [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.frontend.entity-util :as entity-util]))

(defn title-format-values
  "Return formatted journal attributes, optionally scoped to ids, excluding names that stay occupied."
  [db & [journal-ids]]
  (let [formatter (:logseq.property.journal/title-format (d/entity db :logseq.class/Journal))
        proposed (into {}
                       (keep (fn [{:keys [e v]}]
                               (when (and (or (nil? journal-ids) (contains? journal-ids e))
                                          (entity-util/journal? (d/entity db e)))
                                 (let [title (date-time-util/int->journal-title v formatter)]
                                   [e {:block/title title
                                       :block/name (common-util/page-name-sanity-lc title)}]))))
                       (d/datoms db :avet :block/journal-day))]
    (loop [updates proposed]
      (let [available (into {}
                            (filter (fn [[e {page-name :block/name}]]
                                      (every? (fn [{owner :e}]
                                                (or (= e owner)
                                                    (when-let [other (get updates owner)]
                                                      (not= page-name (:block/name other)))))
                                              (d/datoms db :avet :block/name page-name))))
                            updates)]
        (if (= (count updates) (count available))
          available
          (recur available))))))

(defn title-format-tx
  "Generate changed title/name datoms, optionally scoped to ids, whose proposed names are available."
  [db & [journal-ids]]
  (mapcat (fn [[e attrs]]
            (keep (fn [[attr value]]
                    (when (not= value (:v (first (d/datoms db :eavt e attr))))
                      [:db/add e attr value]))
                  attrs))
          (title-format-values db journal-ids)))
