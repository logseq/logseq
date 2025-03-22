(ns frontend.worker.db-metadata
  "Fns to read/write metadata.edn file for db-based."
  (:require [frontend.worker.util :as worker-util]
            [promesa.core :as p]))

(defn <store
  [repo metadata-str]
  (p/let [^js root (.getDirectory js/navigator.storage)
          dir-handle (.getDirectoryHandle root (str "." (worker-util/get-pool-name repo)))
          file-handle (.getFileHandle dir-handle "metadata.edn" #js {:create true})
          writable (.createWritable file-handle)
          _ (.write writable metadata-str)]
    (.close writable)))
