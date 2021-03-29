(ns frontend.modules.outliner.state
  (:require [frontend.modules.outliner.utils :as u-outliner]
            [frontend.db.react :as react]
            [frontend.db.outliner :as db-outliner]
            [frontend.util :as util]
            [frontend.modules.outliner.tree :as tree]))

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

(defn update-block-state
  [repo node]
  ;; {:pre [(tree/satisfied-inode? node)]}
  #_(when-let [parent (tree/-get-parent node)]
    (react/transact-react!
      repo
      [(:data parent)]
      {:key [:block/children (str (tree/-get-id parent))]})))