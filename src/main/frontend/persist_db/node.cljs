(ns frontend.persist-db.node
  "Electron ipc based persistent db"
  (:require [cljs.core.async.interop :refer [p->c]]
            [electron.ipc :as ipc]
            [frontend.persist-db.protocol :as protocol]
            [promesa.core :as p]))

(defrecord ElectronIPC []
  protocol/PersistentDB
  (<new [_this repo]
    (prn ::new repo)
    (ipc/ipc :db-new repo))

  (<list-db [_this]
    (js/console.warn "TODO: list-db for electron is not implemented")
    [])
  (<unsafe-delete [_this _repo]
    (js/console.warn "TODO: delete")
    (p/resolved nil))
  (<transact-data [_this repo added-blocks deleted-block-uuids]
    ;; (prn ::transact-data repo added-blocks deleted-block-uuids)
    (p->c
     (ipc/ipc :db-transact-data repo
              (pr-str
               {:blocks added-blocks
                :deleted-block-uuids deleted-block-uuids}))))
  (<fetch-initital-data [_this repo _opts]
    (prn ::fetch-initial repo)
    (ipc/ipc :get-initial-data repo))
  (<fetch-blocks-excluding [_this repo exclude-uuids _opts]
    (prn ::fetch-by-exclude repo exclude-uuids)
    (ipc/ipc :get-other-data repo exclude-uuids)))
