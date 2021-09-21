(ns frontend.fs.node
  (:require [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.encrypt :as encrypt]
            [frontend.fs.protocol :as protocol]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [frontend.debug :as debug]))

(defn concat-path
  [dir path]
  (cond
    (nil? path)
    dir

    (string/starts-with? path dir)
    path

    :else
    (str (string/replace dir #"/$" "")
         (when path
           (str "/" (string/replace path #"^/" ""))))))

(defn- contents-matched?
  [disk-content db-content]
  (when (and (string? disk-content) (string? db-content))
    (if (encrypt/encrypted-db? (state/get-current-repo))
      (p/let [decrypted-content (encrypt/decrypt disk-content)]
        (= (string/trim decrypted-content) (string/trim db-content)))
      (p/resolved (= (string/trim disk-content) (string/trim db-content))))))

(defn- write-file-impl!
  [this repo dir path content {:keys [ok-handler error-handler skip-compare?] :as opts} stat]
  (if skip-compare?
    (p/catch
        (p/let [result (ipc/ipc "writeFile" path content)]
          (when ok-handler
            (ok-handler repo path result)))
        (fn [error]
          (if error-handler
            (error-handler error)
            (log/error :write-file-failed error))))

    (p/let [disk-content (when (not= stat :not-found)
                           (-> (protocol/read-file this dir path nil)
                               (p/catch (fn [error]
                                          (js/console.error error)
                                          nil))))
            disk-content (or disk-content "")
            ext (string/lower-case (util/get-file-ext path))
            file-page (db/get-file-page-id path)
            page-empty? (and file-page (db/page-empty? repo file-page))
            db-content (or (db/get-file repo path) "")
            contents-matched? (contents-matched? disk-content db-content)
            pending-writes (state/get-write-chan-length)]
      (cond
        (and
         (not= stat :not-found)         ; file on the disk was deleted
         (not contents-matched?)
         (not (contains? #{"excalidraw" "edn"} ext))
         (not (string/includes? path "/.recycle/"))
         (zero? pending-writes))
        (do
          (when (util/electron?)
            (debug/set-ack-step! path :saved-successfully)
            (debug/ack-file-write! path))
          (state/pub-event! [:file/not-matched-from-disk path disk-content content]))

        :else
        (->
         (p/let [result (ipc/ipc "writeFile" path content)
                 mtime (gobj/get result "mtime")]
           (when (util/electron?)
             (debug/set-ack-step! path :saved-successfully)
             (debug/ack-file-write! path))
           (db/set-file-last-modified-at! repo path mtime)
           (p/let [content (if (encrypt/encrypted-db? (state/get-current-repo))
                             (encrypt/decrypt content)
                             content)]
             (db/set-file-content! repo path content))
           (when ok-handler
             (ok-handler repo path result))
           result)
         (p/catch (fn [error]
                    (state/pub-event! [:instrument {:type :debug/write-failed
                                                    :payload {:step :ipc-write-file
                                                              :error error}}])
                    (if error-handler
                      (error-handler error)
                      (log/error :write-file-failed error)))))))))

(defrecord Node []
  protocol/Fs
  (mkdir! [this dir]
    (ipc/ipc "mkdir" dir))
  (mkdir-recur! [this dir]
    (ipc/ipc "mkdir-recur" dir))
  (readdir [this dir]                   ; recursive
    (ipc/ipc "readdir" dir))
  (unlink! [this repo path _opts]
    (ipc/ipc "unlink"
             (config/get-repo-dir repo)
             path))
  (rmdir! [this dir]
    ;; Too dangerious!!! We'll never implement this.
    nil)
  (read-file [this dir path _options]
    (let [path (concat-path dir path)]
      (ipc/ipc "readFile" path)))
  (write-file! [this repo dir path content {:keys [ok-handler error-handler] :as opts}]
    (let [path (concat-path dir path)]
      (p/let [stat (p/catch
                       (protocol/stat this dir path)
                       (fn [_e] :not-found))
              sub-dir (first (util/get-dir-and-basename path))
              _ (protocol/mkdir-recur! this sub-dir)]
        (write-file-impl! this repo dir path content opts stat))))
  (rename! [this repo old-path new-path]
    (ipc/ipc "rename" old-path new-path))
  (stat [this dir path]
    (let [path (concat-path dir path)]
      (ipc/ipc "stat" path)))
  (open-dir [this ok-handler]
    (ipc/ipc "openDir" {}))
  (get-files [this path-or-handle ok-handler]
    (ipc/ipc "getFiles" path-or-handle))
  (watch-dir! [this dir]
    (ipc/ipc "addDirWatcher" dir)))
