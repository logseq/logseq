(ns frontend.test.generators
  "Generators for block-related data and outliner operations"
  (:require [clojure.test.check.generators :as gen]
            [datascript.core :as d]))


(defn gen-available-block-uuid
  [db & {:keys [page-uuid]}]
  (let [query (cond-> '[:find ?block-uuid]
                page-uuid
                (concat '[:in $ ?page-uuid])
                true
                (concat '[:where
                          [?block :block/parent]
                          [?block :block/uuid ?block-uuid]])
                page-uuid
                (concat '[[?block :block/page ?page]
                          [?page :block/uuid ?page-uuid]]))]
    (if-let [coll (not-empty
                   (->> (if page-uuid
                          (d/q query db page-uuid)
                          (d/q query db))
                        (apply concat)))]
      (gen/elements coll)
      (gen/return nil))))

(defn gen-available-parent
  "generate [<parent-uuid>]"
  [db & {:keys [page-uuid]}]
  (let [query (cond-> '[:find ?parent-uuid]
                page-uuid
                (concat '[:in $ ?page-uuid])
                true
                (concat '[:where
                          [?b :block/uuid]
                          [?b :block/parent ?parent]
                          [?parent :block/uuid ?parent-uuid]
                          [?left :block/uuid ?left-uuid]])
                page-uuid
                (concat '[[?b :block/page ?page]
                          [?page :block/uuid ?page-uuid]]))]
    (if-let [coll (not-empty
                   (if page-uuid
                     (d/q query db page-uuid)
                     (d/q query db)))]
      (gen/elements coll)
      (gen/return nil))))


;;; generators for outliner operations


(defn gen-insert-blocks-op
  [db & {:keys [opts] :as args}]
  (gen/let [target-block-uuid (gen-available-block-uuid db (select-keys args [:page-uuid]))
            content gen/string-alphanumeric]
    (when target-block-uuid
      (let [block-uuid (random-uuid)]
        [:insert-blocks
         [[{:block/uuid block-uuid
            :block/title content
            :block/format :markdown}]
          (:db/id (d/entity db [:block/uuid target-block-uuid]))
          opts]]))))

(defn gen-delete-blocks-op
  [db & {:keys [opts] :as args}]
  (gen/let [block-uuid (gen-available-block-uuid db (select-keys args [:page-uuid]))]
    (when-let [block-id (:db/id (d/entity db [:block/uuid block-uuid]))]
      [:delete-blocks [[block-id] opts]])))

(defn gen-move-blocks-op
  [db & args]
  (gen/let [[block-uuid target-block-uuid]
            (gen/vector-distinct (gen-available-block-uuid db (select-keys args [:page-uuid])) {:num-elements 2})
            sibling? gen/boolean]
    (when (and target-block-uuid block-uuid)
      (let [[block-id target-id] (mapv #(:db/id (d/entity db [:block/uuid %])) [block-uuid target-block-uuid])]
        (when (and block-id target-id)
          [:move-blocks [[block-id] target-id sibling?]])))))

;; (defn gen-save-block-op
;;   "TODO: not impl yet"
;;   [_db & _args]
;;   (gen/return nil))
