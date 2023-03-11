(ns frontend.fs.node
  "Implementation of fs protocol for Electron, based on nodejs"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.fs.protocol :as protocol]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [frontend.fs2.path :as fs2-path]))

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

(defn- write-file-without-backup
  [repo dir path content ok-handler error-handler]
  (p/catch
   (p/let [result (ipc/ipc "writeFile" repo path content)]
     (when ok-handler
       (ok-handler repo path result)))
   (fn [error]
     (if error-handler
       (error-handler error)
       (log/error :write-file-failed error))))
  )

(defn- write-file-impl!
  [repo dir rpath content {:keys [ok-handler error-handler old-content skip-compare?]} stat]
  (prn ::write-file-impl repo dir rpath)
  (let [file-fpath (fs2-path/path-join dir rpath)]
    (if skip-compare?
      (p/catch
       (p/let [result (ipc/ipc "writeFile" repo file-fpath content)]
         (when ok-handler
           (prn ::fuck :why-are-you-using-ok-handler)
           (ok-handler repo rpath result)))
       (fn [error]
         (if error-handler
           (error-handler error)
           (log/error :write-file-failed error))))

      (p/let [disk-content (when (not= stat :not-found)
                             (-> (ipc/ipc "readFile" file-fpath)
                                 (p/then bean/->clj)
                                 (p/catch (fn [error]
                                            (js/console.error error)
                                            nil))))
              disk-content (or disk-content "")
              ext (string/lower-case (util/get-file-ext rpath))
              db-content (or old-content (db/get-file repo rpath) "")
              contents-matched? (contents-matched? disk-content db-content)]
        (prn ::disk disk-content ::db db-content ::new content)
        (cond
          (and
           (not= stat :not-found)         ; file on the disk was deleted
           (not contents-matched?)
           (not (contains? #{"excalidraw" "edn" "css"} ext))
           (not (string/includes? rpath "/.recycle/")))
          (do
            (prn ::?????)
            (state/pub-event! [:file/not-matched-from-disk rpath disk-content content]))

          :else
          (->
           (p/let [result (ipc/ipc "writeFile" repo file-fpath content)
                   mtime (gobj/get result "mtime")]
             (when-not contents-matched?
               (ipc/ipc "backupDbFile" (config/get-local-dir repo) rpath disk-content content))
             (db/set-file-last-modified-at! repo rpath mtime)
             (db/set-file-content! repo rpath content)
             (when ok-handler
               (ok-handler repo rpath result))
             result)
           (p/catch (fn [error]
                      (if error-handler
                        (error-handler error)
                        (log/error :write-file-failed error))))))))))

(defn- open-dir
  "Open a new directory"
  [dir]
  (p/let [dir-path (or dir (util/mocked-open-dir-path))
          result (if dir-path
                   (ipc/ipc "getFiles" dir-path)
                   (ipc/ipc "openDir" {}))]
    (prn ::open-dir result)
    result))

(defn- <ensure-dir!
  [fs dir]
  (protocol/mkdir-recur! fs dir))

(defn- <exists
  [fs path]

  )

(defrecord Node []
  protocol/Fs
  (mkdir! [_this dir]
    (ipc/ipc "mkdir" dir))
  (mkdir-recur! [_this dir]
    (ipc/ipc "mkdir-recur" dir))
  (readdir [_this dir]                   ; recursive
    (p/then (ipc/ipc "readdir" dir)
            bean/->clj))
  (unlink! [_this repo path _opts]
    (ipc/ipc "unlink"
             (config/get-repo-dir repo)
             path))
  (rmdir! [_this _dir]
    ;; Too dangerious!!! We'll never implement this.
    nil)
  (read-file [_this dir path _options]
    (let [path (fs2-path/path-join dir path)]
      (ipc/ipc "readFile" path)))
  (write-file! [this repo dir path content opts]
    (p/let [stat (p/catch
                  (protocol/stat this dir path)
                  (fn [_e] :not-found))
            sub-dir (first (util/get-dir-and-basename path)) ;; FIXME: todo dirname
            _ (protocol/mkdir-recur! this sub-dir)]
      (write-file-impl! repo dir path content opts stat)))
  (rename! [_this _repo old-path new-path]
    (ipc/ipc "rename" old-path new-path))
  (stat [_this dir path]
    (let [path (fs2-path/path-join dir path)]
      (ipc/ipc "stat" path)))
  (open-dir [_this dir _ok-handler]
    (p/then (open-dir dir)
            bean/->clj))
  (list-files [_this dir _ok-handler]
    (-> (ipc/ipc "getFiles" dir)
        (p/then bean/->clj)))
  (watch-dir! [_this dir options]
    (ipc/ipc "addDirWatcher" dir options))
  (unwatch-dir! [_this dir]
    (ipc/ipc "unwatchDir" dir)))
