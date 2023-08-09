(ns frontend.persist-db.protocol
  "Provides protocol for persisting db"
  (:require))

;; TODO: exporting, importing support
(defprotocol PersistentDB
  (<new [this repo])
  (<transact-data [this repo added-blocks deleted-block-uuids]
    "Transact data to db

    - added-blocks: list of blocks to be added
    - deleted-block-uuids: set of #uuid")
  (<fetch-initital-data [this repo opts])
  (<fetch-blocks-excluding [this repo exclude-uuids opts])

  (<rtc-init [this repo])
  (<rtc-add-ops [this repo raw-ops])
  (<rtc-clean-ops [this repo])
  (<rtc-get-ops [this repo]))


