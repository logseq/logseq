(ns frontend.persist-db.protocol
  "Provides protocol for persisting db"
  (:require))

;; TODO: exporting, importing support
(defprotocol PersistentDB
  (new [this repo-name])
  (transact-data [this repo-name added-blocks deleted-block-uuids]
    "Transact data to db

    - added-blocks: list of blocks to be added
    - deleted-block-uuids: set of #uuid")
  (fetch-initital [this repo-name opts])
  (fetch-by-exclude [this repo-name exclude-uuids opts]))


