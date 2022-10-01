(ns electron.file-sync-rsapi
  (:require ["os" :as os]
            [electron.window :as window]
            [cljs-bean.core :as bean]
            [clojure.string :as string]))

(if (and (= (.platform os) "win32")
         (string/starts-with? (.release os) "6."))
  (defonce rsapi nil)
  (defonce rsapi (js/require "@logseq/rsapi")))

(defn key-gen []
  (.keygen rsapi))

(defn set-env [graph-uuid env private-key public-key]
  (.setEnv rsapi graph-uuid env private-key public-key))

(defn set-progress-callback [callback]
  (.setProgressCallback rsapi callback))

(defn get-local-files-meta [graph-uuid base-path file-paths]
  (.getLocalFilesMeta rsapi graph-uuid base-path (clj->js file-paths)))

(defn get-local-all-files-meta [graph-uuid base-path]
  (.getLocalAllFilesMeta rsapi graph-uuid base-path))

(defn rename-local-file [graph-uuid base-path from to]
  (.renameLocalFile rsapi graph-uuid base-path from to))

(defn delete-local-files [graph-uuid base-path file-paths]
  (.deleteLocalFiles rsapi graph-uuid base-path (clj->js file-paths)))

(defn update-local-files [graph-uuid base-path file-paths token]
  (.updateLocalFiles rsapi graph-uuid base-path (clj->js file-paths) token))

(defn download-version-files [graph-uuid base-path file-paths token]
  (.updateLocalVersionFiles rsapi graph-uuid base-path (clj->js file-paths) token))

(defn delete-remote-files [graph-uuid base-path file-paths txid token]
  (.deleteRemoteFiles rsapi graph-uuid base-path (clj->js file-paths) txid token))

(defn update-remote-files [graph-uuid base-path file-paths txid token]
  (.updateRemoteFiles rsapi graph-uuid base-path (clj->js file-paths) txid token true))

(defn encrypt-fnames [graph-uuid fnames]
  (.encryptFnames rsapi graph-uuid (clj->js fnames)))

(defn decrypt-fnames [graph-uuid fnames]
  (.decryptFnames rsapi graph-uuid (clj->js fnames)))

(defn encrypt-with-passphrase [passphrase data]
  (.ageEncryptWithPassphrase rsapi passphrase data))

(defn decrypt-with-passphrase [passphrase data]
  (.ageDecryptWithPassphrase rsapi passphrase data))

(defn cancel-all-requests []
  (.cancelAllRequests rsapi))

(defonce progress-notify-chan "file-sync-progress")

(when rsapi
  (set-progress-callback (fn [error progress-info]
                           (when-not error
                             (doseq [^js win (window/get-all-windows)]
                               (when-not (.isDestroyed win)
                                 (.. win -webContents
                                     (send progress-notify-chan (bean/->js progress-info)))))))))

