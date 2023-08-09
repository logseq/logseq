(ns frontend.persist-db.node
  "Electron ipc based persistent db"
  (:require [frontend.persist-db.protocol :as protocol]
            [electron.ipc :as ipc]))

(defrecord ElectronIPC []
  protocol/PersistentDB
  (<new [_this repo]
    (prn ::new repo)
    ;; FIXME: electron ipc use `:remove-db` for removing search index, which is misleading
    (ipc/ipc :db-new repo))
  (<transact-data [_this repo added-blocks deleted-block-uuids]
    (prn ::transact-data repo added-blocks deleted-block-uuids)
    (prn (pr-str deleted-block-uuids))
    ; ( repo added-blocks deleted-block-uuids)
    (ipc/ipc :db-transact-data repo
             (pr-str
              {:blocks added-blocks
               :deleted-block-uuids deleted-block-uuids})))
  (<fetch-initital-data [_this repo _opts]
    (prn ::fetch-initial repo)
    (ipc/ipc :get-initial-data repo))
  (<fetch-blocks-excluding [_this repo exclude-uuids _opts]
    (prn ::fetch-by-exclude repo exclude-uuids)
    (ipc/ipc :get-other-data repo exclude-uuids))

  (<rtc-init [_this repo]
    (ipc/ipc :rtc/init repo))
  (<rtc-add-ops [_this repo raw-ops]
    (ipc/ipc :rtc/add-ops repo raw-ops))
  (<rtc-clean-ops [_this repo]
    (ipc/ipc :rtc/clean-ops repo))
  (<rtc-get-ops [_this repo]
    (ipc/ipc :rtc/get-ops&local-tx repo)))

