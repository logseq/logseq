(ns frontend.persist-db.protocol
  "Provides protocol for persisting db"
  (:require))

;; TODO: exporting, importing support
(defprotocol PersistentDB
  (<list-db [this])
  (<new [this repo])
  (<unsafe-delete [this repo])
  (<transact-data [this repo tx-data tx-meta] "Transact data to db")
  (<fetch-initital-data [this repo opts])
  (<fetch-blocks-excluding [this repo exclude-uuids opts]))
