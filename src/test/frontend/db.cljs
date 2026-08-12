(ns frontend.db
  "Test-only frontend.db fixture namespace."
  (:require [frontend.db.conn :as conn]
            [frontend.state :as state]
            [logseq.db :as ldb]))

(def new-block-id ldb/new-block-id)

(defn transact!
  ([tx-data]
   (transact! (state/get-current-repo) tx-data nil))
  ([repo tx-data]
   (transact! repo tx-data nil))
  ([repo tx-data tx-meta]
   (conn/transact! repo tx-data tx-meta)))
