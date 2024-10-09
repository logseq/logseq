(ns frontend.worker.device
  "Each device is assigned an id, and has some metadata(e.g. public&private-key for each device)"
  (:require [datascript.core :as d]
            [frontend.worker.crypt :as crypt]
            [frontend.worker.state :as worker-state]
            [promesa.core :as p]))

(defn <ensure-device-metadata!
  "Generate new device entity if not exists"
  [repo]
  (let [conn (worker-state/get-client-ops-conn repo)]
    (assert (some? conn) repo)
    (assert (empty? (d/datoms @conn :device/uuid)) "device entity already exists")
    (p/let [device-uuid (d/squuid)
            {:keys [publicKey privateKey]} (crypt/<gen-key-pair)
            public-key-jwk (crypt/<export-key publicKey)
            private-key-jwk (crypt/<export-key privateKey)]
      (d/transact! conn [{:device/uuid device-uuid
                          :device/public-key-jwk public-key-jwk
                          :device/private-key-jwk private-key-jwk}]))))
