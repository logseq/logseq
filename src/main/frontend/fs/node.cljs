(ns frontend.fs.node
  "Implementation of fs protocol for desktop"
  (:require [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.fs.protocol :as protocol]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

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
    (p/resolved (= (string/trim disk-content) (string/trim db-content)))))

(defn- write-file-impl!
  [this repo dir path content {:keys [ok-handler error-handler old-content skip-compare?]} stat]
  (if skip-compare?
    (p/catch
        (p/let [result (ipc/ipc "writeFile" repo path content)]
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
            db-content (or old-content (db/get-file repo path) "")
            contents-matched? (contents-matched? disk-content db-content)]
      (cond
        (and
         (not= stat :not-found)         ; file on the disk was deleted
         (not contents-matched?)
         (not (contains? #{"excalidraw" "edn" "css"} ext))
         (not (string/includes? path "/.recycle/")))
        (state/pub-event! [:file/not-matched-from-disk path disk-content content])

        :else
        (->
         (p/let [result (ipc/ipc "writeFile" repo path content)
                 mtime (gobj/get result "mtime")]
           (when-not contents-matched?
             (ipc/ipc "backupDbFile" (config/get-local-dir repo) path disk-content content))
           (db/set-file-last-modified-at! repo path mtime)
           (db/set-file-content! repo path content)
           (when ok-handler
             (ok-handler repo path result))
           result)
         (p/catch (fn [error]
                    (if error-handler
                      (error-handler error)
                      (log/error :write-file-failed error)))))))))

(defn- open-dir [dir]
  (p/let [dir-path (or dir (util/mocked-open-dir-path))
          result (if dir-path
                   (ipc/ipc "getFiles" dir-path)
                   (ipc/ipc "openDir" {}))]
    result))

(defrecord Node []
  protocol/Fs
  (mkdir! [_this dir]
    (ipc/ipc "mkdir" dir))
  (mkdir-recur! [_this dir]
    (ipc/ipc "mkdir-recur" dir))
  (readdir [_this dir]                   ; recursive
    (ipc/ipc "readdir" dir))
  (unlink! [_this repo path _opts]
    (ipc/ipc "unlink"
             (config/get-repo-dir repo)
             path))
  (rmdir! [_this _dir]
    ;; Too dangerious!!! We'll never implement this.
    nil)
  (read-file [_this dir path _options]
    (let [path (concat-path dir path)]
      (ipc/ipc "readFile" path)))
  (write-file! [this repo dir path content opts]
    (let [path (concat-path dir path)]
      (p/let [stat (p/catch
                       (protocol/stat this dir path)
                       (fn [_e] :not-found))
              sub-dir (first (util/get-dir-and-basename path))
              _ (protocol/mkdir-recur! this sub-dir)]
        (write-file-impl! this repo dir path content opts stat))))
  (rename! [_this _repo old-path new-path]
    (ipc/ipc "rename" old-path new-path))
  (stat [_this dir path]
    (let [path (concat-path dir path)]
      (ipc/ipc "stat" path)))
  (open-dir [_this dir _ok-handler]
    (open-dir dir))
  (get-files [_this path-or-handle _ok-handler]
    (ipc/ipc "getFiles" path-or-handle))
  (watch-dir! [_this dir options]
    (ipc/ipc "addDirWatcher" dir options))
  (unwatch-dir! [_this dir]
    (ipc/ipc "unwatchDir" dir)))
