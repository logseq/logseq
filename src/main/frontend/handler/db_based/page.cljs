(ns frontend.handler.db-based.page
  (:require [logseq.outliner.core :as outliner-core]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            ;; ui-outliner-tx macro relying on this
            #_:clj-kondo/ignore
            [frontend.state :as state]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [promesa.core :as p]))

(defn- valid-tag?
  "Returns a boolean indicating whether the new tag passes all valid checks.
   When returning false, this fn also displays appropriate notifications to the user"
  [repo block tag-entity]
  (try
    (outliner-core/validate-unique-by-name-tag-and-block-type
     (db/get-db repo)
     (:block/title block)
     (update block :block/tags (fnil conj #{}) tag-entity))
    true
    (catch :default e
      (if (= :notification (:type (ex-data e)))
        (let [payload (:payload (ex-data e))]
          (notification/show! (:message payload) (:type payload))
          false)
        (throw e)))))

(defn add-tag [repo block-id tag-entity]
  (ui-outliner-tx/transact!
   {:outliner-op :save-block}
   (p/do!
    (editor-handler/save-current-block!)
    ;; Check after save-current-block to get most up to date block content
    (when (valid-tag? repo (db/entity repo [:block/uuid block-id]) tag-entity)
      (let [tx-data [[:db/add [:block/uuid block-id] :block/tags (:db/id tag-entity)]
                     ;; TODO: Move this to outliner.core to consistently add refs for tags
                     [:db/add [:block/uuid block-id] :block/refs (:db/id tag-entity)]]]
        (db/transact! repo tx-data {:outliner-op :save-block}))))))
