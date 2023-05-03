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
            [logseq.common.path :as path]))

(defn- contents-matched?
  [disk-content db-content]
  (when (and (string? disk-content) (string? db-content))
    (p/resolved (= (string/trim disk-content) (string/trim db-content)))))

(defn- write-file-impl!
  [repo dir rpath content {:keys [ok-handler error-handler old-content skip-compare?]} stat]
  (let [file-fpath (path/path-join dir rpath)]
    (if skip-compare?
      (p/catch
       (p/let [result (ipc/ipc "writeFile" repo file-fpath content)]
         (when ok-handler
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
        (cond
          (and
           (not= stat :not-found)         ; file on the disk was deleted
           (not contents-matched?)
           (not (contains? #{"excalidraw" "edn" "css"} ext))
           (not (string/includes? rpath "/.recycle/")))
          (state/pub-event! [:file/not-matched-from-disk rpath disk-content content])

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
                   (do
                     (println "NOTE: Using mocked dir" dir-path)
                     (ipc/ipc "getFiles" dir-path))
                   (ipc/ipc "openDir" {}))
          result (bean/->clj result)]
    result))

(defrecord Node []
  protocol/Fs
  (mkdir! [_this dir]
    (-> (ipc/ipc "mkdir" dir)
        (p/then (fn [_] (js/console.log (str "Directory created: " dir))))
        (p/catch (fn [error]
                   (when (not= (.-code error) "EEXIST")
                     (js/console.error (str "Error creating directory: " dir) error))))))

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
    ;; !Too dangerous! We'll never implement this.
    nil)

  (read-file [_this dir path _options]
    (let [path (if (nil? dir)
                 path
                 (path/path-join dir path))]
      (ipc/ipc "readFile" path)))

  (write-file! [this repo dir path content opts]
    (p/let [fpath (path/path-join dir path)
            stat (p/catch
                  (protocol/stat this fpath)
                  (fn [_e] :not-found))
            parent-dir (path/parent fpath)
            _ (protocol/mkdir-recur! this parent-dir)]
      (write-file-impl! repo dir path content opts stat)))

  (rename! [_this _repo old-path new-path]
    (ipc/ipc "rename" old-path new-path))

  (stat [_this fpath]
    (-> (ipc/ipc "stat" fpath)
        (p/then bean/->clj)))

  (open-dir [_this dir]
    (open-dir dir))

  (get-files [_this dir]
    (-> (ipc/ipc "getFiles" dir)
        (p/then (fn [result]
                  (:files (bean/->clj result))))))

  (watch-dir! [_this dir options]
    (ipc/ipc "addDirWatcher" dir options))

  (unwatch-dir! [_this dir]
    (ipc/ipc "unwatchDir" dir)))
