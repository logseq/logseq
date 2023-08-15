(ns frontend.persist-db.node
  "Electron ipc based persistent db"
  (:require [electron.ipc :as ipc]
            [frontend.persist-db.protocol :as protocol]))

(defrecord ElectronIPC []
  protocol/PersistentDB
  (<new [_this repo]
    (prn ::new repo)
    (ipc/ipc :db-new repo))
  (<transact-data [_this repo added-blocks deleted-block-uuids]
    ;; (prn ::transact-data repo added-blocks deleted-block-uuids)
    (ipc/ipc :db-transact-data repo
             (pr-str
              {:blocks added-blocks
               :deleted-block-uuids deleted-block-uuids})))
  (<fetch-initital-data [_this repo _opts]
    (prn ::fetch-initial repo)
    (ipc/ipc :get-initial-data repo))
  (<fetch-blocks-excluding [_this repo exclude-uuids _opts]
    (prn ::fetch-by-exclude repo exclude-uuids)
    (ipc/ipc :get-other-data repo exclude-uuids)))
