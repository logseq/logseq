(ns frontend.modules.editor.cursor
  (:require [frontend.state :as state]
            [dommy.core :as d]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.util :as util]
            [frontend.db :as db]
            [frontend.handler.editor :as editor]))

(defn restore-cursor!
  [{:keys [block-container block-idx pos] :as state}]
  ;; get the element
  (when (and block-container block-idx pos)
    (when-let [container (gdom/getElement block-container)]
      (let [blocks (d/by-class container "ls-block")
            block-node (util/nth-safe (seq blocks) block-idx)
            id (and block-node (gobj/get block-node "id"))]
        (when id
          (let [block-id (->> (take-last 36 id)
                           (apply str))
                block-uuid (when (util/uuid-string? block-id)
                             (uuid block-id))]
            (when block-uuid
              (when-let [block (db/pull [:block/uuid block-uuid])]
                (editor/edit-block! block pos
                  (:block/format block)
                  (:block/uuid block))))))))))

