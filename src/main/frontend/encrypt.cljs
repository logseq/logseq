(ns frontend.encrypt
  "Encryption related fns for use with encryption feature and file sync"
  (:require [logseq.graph-parser.utf8 :as utf8]
            [frontend.util :as util]
            [promesa.core :as p]
            [electron.ipc :as ipc]
            [frontend.mobile.util :as mobile-util]))

(defn encrypt-with-passphrase
  [passphrase content]
  (cond
    (util/electron?)
    (p/let [raw-content (utf8/encode content)
            encrypted (ipc/ipc "encrypt-with-passphrase" passphrase raw-content)]
      (utf8/decode encrypted))

    (mobile-util/native-platform?)
    (p/chain (.encryptWithPassphrase mobile-util/file-sync
                                     (clj->js {:passphrase passphrase :content content}))
             #(js->clj % :keywordize-keys true)
             :data)

    :else
    nil))

(defn decrypt-with-passphrase
  [passphrase content]
  (cond
    (util/electron?)
    (p/let [raw-content (utf8/encode content)
            decrypted (ipc/ipc "decrypt-with-passphrase" passphrase raw-content)]
      (utf8/decode decrypted))

    (mobile-util/native-platform?)
    (p/chain (.decryptWithPassphrase mobile-util/file-sync
                                     (clj->js {:passphrase passphrase :content content}))
             #(js->clj % :keywordize-keys true)
             :data)

    :else
    nil))
