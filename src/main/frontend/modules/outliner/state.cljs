(ns frontend.modules.outliner.state
  (:require [frontend.db.outliner :as db-outliner]
            [frontend.db.react :as react]
            [frontend.modules.outliner.utils :as u-outliner]
            [frontend.util :as util]))

(defn get-by-parent-id
  [repo id]
  (->
    (react/q repo [:block/children (str (u-outliner/->block-id id))]
      {:use-cache? false}
      db-outliner/get-by-parent-id
      (u-outliner/->block-lookup-ref id))
    (util/react)
    (flatten)
    (seq)))
