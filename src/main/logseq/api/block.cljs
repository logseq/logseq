(ns logseq.api.block
  "Block related apis"
  (:require [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [cljs-bean.core :as bean]
            [frontend.state :as state]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.db :as db]
            [logseq.sdk.utils :as sdk-utils]))

(defn get_block
  [id-or-uuid ^js opts]
  (when-let [block (if (number? id-or-uuid)
                     (db-utils/pull id-or-uuid)
                     (db-model/query-block-by-uuid (sdk-utils/uuid-or-throw-error id-or-uuid)))]
    (when-not (contains? block :block/name)
      (when-let [uuid (:block/uuid block)]
        (let [{:keys [includeChildren]} (bean/->clj opts)
              repo  (state/get-current-repo)
              block (if includeChildren
                      ;; nested children results
                      (first (outliner-tree/blocks->vec-tree
                              (db-model/get-block-and-children repo uuid) uuid))
                      ;; attached shallow children
                      (assoc block :block/children
                             (map #(list :uuid (:block/uuid %))
                               (db/get-block-immediate-children repo uuid))))]
          (bean/->js (sdk-utils/normalize-keyword-for-json block)))))))
