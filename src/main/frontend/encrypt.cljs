(ns frontend.encrypt
  "Encryption related fns for use with encryption feature and file sync"
  (:require [electron.ipc :as ipc]
            [frontend.util :as util]
            [logseq.graph-parser.utf8 :as utf8]
            [promesa.core :as p]))

(defn encrypt-with-passphrase
  [passphrase content]
  (when (util/electron?)
    (p/let [raw-content (utf8/encode content)
            encrypted (ipc/ipc "encrypt-with-passphrase" passphrase raw-content)]
      (utf8/decode encrypted))))

(defn decrypt-with-passphrase
  [passphrase content]
  (when (util/electron?)
    (p/let [raw-content (utf8/encode content)
            decrypted (ipc/ipc "decrypt-with-passphrase" passphrase raw-content)]
      (utf8/decode decrypted))))
