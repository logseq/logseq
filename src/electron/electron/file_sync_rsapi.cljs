(ns electron.file-sync-rsapi
  (:require ["@logseq/rsapi" :as rsapi]
            [electron.window :as window]
            [electron.logger :as logger]
            [cljs-bean.core :as bean]))

(defn- init-logger [log-fn] (rsapi/initLogger log-fn))

(defn key-gen [] (rsapi/keygen))

(defn set-env [graph-uuid env private-key public-key]
  (rsapi/setEnv graph-uuid env private-key public-key))

(defn set-progress-callback [callback]
  (rsapi/setProgressCallback callback))

(defn get-local-files-meta [graph-uuid base-path file-paths]
  (rsapi/getLocalFilesMeta graph-uuid base-path (clj->js file-paths)))

(defn get-local-all-files-meta [graph-uuid base-path]
  (rsapi/getLocalAllFilesMeta graph-uuid base-path))

(defn rename-local-file [graph-uuid base-path from to]
  (rsapi/renameLocalFile graph-uuid base-path from to))

(defn delete-local-files [graph-uuid base-path file-paths]
  (rsapi/deleteLocalFiles graph-uuid base-path (clj->js file-paths)))

(defn fetch-remote-files [graph-uuid base-path file-paths token]
  (rsapi/fetchRemoteFiles graph-uuid base-path (clj->js file-paths) token))

(defn update-local-files [graph-uuid base-path file-paths token]
  (rsapi/updateLocalFiles graph-uuid base-path (clj->js file-paths) token))

(defn download-version-files [graph-uuid base-path file-paths token]
  (rsapi/updateLocalVersionFiles graph-uuid base-path (clj->js file-paths) token))

(defn delete-remote-files [graph-uuid base-path file-paths txid token]
  (rsapi/deleteRemoteFiles graph-uuid base-path (clj->js file-paths) txid token))

(defn update-remote-files [graph-uuid base-path file-paths txid token]
  (rsapi/updateRemoteFiles graph-uuid base-path (clj->js file-paths) txid token))

(defn encrypt-fnames [graph-uuid fnames]
  (rsapi/encryptFnames graph-uuid (clj->js fnames)))

(defn decrypt-fnames [graph-uuid fnames]
  (rsapi/decryptFnames graph-uuid (clj->js fnames)))

(defn encrypt-with-passphrase [passphrase data]
  (rsapi/ageEncryptWithPassphrase passphrase data))

(defn decrypt-with-passphrase [passphrase data]
  (rsapi/ageDecryptWithPassphrase passphrase data))

(defn cancel-all-requests []
  (rsapi/cancelAllRequests))

(defonce progress-notify-chan "file-sync-progress")
(set-progress-callback (fn [error progress-info]
                         (when-not error
                           (doseq [^js win (window/get-all-windows)]
                             (when-not (.isDestroyed win)
                               (.. win -webContents
                                   (send progress-notify-chan (bean/->js progress-info))))))))

(init-logger (fn [_error record]
               (let [[level message] record]
                 (case level
                   "ERROR" (logger/error message)
                   "WARN" (logger/warn message)
                   "INFO" (logger/info message)
                   "DEBUG" (logger/debug message)
                   (logger/debug message)))))
