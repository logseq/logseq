(ns frontend.persist-db.node
  "Electron ipc based persistent db"
  (:require [frontend.persist-db.protocol :as protocol]
            [electron.ipc :as ipc]))

(defrecord ElectronIPC []
  protocol/PersistentDB
  (new [_this repo-name]
    (prn ::new repo-name)
    ;; FIXME: electron ipc use `:remove-db` for removing search index, which is misleading
    (ipc/ipc :db-new repo-name))
  (transact-data [_this repo-name added-blocks deleted-block-uuids]
    (prn ::transact-data repo-name added-blocks deleted-block-uuids)
    (prn (pr-str deleted-block-uuids))
    ; ( repo-name added-blocks deleted-block-uuids)
    (ipc/ipc :db-transact-data repo-name
             (pr-str
              {:blocks added-blocks
               :deleted-block-uuids deleted-block-uuids})))
  (fetch-initital [_this repo-name _opts]
    (prn ::fetch-initial repo-name)
    (ipc/ipc :get-initial-data repo-name))
  (fetch-by-exclude [_this repo-name exclude-uuids _opts]
    (prn ::fetch-by-exclude repo-name exclude-uuids)
    (ipc/ipc :get-other-data repo-name exclude-uuids)))

